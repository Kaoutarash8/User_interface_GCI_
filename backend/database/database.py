"""
Configuration de la base de données MySQL avec SQLAlchemy
"""
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from config.settings import settings

# Construction de l'URL de connexion MySQL
# Format: mysql+pymysql://user:password@host:port/database
DATABASE_URL = (
    f"mysql+pymysql://{settings.DB_USER}:{settings.DB_PASSWORD}"
    f"@{settings.DB_HOST}:{settings.DB_PORT}/{settings.DB_NAME}"
)

# Création du moteur SQLAlchemy
engine = create_engine(
    DATABASE_URL,
    echo=True,  # Affiche les requêtes SQL (utile pour le debug)
    pool_pre_ping=True,  # Vérifie la connexion avant utilisation
    pool_recycle=3600,  # Recycle les connexions après 1 heure
)

# Création de la session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base pour les modèles SQLAlchemy
Base = declarative_base()


def get_db():
    """
    Fonction pour obtenir une session de base de données
    Utilisée comme dépendance dans FastAPI
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

