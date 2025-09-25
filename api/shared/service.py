# Business logic service layer
import pandas as pd
from typing import Dict, List, Optional, Tuple
from .blob import blob_service
from .model import (
    OfficialSchool, OfficialUser, SchoolOverview, LicenseAction, AuditLogEntry,
    LicenseBadgeHelper, EmailComplianceHelper, StatusLicencaHelper, APIResponse
)
from .unit_data_service import unit_data_service

class DataProcessingService:
    """Service for processing official data from Blob Storage"""
    
    def __init__(self):
        self._schools_cache: List[OfficialSchool] = []
        self._users_cache: List[OfficialUser] = []
        self._school_limits_cache: Dict[str, int] = {}
        self._user_overrides_cache: Dict[str, Dict] = {}
        self._last_reload = None
    
    def load_official_data(self, force_reload: bool = False) -> Tuple[List[OfficialSchool], List[OfficialUser]]:
        """Load official data from Excel/CSV files"""
        try:
            # Load school limits and user overrides
            self._school_limits_cache = blob_service.read_json_file("config/school-limits.json")
            self._user_overrides_cache = blob_service.read_json_file("data/overrides/users-overrides.json")
            
            # Load data from centralized unit_data_service
            unit_data = unit_data_service.get_unit_data()
            schools_data = unit_data.get("schools", [])
            users_data = unit_data.get("users", [])

            schools = [OfficialSchool(**s) for s in schools_data]
            users = [OfficialUser(**u) for u in users_data]
            
            self._schools_cache = schools
            self._users_cache = users
            
            return schools, users
            
        except Exception as e:
            raise Exception(f"Erro ao carregar dados oficiais: {str(e)}")
    
    # Remove _process_schools_dataframe and _process_users_dataframe as data is now loaded directly
    # from unit_data_service

    def get_schools_overview(self) -> List[SchoolOverview]:
        """Get schools with computed license usage"""
        if not self._schools_cache:
            self.load_official_data()
        
        # Calculate license usage per school
        usage_by_school = {}
        for user in self._users_cache:
            if user.has_canva and user.school_id:
                usage_by_school[user.school_id] = usage_by_school.get(user.school_id, 0) + 1
        
        # Create overview objects
        overviews = []
        for school in self._schools_cache:
            used_licenses = usage_by_school.get(school.id, 0)
            
            overview = SchoolOverview(
                id=school.id,
                name=school.name,
                status=school.status,
                cluster=school.cluster,
                city=school.city,
                state=school.state,
                region=school.region,
                carteira_saf=school.carteira_saf,
                used=used_licenses,
                limit=school.license_limit,
                badge=LicenseBadgeHelper.generate_badge(used_licenses, school.license_limit),
                contact={
                    "phone": school.phone,
                    "email": school.email,
                    "address": f"{school.address}, {school.neighborhood}, {school.city}/{school.state}"
                }
            )
            
            overviews.append(overview)
        
        return overviews
    
    def get_school_users(self, school_id: str) -> List[OfficialUser]:
        """Get users for a specific school"""
        if not self._users_cache:
            self.load_official_data()
        
        return [user for user in self._users_cache if user.school_id == school_id]
    
    def assign_license(self, action: LicenseAction, actor: str) -> Dict[str, any]:
        """Assign license to user"""
        try:
            # Validate school exists
            school = self._get_school_by_id(action.school_id)
            if not school:
                return APIResponse.error("Escola não encontrada")
            
            # Find user
            user = self._get_user_by_email(action.user_email, action.school_id)
            if not user:
                return APIResponse.error("Usuário não encontrado na escola")
            
            if user.has_canva:
                return APIResponse.error("Usuário já possui licença Canva")
            
            # Check if user email is compliant
            if not user.is_compliant:
                return APIResponse.error("Email do usuário não pertence a domínio autorizado")
            
            # Update user override
            self._update_user_override(action.school_id, action.user_email, True)
            
            # Log audit
            self._log_audit_action("assign", action, actor, {
                "user_email": action.user_email,
                "motivo": action.motivo,
                "ticket": action.ticket
            })
            
            return APIResponse.success(message="Licença atribuída com sucesso")
            
        except Exception as e:
            return APIResponse.error(f"Erro ao atribuir licença: {str(e)}")
    
    def revoke_license(self, action: LicenseAction, actor: str) -> Dict[str, any]:
        """Revoke license from user"""
        try:
            # Validate school exists
            school = self._get_school_by_id(action.school_id)
            if not school:
                return APIResponse.error("Escola não encontrada")
            
            # Find user
            user = self._get_user_by_email(action.user_email, action.school_id)
            if not user:
                return APIResponse.error("Usuário não encontrado na escola")
            
            if not user.has_canva:
                return APIResponse.error("Usuário não possui licença Canva")
            
            # Update user override
            self._update_user_override(action.school_id, action.user_email, False)
            
            # Log audit
            self._log_audit_action("revoke", action, actor, {
                "user_email": action.user_email,
                "motivo": action.motivo,
                "ticket": action.ticket
            })
            
            return APIResponse.success(message="Licença revogada com sucesso")
            
        except Exception as e:
            return APIResponse.error(f"Erro ao revogar licença: {str(e)}")
    
    def transfer_license(self, action: LicenseAction, actor: str) -> Dict[str, any]:
        """Transfer license between users in same school"""
        try:
            # Validate school exists
            school = self._get_school_by_id(action.school_id)
            if not school:
                return APIResponse.error("Escola não encontrada")
            
            # Find both users
            from_user = self._get_user_by_email(action.from_email, action.school_id)
            to_user = self._get_user_by_email(action.to_email, action.school_id)
            
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
            
            # Perform transfer (revoke + assign)
            self._update_user_override(action.school_id, action.from_email, False)
            self._update_user_override(action.school_id, action.to_email, True)
            
            # Log audit
            self._log_audit_action("transfer", action, actor, {
                "from_email": action.from_email,
                "to_email": action.to_email,
                "motivo": action.motivo,
                "ticket": action.ticket
            })
            
            return APIResponse.success(message="Licença transferida com sucesso")
            
        except Exception as e:
            return APIResponse.error(f"Erro ao transferir licença: {str(e)}")
    
    def change_school_limit(self, school_id: str, new_limit: int, motivo: str, actor: str) -> Dict[str, any]:
        """Change license limit for a school"""
        try:
            # Validate school exists
            school = self._get_school_by_id(school_id)
            if not school:
                return APIResponse.error("Escola não encontrada")
            
            if new_limit < 0:
                return APIResponse.error("Limite deve ser maior ou igual a zero")
            
            # Update limit
            self._school_limits_cache[school_id] = new_limit
            blob_service.write_json_file("config/school-limits.json", self._school_limits_cache)
            
            # Update cached school
            school.license_limit = new_limit
            
            # Log audit
            action = LicenseAction(school_id=school_id, new_limit=new_limit, motivo=motivo)
            self._log_audit_action("alter_limit", action, actor, {
                "old_limit": school.license_limit,
                "new_limit": new_limit,
                "motivo": motivo
            })
            
            return APIResponse.success(message="Limite alterado com sucesso")
            
        except Exception as e:
            return APIResponse.error(f"Erro ao alterar limite: {str(e)}")
    
    def reload_data(self, actor: str) -> Dict[str, any]:
        """Force reload of all data from blob storage"""
        try:
            self.load_official_data(force_reload=True)
            
            # Log audit
            action = LicenseAction(school_id="system")
            self._log_audit_action("reload_data", action, actor, {
                "schools_count": len(self._schools_cache),
                "users_count": len(self._users_cache)
            })
            
            return APIResponse.success(message="Dados recarregados com sucesso")
            
        except Exception as e:
            return APIResponse.error(f"Erro ao recarregar dados: {str(e)}")
    
    def get_audit_logs(self, filters: Dict[str, str] = None) -> List[Dict]:
        """Get audit logs with optional filters"""
        try:
            logs = blob_service.read_audit_logs(
                start_date=filters.get("start") if filters else None,
                end_date=filters.get("end") if filters else None
            )
            
            # Apply additional filters
            if filters:
                if "schoolId" in filters and filters["schoolId"]:
                    logs = [log for log in logs if log.get("school_id") == filters["schoolId"]]
                
                if "action" in filters and filters["action"]:
                    logs = [log for log in logs if log.get("action") == filters["action"]]
                
                if "actor" in filters and filters["actor"]:
                    logs = [log for log in logs if filters["actor"].lower() in log.get("actor", "").lower()]
            
            return logs
            
        except Exception as e:
            print(f"Erro ao obter logs de auditoria: {str(e)}")
            return []
    
    # Private helper methods
    
    def _get_school_by_id(self, school_id: str) -> Optional[OfficialSchool]:
        """Get school by ID"""
        if not self._schools_cache:
            self.load_official_data()
        
        return next((s for s in self._schools_cache if s.id == school_id), None)
    
    def _get_user_by_email(self, email: str, school_id: str) -> Optional[OfficialUser]:
        """Get user by email and school"""
        if not self._users_cache:
            self.load_official_data()
        
        return next((u for u in self._users_cache if u.email == email and u.school_id == school_id), None)
    
    def _update_user_override(self, school_id: str, email: str, has_canva: bool):
        """Update user license override"""
        override_key = f"{school_id}:{email}"
        self._user_overrides_cache[override_key] = {
            "has_canva": has_canva,
            "updated_at": pd.Timestamp.now().isoformat()
        }
        
        # Save to blob
        blob_service.write_json_file("data/overrides/users-overrides.json", self._user_overrides_cache)
        
        # Update cached user
        user = self._get_user_by_email(email, school_id)
        if user:
            user.has_canva = has_canva
    
    def _log_audit_action(self, action: str, license_action: LicenseAction, actor: str, payload: Dict):
        """Log audit action"""
        school = self._get_school_by_id(license_action.school_id)
        if not school:
            school_name = "Unknown School"
        else:
            school_name = school.name
            
        entry = AuditLogEntry(
            action=action,
            school_id=license_action.school_id,
            school_name=school_name,
            actor=actor,
            payload=payload,
            ts=datetime.utcnow().isoformat()
        )
        blob_service.append_audit_log(entry.to_dict())

data_service = DataProcessingService()


