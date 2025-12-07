"""
Configuration de l'application
Gère les variables d'environnement et les paramètres
"""
from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """Classe pour gérer les paramètres de l'application"""
    
    # Configuration MySQL
    DB_HOST: str = "localhost"
    DB_PORT: int = 3306
    DB_USER: str = "root"
    DB_PASSWORD: str = ""
    DB_NAME: str = "SmartHomeDB"
    DATABASE_URL: Optional[str] = None  # Optionnel, sera construit automatiquement
    
    # Configuration serveur
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    
   
    
    
    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "allow"  # Permet les champs supplémentaires dans .env


# Instance globale des settings
settings = Settings()

