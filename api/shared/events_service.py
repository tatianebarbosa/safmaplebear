import json
from datetime import datetime
from pathlib import Path
from typing import List, Optional
from uuid import uuid4

from .blob import blob_service
from .model import Event


def _parse_iso(date_str: str) -> str:
    """Normalize ISO strings and validate format."""
    if not date_str:
        raise ValueError("dataInicio e obrigatoria")
    sanitized = date_str.replace("Z", "+00:00")
    try:
        dt = datetime.fromisoformat(sanitized)
    except ValueError:
        raise ValueError("Formato de data invǭlido. Use ISO 8601.")
    return dt.isoformat()


class EventsRepository:
    """Persistence layer backed by blob storage with local fallback."""

    def __init__(self, blob_name: str = "data/events.json"):
        self.blob_name = blob_name
        self.local_path = Path(__file__).resolve().parent.parent / "local_data" / "events.json"

    def load_events(self) -> List[Event]:
        raw_events: List[dict] = []

        try:
            blob_data = blob_service.read_json_file(self.blob_name)
            if isinstance(blob_data, list):
                raw_events = blob_data
            elif isinstance(blob_data, dict):
                raw_events = blob_data.get("events", [])
        except Exception as e:
            print(f"[events] Falha ao ler blob: {e}")

        if not raw_events and self.local_path.exists():
            try:
                with open(self.local_path, "r", encoding="utf-8") as f:
                    raw_events = json.load(f)
            except Exception as e:
                print(f"[events] Falha ao ler fallback local: {e}")

        events: List[Event] = []
        for raw in raw_events:
            try:
                events.append(Event.from_dict(raw))
            except Exception as e:
                print(f"[events] Evento ignorado por erro de parse: {e}")
        return events

    def save_events(self, events: List[Event]):
        payload = [ev.to_dict() for ev in events]
        blob_error: Optional[Exception] = None

        try:
            blob_service.write_json_file(self.blob_name, payload)
        except Exception as e:
            blob_error = e
            print(f"[events] Nao foi possivel gravar no blob: {e}")

        try:
            self.local_path.parent.mkdir(parents=True, exist_ok=True)
            with open(self.local_path, "w", encoding="utf-8") as f:
                json.dump(payload, f, ensure_ascii=False, indent=2)
        except Exception as local_error:
            if blob_error:
                raise Exception(
                    f"Erro ao salvar eventos (blob e local): {blob_error}; {local_error}"
                )
            raise


class EventService:
    """Business logic to handle SAF calendar events."""

    def __init__(self, repository: Optional[EventsRepository] = None):
        self.repository = repository or EventsRepository()

    def list_events(self, month: str, day: Optional[str] = None) -> List[Event]:
        self._validate_month(month)
        if day:
            self._validate_day(day)

        events = self.repository.load_events()
        filtered = [ev for ev in events if ev.dataInicio[:7] == month]
        if day:
            filtered = [ev for ev in filtered if ev.dataInicio[:10] == day]
        return sorted(filtered, key=lambda e: e.dataInicio)

    def create_event(self, payload: dict, user_info: dict) -> Event:
        titulo = payload.get("titulo", "").strip()
        if not titulo:
            raise ValueError("Titulo e obrigatorio")

        data_inicio = _parse_iso(payload.get("dataInicio", ""))
        data_fim_raw = payload.get("dataFim")
        data_fim = _parse_iso(data_fim_raw) if data_fim_raw else None

        creator_id = user_info.get("sub") or user_info.get("username") or ""
        creator_name = user_info.get("name") or creator_id
        now_iso = datetime.utcnow().isoformat()

        new_event = Event(
            id=str(uuid4()),
            titulo=titulo,
            descricao=payload.get("descricao"),
            dataInicio=data_inicio,
            dataFim=data_fim,
            tipo=payload.get("tipo"),
            createdByUserId=creator_id,
            createdByName=creator_name,
            createdAt=now_iso,
            updatedAt=None,
        )

        events = self.repository.load_events()
        events.append(new_event)
        self.repository.save_events(events)
        return new_event

    def update_event(self, event_id: str, payload: dict) -> Optional[Event]:
        events = self.repository.load_events()
        target = next((ev for ev in events if ev.id == event_id), None)
        if not target:
            return None

        if "titulo" in payload:
            titulo = payload.get("titulo", "").strip()
            if titulo:
                target.titulo = titulo
        if "descricao" in payload:
            target.descricao = payload.get("descricao")
        if "tipo" in payload:
            target.tipo = payload.get("tipo")
        if "dataInicio" in payload:
            target.dataInicio = _parse_iso(payload.get("dataInicio", target.dataInicio))
        if "dataFim" in payload:
            data_fim_raw = payload.get("dataFim")
            target.dataFim = _parse_iso(data_fim_raw) if data_fim_raw else None

        target.updatedAt = datetime.utcnow().isoformat()
        self.repository.save_events(events)
        return target

    def delete_event(self, event_id: str) -> bool:
        events = self.repository.load_events()
        new_events = [ev for ev in events if ev.id != event_id]
        if len(new_events) == len(events):
            return False
        self.repository.save_events(new_events)
        return True

    @staticmethod
    def _validate_month(month: str):
        try:
            datetime.strptime(month, "%Y-%m")
        except ValueError:
            raise ValueError("Parametro 'mes' deve estar em YYYY-MM")

    @staticmethod
    def _validate_day(day: str):
        try:
            datetime.strptime(day, "%Y-%m-%d")
        except ValueError:
            raise ValueError("Parametro 'dia' deve estar em YYYY-MM-DD")


event_service = EventService()
