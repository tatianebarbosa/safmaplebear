# Data models and schemas
from dataclasses import dataclass, asdict
from typing import Optional, List, Dict, Any
from datetime import datetime

@dataclass
class OfficialSchool:
    """Official school data from Franchising.xlsx"""
    id: str
    name: str
    status: str  # 'Operando', 'Implantando', etc.
    cluster: str  # 'Alta Performance', 'Potente', 'Desenvolvimento', etc.
    carteira_saf: str  # SAF agent name
    cnpj: str
    address: str
    neighborhood: str
    cep: str
    city: str
    state: str
    region: str
    phone: str
    email: str
    # Additional computed fields
    license_limit: int = 2  # Default limit
    used_licenses: int = 0
    
    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)

@dataclass
class OfficialUser:
    """Official user data from usuarios_public.csv"""
    name: str
    email: str
    role: str  # 'Estudante', 'Professor', 'Administrador'
    school_name: str
    school_id: str
    status_licenca: str
    has_canva: bool = False  # Computed from status_licenca
    is_compliant: bool = True  # Email domain check
    
    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)

@dataclass
class SchoolOverview:
    """Processed school data for API responses"""
    id: str
    name: str
    status: str
    cluster: str
    city: str
    state: str
    region: str
    carteira_saf: str
    used: int
    limit: int
    badge: Dict[str, str]
    contact: Dict[str, str]
    
    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)

@dataclass
class LicenseAction:
    """License action request"""
    school_id: str
    user_email: Optional[str] = None
    from_email: Optional[str] = None
    to_email: Optional[str] = None
    motivo: str = ""
    ticket: str = ""
    new_limit: Optional[int] = None
    
    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)

@dataclass
class AuditLogEntry:
    """Audit log entry"""
    action: str  # 'assign', 'revoke', 'transfer', 'alter_limit', 'reload_data'
    school_id: str
    school_name: str
    actor: str  # Username who performed action
    payload: Dict[str, Any]
    ts: Optional[str] = None  # Will be set by blob service
    
    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)

class LicenseBadgeHelper:
    """Helper class for generating license badges"""
    
    @staticmethod
    def generate_badge(used: int, limit: int) -> Dict[str, str]:
        """Generate badge info based on usage"""
        if used == 0:
            return {
                'tone': 'gray',
                'text': f'0/{limit} Licenças'
            }
        elif used < limit:
            return {
                'tone': 'blue', 
                'text': f'{used}/{limit} Licenças'
            }
        elif used == limit:
            return {
                'tone': 'green',
                'text': f'{used}/{limit} Licenças (Completa)'
            }
        else:
            return {
                'tone': 'red',
                'text': f'{used}/{limit} Licenças (Excesso)'
            }

class EmailComplianceHelper:
    """Helper for checking email domain compliance"""
    
    ALLOWED_DOMAINS = [
        '@maplebear.com.br',
        '@mbcentral.com.br', 
        '@seb.com.br',
        '@sebsa.com.br'
    ]
    
    @classmethod
    def is_email_compliant(cls, email: str) -> bool:
        """Check if email belongs to allowed domains"""
        if not email:
            return False
        
        email_lower = email.lower()
        return any(domain in email_lower for domain in cls.ALLOWED_DOMAINS)

class StatusLicencaHelper:
    """Helper for determining license status from various formats"""
    
    ACTIVE_STATUS_VALUES = [
        'licenciado', 'sim', 'true', '1', 'ativa', 'ativo',
        'yes', 'y', 'active', 'licença', 'canva'
    ]
    
    @classmethod
    def has_canva_license(cls, status_licenca: str) -> bool:
        """Determine if user has Canva license based on status"""
        if not status_licenca:
            return False
        
        status_lower = str(status_licenca).lower().strip()
        return status_lower in cls.ACTIVE_STATUS_VALUES

# Response schemas for API
class APIResponse:
    """Standard API response wrapper"""
    
    @staticmethod
    def success(data: Any = None, message: str = "Success") -> Dict[str, Any]:
        response = {"success": True, "message": message}
        if data is not None:
            response["data"] = data
        return response
    
    @staticmethod
    def error(message: str, code: int = 400) -> Dict[str, Any]:
        return {
            "success": False,
            "message": message,
            "code": code
        }