# services/auth_service.py
from sqlalchemy.orm import Session
from models.user import User

def authenticate_user(db: Session, password: str) -> bool:
    """Authentification simple sans hash pour projet académique"""
    user = db.query(User).first()
    if not user:
        # Créer un utilisateur par défaut si aucun n'existe
        default_user = User(password="admin123")
        db.add(default_user)
        db.commit()
        return password == "admin123"
    
    return user.password == password

def change_password(db: Session, new_password: str) -> bool:
    """Changer le mot de passe (sans ancien mot de passe pour simplifier)"""
    user = db.query(User).first()
    if not user:
        # Créer le premier utilisateur
        new_user = User(password=new_password)
        db.add(new_user)
    else:
        user.password = new_password
    
    db.commit()
    return True

def init_user(db: Session):
    """Initialiser l'utilisateur par défaut"""
    user = db.query(User).first()
    if not user:
        default_user = User(password="admin123")
        db.add(default_user)
        db.commit()
        print("✅ Utilisateur créé avec le mot de passe par défaut: admin123")
        return True
    return False