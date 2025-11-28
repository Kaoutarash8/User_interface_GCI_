"""
Schémas Pydantic pour l'authentification
"""
from pydantic import BaseModel, Field


class LoginRequest(BaseModel):
    """Schéma pour la requête de connexion"""
    password: str = Field(..., description="Mot de passe de l'utilisateur")


class ChangePasswordRequest(BaseModel):
    """Schéma pour changer le mot de passe"""
    old_password: str = Field(..., description="Ancien mot de passe")
    new_password: str = Field(..., min_length=6, description="Nouveau mot de passe (min 6 caractères)")


class LoginResponse(BaseModel):
    """Schéma pour la réponse de connexion"""
    message: str
    success: bool

