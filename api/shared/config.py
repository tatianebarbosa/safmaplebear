# Configuration management for SAF API
import os
from typing import Dict, Any

class Config:
    """Configuration class for environment variables and settings"""
    
    # JWT Configuration
    JWT_SECRET = os.environ.get('JWT_SECRET', 'your-super-secret-jwt-key-change-in-production')
    JWT_ALGORITHM = 'HS256'
    JWT_EXPIRY_HOURS = int(os.environ.get('JWT_EXPIRY_HOURS', '8'))
    
    # Security Configuration
    MAX_LOGIN_ATTEMPTS = int(os.environ.get('MAX_LOGIN_ATTEMPTS', '5'))
    LOCKOUT_TIME_MINUTES = int(os.environ.get('LOCKOUT_TIME_MINUTES', '5'))
    PASSWORD_SALT_ROUNDS = int(os.environ.get('PASSWORD_SALT_ROUNDS', '12'))
    
    # Database Configuration (for future use)
    DATABASE_URL = os.environ.get('DATABASE_URL', 'sqlite:///saf.db')
    
    # Azure Configuration
    AZURE_STORAGE_CONNECTION_STRING = os.environ.get('AZURE_STORAGE_CONNECTION_STRING')
    AZURE_STORAGE_CONTAINER = os.environ.get('AZURE_STORAGE_CONTAINER', 'saf-data')
    
    # Email Configuration (for future notifications)
    SMTP_SERVER = os.environ.get('SMTP_SERVER')
    SMTP_PORT = int(os.environ.get('SMTP_PORT', '587'))
    SMTP_USERNAME = os.environ.get('SMTP_USERNAME')
    SMTP_PASSWORD = os.environ.get('SMTP_PASSWORD')
    
    # Application Configuration
    DEBUG = os.environ.get('DEBUG', 'False').lower() == 'true'
    ENVIRONMENT = os.environ.get('ENVIRONMENT', 'development')
    
    # CORS Configuration
    ALLOWED_ORIGINS = os.environ.get('ALLOWED_ORIGINS', '*').split(',')
    
    # Rate Limiting
    RATE_LIMIT_PER_MINUTE = int(os.environ.get('RATE_LIMIT_PER_MINUTE', '60'))
    
    @classmethod
    def get_config(cls) -> Dict[str, Any]:
        """Get all configuration as dictionary"""
        return {
            'jwt_secret': cls.JWT_SECRET,
            'jwt_algorithm': cls.JWT_ALGORITHM,
            'jwt_expiry_hours': cls.JWT_EXPIRY_HOURS,
            'max_login_attempts': cls.MAX_LOGIN_ATTEMPTS,
            'lockout_time_minutes': cls.LOCKOUT_TIME_MINUTES,
            'password_salt_rounds': cls.PASSWORD_SALT_ROUNDS,
            'database_url': cls.DATABASE_URL,
            'debug': cls.DEBUG,
            'environment': cls.ENVIRONMENT,
            'allowed_origins': cls.ALLOWED_ORIGINS,
            'rate_limit_per_minute': cls.RATE_LIMIT_PER_MINUTE,
        }
    
    @classmethod
    def validate_config(cls) -> bool:
        """Validate required configuration"""
        required_vars = []
        
        if cls.ENVIRONMENT == 'production':
            required_vars.extend([
                'JWT_SECRET',
                'AZURE_STORAGE_CONNECTION_STRING'
            ])
        
        missing_vars = [var for var in required_vars if not os.environ.get(var)]
        
        if missing_vars:
            raise ValueError(f"Missing required environment variables: {', '.join(missing_vars)}")
        
        return True

# Environment-specific configurations
class DevelopmentConfig(Config):
    DEBUG = True
    JWT_SECRET = 'dev-secret-key-not-for-production'

class ProductionConfig(Config):
    DEBUG = False
    # JWT_SECRET must be set via environment variable in production

class TestingConfig(Config):
    DEBUG = True
    JWT_SECRET = 'test-secret-key'
    MAX_LOGIN_ATTEMPTS = 3
    LOCKOUT_TIME_MINUTES = 1

# Configuration factory
def get_config() -> Config:
    """Get configuration based on environment"""
    env = os.environ.get('ENVIRONMENT', 'development').lower()
    
    if env == 'production':
        return ProductionConfig()
    elif env == 'testing':
        return TestingConfig()
    else:
        return DevelopmentConfig()

# Global config instance
config = get_config()

