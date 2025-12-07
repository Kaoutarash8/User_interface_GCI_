"""
Routes pour les données de température
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional, List
from database.database import get_db
from schemas.temperature_schemas import (
    TemperaturePredictionCreate,
    TemperaturePredictionResponse,
    IndoorTemperatureDataCreate,
    IndoorTemperatureDataResponse,
    DashboardResponse,
    ComfortTemperatureUpdate,
    ManualControlsUpdate,
    ComfortTemperatureResponse
)
from services.temperature_service import (
    create_prediction,
    get_latest_prediction,
    get_all_predictions,
    create_temperature_data,
    get_latest_temperature,
    get_all_temperature_data,
    get_dashboard_data,
    update_comfort_temperature,
    update_manual_controls
)
from routes.auth import check_auth

router = APIRouter(prefix="/temperature", tags=["Temperature"])


# ==================== PRÉDICTIONS ====================

@router.post("/prediction", response_model=TemperaturePredictionResponse)
def create_temperature_prediction(
    data: TemperaturePredictionCreate,
    db: Session = Depends(get_db)
):
    """
    Endpoint pour créer une nouvelle prédiction de température
    Utilisé par le système ML
    """
    check_auth()
    return create_prediction(db, data)


@router.get("/prediction/latest", response_model=TemperaturePredictionResponse)
def get_latest_prediction_data(db: Session = Depends(get_db)):
    """
    Endpoint pour récupérer la dernière prédiction
    """
    check_auth()
    latest = get_latest_prediction(db)
    if not latest:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Aucune prédiction trouvée"
        )
    return latest


@router.get("/prediction/all", response_model=List[TemperaturePredictionResponse])
def get_all_predictions_data(
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """
    Endpoint pour récupérer toutes les prédictions
    """
    check_auth()
    return get_all_predictions(db, limit)


# ==================== TEMPÉRATURE RÉELLE ====================

@router.post("/data", response_model=IndoorTemperatureDataResponse)
def create_temperature(
    data: IndoorTemperatureDataCreate,
    db: Session = Depends(get_db)
):
    """
    Endpoint pour créer une nouvelle mesure de température
    Utilisé par les capteurs IoT
    """
    check_auth()
    return create_temperature_data(db, data)


@router.get("/data/latest", response_model=IndoorTemperatureDataResponse)
def get_latest_temperature_data(db: Session = Depends(get_db)):
    """
    Endpoint pour récupérer la dernière mesure de température
    """
    check_auth()
    latest = get_latest_temperature(db)
    if not latest:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Aucune donnée de température trouvée"
        )
    return latest


@router.get("/data/all", response_model=List[IndoorTemperatureDataResponse])
def get_all_temperature_data_endpoint(
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """
    Endpoint pour récupérer toutes les mesures de température
    """
    check_auth()
    return get_all_temperature_data(db, limit)


# ==================== DASHBOARD ====================

@router.get("/dashboard", response_model=DashboardResponse)
def get_dashboard(db: Session = Depends(get_db)):
    """
    Endpoint principal du dashboard
    Retourne toutes les données nécessaires pour l'affichage
    """
    check_auth()
    dashboard_data = get_dashboard_data(db)
    return DashboardResponse(**dashboard_data)


# ==================== TEMPÉRATURE DE CONFORT ====================

@router.post("/comfort", response_model=ComfortTemperatureResponse)
def set_comfort_temperature(
    data: ComfortTemperatureUpdate,
    db: Session = Depends(get_db)
):
    """
    Endpoint pour sauvegarder la température de confort
    """
    check_auth()
    
    # Validation supplémentaire
    if data.comfort_temperature < 16.0 or data.comfort_temperature > 30.0:
        return ComfortTemperatureResponse(
            success=False,
            message="La température de confort doit être entre 16°C et 30°C"
        )
    
    success = update_comfort_temperature(db, data.comfort_temperature)
    
    if success:
        return ComfortTemperatureResponse(
            success=True,
            message=f"Température de confort sauvegardée: {data.comfort_temperature}°C",
            comfort_temperature=data.comfort_temperature
        )
    else:
        return ComfortTemperatureResponse(
            success=False,
            message="Erreur lors de la sauvegarde dans la base de données"
        )


@router.get("/comfort/current")
def get_current_comfort_temperature(db: Session = Depends(get_db)):
    """
    Endpoint pour récupérer la température de confort actuelle
    """
    check_auth()
    latest_pred = get_latest_prediction(db)
    comfort_temp = latest_pred.comfort_temp if latest_pred else None
    
    return {
        "comfort_temperature": comfort_temp,
        "success": True
    }


# ==================== CONTRÔLES MANUELS ====================

@router.post("/manual-control")
def set_manual_controls(
    data: ManualControlsUpdate,
    db: Session = Depends(get_db)
):
    """
    Endpoint pour sauvegarder les contrôles manuels
    (chauffage, ventilateur, niveaux)
    """
    check_auth()
    
    success = update_manual_controls(
        db, 
        data.heater_on, 
        data.fan_on, 
        data.heater_level, 
        data.fan_level
    )
    
    if success:
        return {
            "success": True,
            "message": "Contrôles manuels sauvegardés avec succès"
        }
    else:
        return {
            "success": False,
            "error": "Erreur lors de la sauvegarde des contrôles manuels"
        }


# ==================== DONNÉES TEMPORELLES ====================

@router.get("/24h/real")
def get_24h_real_data(db: Session = Depends(get_db)):
    """
    Endpoint pour récupérer les données réelles des 24 dernières heures
    """
    check_auth()
    from services.temperature_service import get_temperature_24h
    try:
        data = get_temperature_24h(db)
        return {
            "success": True,
            "data": data,
            "count": len(data)
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "data": [],
            "count": 0
        }


@router.get("/24h/predictions")
def get_24h_predictions(db: Session = Depends(get_db)):
    """
    Endpoint pour récupérer les prédictions des 24 prochaines heures
    """
    check_auth()
    from services.temperature_service import get_predictions_24h
    try:
        data = get_predictions_24h(db)
        return {
            "success": True,
            "data": data,
            "count": len(data)
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "data": [],
            "count": 0
        }
    
    