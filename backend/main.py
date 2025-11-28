"""
Point d'entrée principal de l'application FastAPI
Backend pour le système de contrôle intelligent de température IoT
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from database.database import get_db
from routes import auth, temperature, history
from services.auth_service import init_user

# Configuration CORS pour permettre les requêtes depuis React
origins = [
    "http://localhost:3000",
    "http://localhost:5173",  # Vite par défaut
    "http://localhost:8080",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
]


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Gestion du cycle de vie de l'application
    - Initialise l'utilisateur par défaut si nécessaire
    """
    # Démarrage
    print("🚀 Démarrage de l'application...")
    
    # Créer l'utilisateur par défaut si nécessaire
    db = next(get_db())
    try:
        init_user(db)
        print("✅ Initialisation terminée!")
    finally:
        db.close()
    
    yield
    
    # Arrêt (nettoyage si nécessaire)
    print("👋 Arrêt de l'application...")


# Création de l'application FastAPI
app = FastAPI(
    title="Smart Temperature System API",
    description="API backend pour le système de contrôle intelligent de température IoT",
    version="1.0.0",
    lifespan=lifespan
)

# Configuration CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Inclusion des routes
app.include_router(auth.router)
app.include_router(temperature.router)
app.include_router(history.router)


# Route racine
@app.get("/")
def root():
    """
    Route de bienvenue
    """
    return {
        "message": "Bienvenue sur l'API Smart Temperature System",
        "version": "1.0.0",
        "docs": "/docs",
        "endpoints": {
            "auth": "/auth/login",
            "temperature": "/temperature/dashboard",
            "history": "/history/all"
        }
    }


# Route de santé
@app.get("/health")
def health_check():
    """
    Route pour vérifier l'état de l'API
    """
    return {"status": "healthy", "service": "Smart Temperature System API"}


if __name__ == "__main__":
    import uvicorn
    from config.settings import settings
    
    print(f"🌐 Démarrage du serveur sur http://{settings.HOST}:{settings.PORT}")
    print(f"📚 Documentation disponible sur http://{settings.HOST}:{settings.PORT}/docs")
    
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=True  # Rechargement automatique en développement
    )

