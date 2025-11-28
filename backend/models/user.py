"""
Modèle pour la table system_user
Un seul utilisateur avec mot de passe hashé
"""
from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from database.database import Base


class SystemUser(Base):
    """
    Table system_user : Authentification
    Un seul utilisateur, pas de username, juste mot de passe
    """
    __tablename__ = "system_user"

    id = Column(Integer, primary_key=True, default=1)
    password_hash = Column(String(255), nullable=False)
    last_password_change = Column(DateTime, default=func.now(), onupdate=func.now())

