"""
Routes pour l'historique
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional, List
from database.database import get_db
from schemas.history_schemas import (
    UserModeCreate,
    modeResponse,
    HistoryResponse
)
from services.history_service import (
    create_mode_history,
    get_current_mode,
    get_mode_history,
    get_history_data
)
from routes.auth import check_auth

router = APIRouter(prefix="/history", tags=["History"])


# ==================== MODE UTILISATEUR ====================

@router.post("/mode", response_model=modeResponse)
def set_user_mode(
    mode_data: UserModeCreate,
    db: Session = Depends(get_db)
):
    """
    Endpoint pour changer le mode (AUTO/MANUEL)
    mode = 1 pour AUTO, mode = 0 pour MANUEL
    """
    check_auth()
    return create_mode_history(db, mode_data.mode)


@router.get("/mode/current")
def get_current_user_mode(db: Session = Depends(get_db)):
    """
    Endpoint pour récupérer le mode actuel
    """
    check_auth()
    mode = get_current_mode(db)
    return {
        "mode": mode,
        "mode_name": "AUTO" if mode == 1 else "MANUEL"
    }


@router.get("/mode/all", response_model=List[modeResponse])
def get_user_mode_history(
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """
    Endpoint pour récupérer l'historique des changements de mode
    """
    check_auth()
    return get_mode_history(db, limit)


# ==================== HISTORIQUE COMPLET ====================

@router.get("/all", response_model=HistoryResponse)
def get_history(
    year: Optional[int] = None,
    month: Optional[int] = None,
    day: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """
    Endpoint pour récupérer les données historiques
    Filtres optionnels : year, month, day
    """
    check_auth()
    return get_history_data(db, year, month, day)

