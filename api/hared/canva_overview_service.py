"""
Compatibilidade: reexporta o servico de overview a partir de api.shared.canva_overview_service.
Usado apenas se algum codigo ainda importar api.hared.canva_overview_service.
"""
from api.shared.canva_overview_service import (  # type: ignore F401
    compute_overview,
    build_school_breakdown,
    is_email_compliant,
    load_franchising_schools,
    load_license_users,
)
