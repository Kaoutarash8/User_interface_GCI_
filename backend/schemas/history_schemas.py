"""
Schémas Pydantic pour l'historique
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class UserModeCreate(BaseModel):
    """Schéma pour créer un changement de mode"""
    mode: int = Field(..., description="1 = AUTO, 0 = MANUEL", ge=0, le=1)


class modeResponse(BaseModel):
    """Schéma pour la réponse d'un historique de mode"""
    id: int
    mode: int
    selected_at: datetime

    class Config:
        from_attributes = True


class HistoryFilter(BaseModel):
    """Schéma pour filtrer l'historique"""
    year: Optional[int] = None
    month: Optional[int] = None
    day: Optional[int] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None


class HistoryResponse(BaseModel):
    """Schéma pour la réponse de l'historique"""
    temperature_data: List[dict] = Field(default_factory=list)
    predictions: List[dict] = Field(default_factory=list)
    mode_history: List[dict] = Field(default_factory=list)

