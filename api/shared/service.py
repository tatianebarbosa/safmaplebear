"""Business logic backed by Postgres (Neon) via SQLAlchemy."""
from __future__ import annotations

from collections import Counter
from typing import Dict, List

from sqlalchemy import func, select

from .db import get_session
from .db_models import AuditLog, School, User
from .model import (
    OfficialUser,
    SchoolOverview,
    LicenseAction,
    LicenseBadgeHelper,
    APIResponse,
)

# Limite padrão caso não haja valor salvo no banco
DEFAULT_MAX_LICENSE_LIMIT = 2


class DataProcessingService:
    """Service layer que lê/escreve no Postgres."""

    # --- Consultas ---
    def get_schools_overview(self) -> List[SchoolOverview]:
        """Lista escolas com uso de licenças calculado a partir do banco."""
        with get_session() as session:
            usage_rows = (
                session.execute(
                    select(User.school_id, func.count())
                    .where(User.has_canva.is_(True))
                    .group_by(User.school_id)
                ).all()
            )
            usage_map = {sid: cnt for sid, cnt in usage_rows}
            schools = session.execute(select(School)).scalars().all()

        overviews: List[SchoolOverview] = []
        for school in schools:
            used = usage_map.get(school.id, 0)
            limit = school.license_limit or DEFAULT_MAX_LICENSE_LIMIT
            overviews.append(
                SchoolOverview(
                    id=school.id,
                    name=school.name,
                    status=school.status or "",
                    cluster=school.cluster or "",
                    city=school.city or "",
                    state=school.state or "",
                    region=school.region or "",
                    carteira_saf=school.carteira_saf or "",
                    used=used,
                    limit=limit,
                    badge=LicenseBadgeHelper.generate_badge(used, limit),
                    contact={
                        "phone": school.contact_phone or "",
                        "email": school.contact_email or "",
                        "address": f"{school.address or ''}, {school.neighborhood or ''}, {school.city or ''}/{school.state or ''}",
                    },
                )
            )
        return overviews

    def get_school_users(self, school_id: str) -> List[OfficialUser]:
        """Retorna usuários de uma escola."""
        with get_session() as session:
            school = session.get(School, school_id)
            users = (
                session.execute(
                    select(User).where(User.school_id == school_id)
                ).scalars().all()
            )

        school_name = school.name if school else ""
        result: List[OfficialUser] = []
        for user in users:
            result.append(
                OfficialUser(
                    name=user.name or "",
                    email=user.email,
                    role="",  # role não está modelada na tabela atual
                    school_name=school_name,
                    school_id=school_id,
                    status_licenca="Ativa" if user.has_canva else "Sem licença",
                    has_canva=user.has_canva,
                    is_compliant=user.is_compliant,
                )
            )
        return result

    # --- Ações de licença ---
    def assign_license(self, action: LicenseAction, actor: str) -> Dict[str, any]:
        """Concede licença a um usuário."""
        try:
            with get_session() as session:
                school = session.get(School, action.school_id)
                if not school:
                    return APIResponse.error("Escola não encontrada")

                user = (
                    session.execute(
                        select(User).where(
                            User.school_id == action.school_id,
                            User.email == action.user_email,
                        )
                    )
                    .scalars()
                    .first()
                )
                if not user:
                    return APIResponse.error("Usuário não encontrado na escola")
                if user.has_canva:
                    return APIResponse.error("Usuário já possui licença Canva")
                if not user.is_compliant:
                    return APIResponse.error("Email do usuário não pertence a domínio autorizado")

                used = (
                    session.execute(
                        select(func.count())
                        .select_from(User)
                        .where(User.school_id == action.school_id, User.has_canva.is_(True))
                    ).scalar_one()
                )
                limit = school.license_limit or DEFAULT_MAX_LICENSE_LIMIT
                if used >= limit:
                    return APIResponse.error("Limite de licenças atingido para a escola")

                user.has_canva = True
                session.add(
                    self._build_audit(
                        "assign",
                        action,
                        actor,
                        {"user_email": action.user_email, "motivo": action.motivo, "ticket": action.ticket},
                    )
                )
                session.commit()

            return APIResponse.success(message="Licença atribuída com sucesso")
        except Exception as e:
            return APIResponse.error(f"Erro ao atribuir licença: {str(e)}")

    def revoke_license(self, action: LicenseAction, actor: str) -> Dict[str, any]:
        """Revoga licença de um usuário."""
        try:
            with get_session() as session:
                user = (
                    session.execute(
                        select(User).where(
                            User.school_id == action.school_id,
                            User.email == action.user_email,
                        )
                    )
                    .scalars()
                    .first()
                )
                if not user:
                    return APIResponse.error("Usuário não encontrado na escola")
                if not user.has_canva:
                    return APIResponse.error("Usuário não possui licença Canva")

                user.has_canva = False
                session.add(
                    self._build_audit(
                        "revoke",
                        action,
                        actor,
                        {"user_email": action.user_email, "motivo": action.motivo, "ticket": action.ticket},
                    )
                )
                session.commit()

            return APIResponse.success(message="Licença revogada com sucesso")
        except Exception as e:
            return APIResponse.error(f"Erro ao revogar licença: {str(e)}")

    def transfer_license(self, action: LicenseAction, actor: str) -> Dict[str, any]:
        """Transfere licença entre usuários da mesma escola."""
        try:
            with get_session() as session:
                from_user = (
                    session.execute(
                        select(User).where(
                            User.school_id == action.school_id,
                            User.email == action.from_email,
                        )
                    )
                    .scalars()
                    .first()
                )
                to_user = (
                    session.execute(
                        select(User).where(
                            User.school_id == action.school_id,
                            User.email == action.to_email,
                        )
                    )
                    .scalars()
                    .first()
                )

                if not from_user:
                    return APIResponse.error("Usuário de origem não encontrado na escola")
                if not to_user:
                    return APIResponse.error("Usuário de destino não encontrado na escola")
                if not from_user.has_canva:
                    return APIResponse.error("Usuário de origem não possui licença Canva")
                if to_user.has_canva:
                    return APIResponse.error("Usuário de destino já possui licença Canva")
                if not to_user.is_compliant:
                    return APIResponse.error("Email do usuário de destino não é de domínio autorizado")

                from_user.has_canva = False
                to_user.has_canva = True
                session.add(
                    self._build_audit(
                        "transfer",
                        action,
                        actor,
                        {
                            "from_email": action.from_email,
                            "to_email": action.to_email,
                            "motivo": action.motivo,
                            "ticket": action.ticket,
                        },
                    )
                )
                session.commit()

            return APIResponse.success(message="Licença transferida com sucesso")
        except Exception as e:
            return APIResponse.error(f"Erro ao transferir licença: {str(e)}")

    def change_school_limit(self, school_id: str, new_limit: int, motivo: str, actor: str) -> Dict[str, any]:
        """Altera limite de licenças de uma escola."""
        try:
            if new_limit < 0:
                return APIResponse.error("Limite deve ser maior ou igual a zero")

            with get_session() as session:
                school = session.get(School, school_id)
                if not school:
                    return APIResponse.error("Escola não encontrada")

                old_limit = school.license_limit or DEFAULT_MAX_LICENSE_LIMIT
                school.license_limit = new_limit
                action = LicenseAction(school_id=school_id, new_limit=new_limit, motivo=motivo)
                session.add(
                    self._build_audit(
                        "alter_limit",
                        action,
                        actor,
                        {"old_limit": old_limit, "new_limit": new_limit, "motivo": motivo},
                    )
                )
                session.commit()

            return APIResponse.success(message="Limite alterado com sucesso")
        except Exception as e:
            return APIResponse.error(f"Erro ao alterar limite: {str(e)}")

    def set_global_license_limit(self, new_limit: int, motivo: str, actor: str) -> Dict[str, any]:
        """Altera o limite de todas as escolas."""
        try:
            if new_limit < 0:
                return APIResponse.error("Limite deve ser maior ou igual a zero")

            with get_session() as session:
                schools = session.execute(select(School)).scalars().all()
                old_limits = {s.id: s.license_limit or DEFAULT_MAX_LICENSE_LIMIT for s in schools}
                for school in schools:
                    school.license_limit = new_limit
                    action = LicenseAction(school_id=school.id, new_limit=new_limit, motivo=motivo)
                    session.add(
                        self._build_audit(
                            "alter_limit",
                            action,
                            actor,
                            {"old_limit": old_limits.get(school.id), "new_limit": new_limit, "motivo": motivo},
                        )
                    )
                session.commit()

            return APIResponse.success(
                data={"updated": len(old_limits), "limit": new_limit},
                message="Limite global alterado com sucesso",
            )
        except Exception as e:
            return APIResponse.error(f"Erro ao alterar limite global: {str(e)}")

    def get_global_license_limit(self) -> int:
        """Retorna o limite mais comum entre as escolas."""
        with get_session() as session:
            limits = (
                session.execute(
                    select(School.license_limit).where(School.license_limit.isnot(None))
                ).scalars().all()
            )
        if not limits:
            return DEFAULT_MAX_LICENSE_LIMIT
        most_common = Counter(limits).most_common(1)
        return int(most_common[0][0]) if most_common else DEFAULT_MAX_LICENSE_LIMIT

    def reload_data(self, actor: str) -> Dict[str, any]:
        """Compat: registra no log; dados já vêm do banco."""
        try:
            with get_session() as session:
                action = LicenseAction(school_id="system")
                session.add(self._build_audit("reload_data", action, actor, {}))
                session.commit()
            return APIResponse.success(message="Dados já são lidos do banco (nada a recarregar)")
        except Exception as e:
            return APIResponse.error(f"Erro ao registrar reload: {str(e)}")

    def get_audit_logs(self, filters: Dict[str, str] = None) -> List[Dict]:
        """Obtém logs de auditoria do Postgres."""
        with get_session() as session:
            stmt = select(AuditLog)
            if filters:
                if filters.get("schoolId"):
                    stmt = stmt.where(AuditLog.school_id == filters["schoolId"])
                if filters.get("action"):
                    stmt = stmt.where(AuditLog.action == filters["action"])
                if filters.get("actor"):
                    stmt = stmt.where(AuditLog.actor.ilike(f"%{filters['actor']}%"))
            stmt = stmt.order_by(AuditLog.ts.desc())
            logs = session.execute(stmt).scalars().all()

        return [
            {
                "id": log.id,
                "action": log.action,
                "school_id": log.school_id,
                "actor": log.actor,
                "payload": log.payload or {},
                "ts": log.ts.isoformat() if log.ts else None,
            }
            for log in logs
        ]

    # --- Helpers ---
    def _build_audit(self, action: str, license_action: LicenseAction, actor: str, payload: Dict) -> AuditLog:
        return AuditLog(
            action=action,
            school_id=license_action.school_id,
            actor=actor,
            payload=payload,
        )


data_service = DataProcessingService()
