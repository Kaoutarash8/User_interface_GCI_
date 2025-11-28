"""
Service pour gérer l'historique
"""
from sqlalchemy.orm import Session
from sqlalchemy import desc, and_
from datetime import datetime, timedelta
from typing import Optional, List, Dict
from models.mode import UserModeHistory
from models.temperature import IndoorTemperatureData, TemperaturePrediction
from services.temperature_service import get_temperature_by_date, get_predictions_by_date


def create_mode_history(db: Session, mode: int) -> UserModeHistory:
    """
    Crée un nouvel historique de changement de mode
    mode = 1 pour AUTO, mode = 0 pour MANUEL
    """
    db_mode = UserModeHistory(mode=mode)
    db.add(db_mode)
    db.commit()
    db.refresh(db_mode)
    return db_mode


def get_current_mode(db: Session) -> int:
    """
    Récupère le mode actuel (dernier mode enregistré)
    Retourne 1 pour AUTO, 0 pour MANUEL
    """
    latest = db.query(UserModeHistory).order_by(desc(UserModeHistory.selected_at)).first()
    return latest.mode if latest else 1  # Par défaut AUTO (1)


def get_mode_history(db: Session, limit: int = 100) -> List[UserModeHistory]:
    """Récupère l'historique des changements de mode"""
    return db.query(UserModeHistory).order_by(desc(UserModeHistory.selected_at)).limit(limit).all()


def get_history_data(
    db: Session,
    year: Optional[int] = None,
    month: Optional[int] = None,
    day: Optional[int] = None
) -> Dict:
    """
    Récupère toutes les données historiques avec jointure entre température réelle et prédictions
    """
    # Construire la requête pour les données de température avec jointure aux prédictions
    query = db.query(
        IndoorTemperatureData,
        TemperaturePrediction
    ).outerjoin(
        TemperaturePrediction,
        and_(
            IndoorTemperatureData.year == TemperaturePrediction.year,
            IndoorTemperatureData.month == TemperaturePrediction.month,
            IndoorTemperatureData.day == TemperaturePrediction.day,
            IndoorTemperatureData.hour == TemperaturePrediction.hour
        )
    )
    
    # Appliquer les filtres de date
    if year:
        query = query.filter(IndoorTemperatureData.year == year)
    if month:
        query = query.filter(IndoorTemperatureData.month == month)
    if day:
        query = query.filter(IndoorTemperatureData.day == day)
    
    # Exécuter la requête
    results = query.order_by(desc(IndoorTemperatureData.timestamp)).all()
    
    # Préparer les données de température avec prédictions
    temp_list = []
    for temp_data, pred_data in results:
        item = {
            "id": temp_data.id,
            "timestamp": temp_data.timestamp.isoformat(),
            "year": temp_data.year,
            "month": temp_data.month,
            "day": temp_data.day,
            "hour": temp_data.hour,
            "indoor_temp": temp_data.indoor_temp,
            "heater_level": temp_data.heater_level,
            "fan_level": temp_data.fan_level,
            "created_at": temp_data.created_at.isoformat() if temp_data.created_at else None
        }
        
        # Ajouter les données de prédiction si disponibles
        if pred_data:
            item.update({
                "predicted_temp": pred_data.predicted_temp,
                "adjusted_temp": pred_data.adjusted_temp,
                "outdoor_temp": pred_data.outdoor_temp,
                "predicted_heater_level": pred_data.heater_level,
                "predicted_fan_speed": pred_data.fan_speed,
                "comfort_temp": pred_data.comfort_temp,
                "prediction_created_at": pred_data.created_at.isoformat() if pred_data.created_at else None
            })
        
        temp_list.append(item)
    
    # Récupérer également les prédictions séparément pour les graphes
    predictions = get_predictions_by_date(db, year, month, day)
    pred_list = [
        {
            "id": item.id,
            "year": item.year,
            "month": item.month,
            "day": item.day,
            "hour": item.hour,
            "predicted_temp": item.predicted_temp,
            "adjusted_temp": item.adjusted_temp,
            "outdoor_temp": item.outdoor_temp,
            "heater_level": item.heater_level,
            "fan_speed": item.fan_speed,
            "comfort_temp": item.comfort_temp,
            "created_at": item.created_at.isoformat() if item.created_at else None
        }
        for item in predictions
    ]
    
    # Historique des modes
    mode_history = get_mode_history(db, limit=100)
    mode_list = [
        {
            "id": item.id,
            "mode": item.mode,
            "mode_name": "AUTO" if item.mode == 1 else "MANUEL",
            "selected_at": item.selected_at.isoformat() if item.selected_at else None
        }
        for item in mode_history
    ]
    
    return {
        "temperature_data": temp_list,  # Contient à la fois les données réelles et prédictions jointes
        "predictions": pred_list,       # Prédictions séparées pour les graphes
        "mode_history": mode_list
    }


def get_comparison_data(
    db: Session,
    year: Optional[int] = None,
    month: Optional[int] = None,
    day: Optional[int] = None
) -> Dict:
    """
    Récupère les données spécifiquement pour la comparaison ML vs Réel
    """
    # Données réelles
    real_data = get_temperature_by_date(db, year, month, day)
    real_temps = [
        {
            "timestamp": item.timestamp.isoformat(),
            "temperature": item.indoor_temp,
            "hour": item.hour,
            "type": "real"
        }
        for item in real_data
    ]
    
    # Données prédites
    pred_data = get_predictions_by_date(db, year, month, day)
    pred_temps = [
        {
            "timestamp": f"{item.year}-{item.month:02d}-{item.day:02d} {item.hour:02d}:00:00",
            "temperature": item.predicted_temp,
            "hour": item.hour,
            "type": "predicted"
        }
        for item in pred_data
    ]
    
    return {
        "real_temperatures": real_temps,
        "predicted_temperatures": pred_temps
    }




