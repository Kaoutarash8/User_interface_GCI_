"""
Service d'authentification
Gère la connexion et le changement de mot de passe
"""
from sqlalchemy.orm import Session
import bcrypt
from models.user import SystemUser
from config.settings import settings


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Vérifie si le mot de passe en clair correspond au hash"""
    try:
        # Convertir le hash en bytes si c'est une string
        if isinstance(hashed_password, str):
            hashed_password = hashed_password.encode('utf-8')
        if isinstance(plain_password, str):
            plain_password = plain_password.encode('utf-8')
        return bcrypt.checkpw(plain_password, hashed_password)
    except Exception:
        return False


def get_password_hash(password: str) -> str:
    """Hash un mot de passe avec bcrypt"""
    # Convertir le mot de passe en bytes
    password_bytes = password.encode('utf-8')
    # Générer le hash avec bcrypt
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password_bytes, salt)
    # Retourner le hash en string
    return hashed.decode('utf-8')


def authenticate_user(db: Session, password: str) -> bool:
    """
    Authentifie l'utilisateur avec le mot de passe
    Retourne True si le mot de passe est correct
    """
    user = db.query(SystemUser).filter(SystemUser.id == 1).first()
    if not user:
        return False
    return verify_password(password, user.password_hash)


def change_password(db: Session, old_password: str, new_password: str) -> bool:
    """
    Change le mot de passe de l'utilisateur
    Retourne True si le changement est réussi
    """
    user = db.query(SystemUser).filter(SystemUser.id == 1).first()
    if not user:
        return False
    
    # Vérifier l'ancien mot de passe
    if not verify_password(old_password, user.password_hash):
        return False
    
    # Mettre à jour avec le nouveau mot de passe hashé
    user.password_hash = get_password_hash(new_password)
    db.commit()
    return True


def init_user(db: Session):
    """
    Initialise l'utilisateur avec un mot de passe par défaut
    À appeler une seule fois au démarrage si l'utilisateur n'existe pas
    """
    user = db.query(SystemUser).filter(SystemUser.id == 1).first()
    if not user:
        new_user = SystemUser(
            id=1,
            password_hash=get_password_hash(settings.DEFAULT_PASSWORD)
        )
        db.add(new_user)
        db.commit()
        print(f"✅ Utilisateur créé avec le mot de passe par défaut: {settings.DEFAULT_PASSWORD}")
        return True
    return False

