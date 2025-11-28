"""
Routes d'authentification
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database.database import get_db
from schemas.user_schemas import LoginRequest, LoginResponse, ChangePasswordRequest
from services.auth_service import authenticate_user, change_password

router = APIRouter(prefix="/auth", tags=["Authentication"])

# Variable globale pour gérer la session (simple, pas de JWT pour ce projet)
# En production, utilisez JWT ou sessions sécurisées
current_session_active = False


def check_auth():
    """Vérifie si l'utilisateur est authentifié"""
    """if not current_session_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Non authentifié. Veuillez vous connecter."
        )"""
    pass 

@router.post("/login", response_model=LoginResponse)
def login(credentials: LoginRequest, db: Session = Depends(get_db)):
    """
    Endpoint de connexion
    Authentifie l'utilisateur avec le mot de passe
    """
    global current_session_active
    
    if authenticate_user(db, credentials.password):
        current_session_active = True
        return LoginResponse(
            message="Connexion réussie",
            success=True
        )
    else:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Mot de passe incorrect"
        )


@router.post("/logout", response_model=LoginResponse)
def logout():
    """
    Endpoint de déconnexion
    """
    global current_session_active
    current_session_active = False
    return LoginResponse(
        message="Déconnexion réussie",
        success=True
    )


@router.post("/change-password", response_model=LoginResponse)
def change_user_password(
    password_data: ChangePasswordRequest,
    db: Session = Depends(get_db)
):
    """
    Endpoint pour changer le mot de passe
    Nécessite l'ancien mot de passe
    """
    check_auth()
    
    if change_password(db, password_data.old_password, password_data.new_password):
        return LoginResponse(
            message="Mot de passe changé avec succès",
            success=True
        )
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ancien mot de passe incorrect"
        )

