"""
Schémas Pydantic pour les données de température
"""
from pydantic import BaseModel, Field
from typing import Optional, List, Dict
from datetime import datetime


# ==================== PRÉDICTIONS ====================

class TemperaturePredictionCreate(BaseModel):
    """Schéma pour créer une nouvelle prédiction"""
    year: int = Field(..., ge=2020, le=2100)
    month: int = Field(..., ge=1, le=12)
    day: int = Field(..., ge=1, le=31)
    hour: int = Field(..., ge=0, le=23)
    predicted_temp: float = Field(..., description="Température prédite par ML")
    adjusted_temp: Optional[float] = None
    outdoor_temp: Optional[float] = None
    heater_level: Optional[int] = Field(None, ge=0, le=100)
    fan_speed: Optional[int] = Field(None, ge=0, le=100)
    comfort_temp: Optional[float] = None


class TemperaturePredictionResponse(BaseModel):
    """Schéma pour la réponse d'une prédiction"""
    id: int
    year: int
    month: int
    day: int
    hour: int
    predicted_temp: float
    adjusted_temp: Optional[float]
    outdoor_temp: Optional[float]
    heater_level: Optional[int]
    fan_speed: Optional[int]
    comfort_temp: Optional[float]
    # created_at: datetime

    class Config:
        from_attributes = True


# ==================== TEMPÉRATURE RÉELLE ====================

class IndoorTemperatureDataCreate(BaseModel):
    """Schéma pour créer une nouvelle mesure de température"""
    timestamp: datetime = Field(..., description="Date et heure de la mesure")
    year: int = Field(..., ge=2020, le=2100)
    month: int = Field(..., ge=1, le=12)
    day: int = Field(..., ge=1, le=31)
    hour: int = Field(..., ge=0, le=23)
    indoor_temp: float = Field(..., description="Température intérieure en °C")
    heater_level: Optional[int] = Field(None, ge=0, le=100)
    fan_level: Optional[int] = Field(None, ge=0, le=100)


class IndoorTemperatureDataResponse(BaseModel):
    """Schéma pour la réponse d'une mesure de température"""
    id: int
    timestamp: datetime
    year: int
    month: int
    day: int
    hour: int
    indoor_temp: float
    heater_level: Optional[int]
    fan_level: Optional[int]
    created_at: datetime

    class Config:
        from_attributes = True


# ==================== SCHÉMAS POUR LES DONNÉES TEMPORELLES ====================

class Temperature24hItem(BaseModel):
    """Schéma pour un élément des données 24h"""
    timestamp: str
    temperature: float
    heater_level: Optional[int] = 0
    fan_level: Optional[int] = 0


class Prediction24hItem(BaseModel):
    """Schéma pour un élément des prédictions 24h"""
    timestamp: str
    predicted_temp: float
    adjusted_temp: Optional[float] = None
    outdoor_temp: Optional[float] = None
    heater_level: Optional[int] = 0
    fan_speed: Optional[int] = 0
    comfort_temp: Optional[float] = None


# ==================== DASHBOARD ====================

class DashboardResponse(BaseModel):
    """Schéma pour la réponse du dashboard"""
    current_temperature: Optional[float] = None
    outdoor_temperature: Optional[float] = None
    heater_status: str = "OFF"
    fan_status: str = "OFF"
    heater_level: int = 0
    fan_level: int = 0
    current_mode: str = "AUTO"
    comfort_temperature: Optional[float] = None
    last_update: Optional[datetime] = None
    temperature_24h: List[Temperature24hItem] = Field(default_factory=list)
    prediction_24h: List[Prediction24hItem] = Field(default_factory=list)


# ==================== SCHÉMAS POUR LES MISES À JOUR ====================

class ComfortTemperatureUpdate(BaseModel):
    """Schéma pour mettre à jour la température de confort"""
    comfort_temperature: float = Field(..., ge=16.0, le=30.0, description="Température de confort entre 16°C et 30°C")


class ManualControlsUpdate(BaseModel):
    """Schéma pour mettre à jour les contrôles manuels"""
    heater_on: bool = Field(..., description="État du chauffage")
    fan_on: bool = Field(..., description="État du ventilateur")
    heater_level: int = Field(..., ge=0, le=5, description="Niveau du chauffage (0-5)")
    fan_level: int = Field(..., ge=0, le=5, description="Niveau du ventilateur (0-5)")


class ManualControlsResponse(BaseModel):
    """Schéma pour la réponse des contrôles manuels"""
    success: bool
    message: str


class ComfortTemperatureResponse(BaseModel):
    """Schéma pour la réponse de la température de confort"""
    success: bool
    message: str
    comfort_temperature: Optional[float] = None