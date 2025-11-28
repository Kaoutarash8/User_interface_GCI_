"""
Service pour gérer les données de température
"""
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, desc
from datetime import datetime, timedelta
from typing import Optional, List, Dict
from models.temperature import TemperaturePrediction, IndoorTemperatureData
from schemas.temperature_schemas import (
    TemperaturePredictionCreate,
    IndoorTemperatureDataCreate
)


# ==================== PRÉDICTIONS ====================

def create_prediction(db: Session, data: TemperaturePredictionCreate) -> TemperaturePrediction:
    """Crée une nouvelle prédiction de température"""
    db_prediction = TemperaturePrediction(
        year=data.year,
        month=data.month,
        day=data.day,
        hour=data.hour,
        predicted_temp=data.predicted_temp,
        adjusted_temp=data.adjusted_temp,
        outdoor_temp=data.outdoor_temp,
        heater_level=data.heater_level,
        fan_speed=data.fan_speed,
        comfort_temp=data.comfort_temp
    )
    db.add(db_prediction)
    db.commit()
    db.refresh(db_prediction)
    return db_prediction


def get_latest_prediction(db: Session) -> Optional[TemperaturePrediction]:
    """Récupère la dernière prédiction"""
    return db.query(TemperaturePrediction).order_by(desc(TemperaturePrediction.id)).first()


def get_all_predictions(db: Session, limit: int = 100) -> List[TemperaturePrediction]:
    """Récupère toutes les prédictions (limité)"""
    return db.query(TemperaturePrediction).order_by(desc(TemperaturePrediction.id)).limit(limit).all()


def get_predictions_by_date(
    db: Session,
    year: Optional[int] = None,
    month: Optional[int] = None,
    day: Optional[int] = None
) -> List[TemperaturePrediction]:
    """Récupère les prédictions filtrées par date"""
    query = db.query(TemperaturePrediction)
    
    if year:
        query = query.filter(TemperaturePrediction.year == year)
    if month:
        query = query.filter(TemperaturePrediction.month == month)
    if day:
        query = query.filter(TemperaturePrediction.day == day)
    
    return query.order_by(desc(TemperaturePrediction.id)).all()


def get_predictions_24h(db: Session) -> List[Dict]:
    """Récupère les prédictions des 24 prochaines heures"""
    predictions = db.query(TemperaturePrediction).order_by(
        desc(TemperaturePrediction.created_at)
    ).limit(24).all()
    
    result = []
    for item in predictions:
        try:
            timestamp = datetime(
                item.year, 
                item.month, 
                item.day, 
                item.hour
            )
            
            result.append({
                "timestamp": timestamp.isoformat(),
                "predicted_temp": item.predicted_temp,
                "adjusted_temp": item.adjusted_temp,
                "outdoor_temp": item.outdoor_temp,
                "heater_level": item.heater_level,
                "fan_speed": item.fan_speed,
                "comfort_temp": item.comfort_temp
            })
        except Exception as e:
            continue
    
    return result


# ==================== TEMPÉRATURE RÉELLE ====================

def create_temperature_data(db: Session, data: IndoorTemperatureDataCreate) -> IndoorTemperatureData:
    """Crée une nouvelle mesure de température"""
    db_data = IndoorTemperatureData(
        timestamp=data.timestamp,
        year=data.year,
        month=data.month,
        day=data.day,
        hour=data.hour,
        indoor_temp=data.indoor_temp,
        heater_level=data.heater_level,
        fan_level=data.fan_level
    )
    db.add(db_data)
    db.commit()
    db.refresh(db_data)
    return db_data


def get_latest_temperature(db: Session) -> Optional[IndoorTemperatureData]:
    """Récupère la dernière mesure de température"""
    return db.query(IndoorTemperatureData).order_by(desc(IndoorTemperatureData.id)).first()


def get_all_temperature_data(db: Session, limit: int = 100) -> List[IndoorTemperatureData]:
    """Récupère toutes les mesures de température (limité)"""
    return db.query(IndoorTemperatureData).order_by(desc(IndoorTemperatureData.id)).limit(limit).all()


def get_temperature_by_date(
    db: Session,
    year: Optional[int] = None,
    month: Optional[int] = None,
    day: Optional[int] = None
) -> List[IndoorTemperatureData]:
    """Récupère les mesures filtrées par date"""
    query = db.query(IndoorTemperatureData)
    
    if year:
        query = query.filter(IndoorTemperatureData.year == year)
    if month:
        query = query.filter(IndoorTemperatureData.month == month)
    if day:
        query = query.filter(IndoorTemperatureData.day == day)
    
    return query.order_by(desc(IndoorTemperatureData.id)).all()


def get_temperature_24h(db: Session) -> List[Dict]:
    """Récupère les données de température des dernières 24 heures"""
    yesterday = datetime.now() - timedelta(hours=24)
    data = db.query(IndoorTemperatureData).filter(
        IndoorTemperatureData.timestamp >= yesterday
    ).order_by(IndoorTemperatureData.timestamp.asc()).all()
    
    return [
        {
            "timestamp": item.timestamp.isoformat(),
            "temperature": item.indoor_temp,
            "heater_level": item.heater_level,
            "fan_level": item.fan_level
        }
        for item in data
    ]


def get_avg_temperature_24h(db: Session) -> Optional[float]:
    """Calcule la température moyenne sur les dernières 24 heures"""
    yesterday = datetime.now() - timedelta(hours=24)
    result = db.query(func.avg(IndoorTemperatureData.indoor_temp)).filter(
        IndoorTemperatureData.timestamp >= yesterday
    ).scalar()
    return round(result, 2) if result else None


def get_outdoor_temperature(db: Session) -> Optional[float]:
    """Récupère la dernière température extérieure depuis les prédictions"""
    latest_pred = get_latest_prediction(db)
    return latest_pred.outdoor_temp if latest_pred else None


# ==================== DASHBOARD ====================

def get_dashboard_data(db: Session) -> Dict:
    """Récupère toutes les données nécessaires pour le dashboard"""
    latest_temp = get_latest_temperature(db)
    current_temperature = latest_temp.indoor_temp if latest_temp else None
    
    outdoor_temperature = get_outdoor_temperature(db)
    
    heater_status = "ON" if (latest_temp and latest_temp.heater_level and latest_temp.heater_level > 0) else "OFF"
    fan_status = "ON" if (latest_temp and latest_temp.fan_level and latest_temp.fan_level > 0) else "OFF"
    heater_level = latest_temp.heater_level if latest_temp else 0
    fan_level = latest_temp.fan_level if latest_temp else 0
    
    latest_pred = get_latest_prediction(db)
    comfort_temperature = latest_pred.comfort_temp if latest_pred else None
    
    last_update = latest_temp.timestamp if latest_temp else None
    
    temperature_24h = get_temperature_24h(db)
    
    prediction_24h = get_predictions_24h(db)
    
    from services.history_service import get_current_mode
    current_mode = get_current_mode(db)
    current_mode_name = "AUTO" if current_mode == 1 else "MANUEL"
    
    return {
        "current_temperature": current_temperature,
        "outdoor_temperature": outdoor_temperature,
        "heater_status": heater_status,
        "fan_status": fan_status,
        "heater_level": heater_level,
        "fan_level": fan_level,
        "current_mode": current_mode_name,
        "comfort_temperature": comfort_temperature,
        "last_update": last_update,
        "temperature_24h": temperature_24h,
        "prediction_24h": prediction_24h
    }


def update_comfort_temperature(db: Session, comfort_temp: float) -> bool:
    """
    Met à jour la température de confort dans la table temperature_prediction
    Version CORRIGÉE : crée une nouvelle entrée avec l'heure actuelle arrondie
    """
    try:
        now = datetime.now()
        
        # Arrondir à l'heure supérieure (ex: 20:30 -> 21:00)
        rounded_hour = now.hour
        if now.minute > 0:
            rounded_hour = (now.hour + 1) % 24
        
        print(f"DEBUG: Sauvegarde température confort {comfort_temp}°C à {rounded_hour}h")
        
        # Créer une nouvelle entrée de prédiction avec la température de confort
        new_prediction = TemperaturePrediction(
            year=now.year,
            month=now.month,
            day=now.day,
            hour=rounded_hour,
            predicted_temp=22.0,  # Valeur prédite par défaut
            comfort_temp=comfort_temp,  # La température de confort choisie par l'utilisateur
            created_at=now
        )
        
        db.add(new_prediction)
        db.commit()
        print("DEBUG: Commit réussi")
        
        return True
        
    except Exception as e:
        print(f"❌ ERREUR dans update_comfort_temperature: {str(e)}")
        import traceback
        traceback.print_exc()
        db.rollback()
        return False


def update_manual_controls(
    db: Session, 
    heater_on: bool, 
    fan_on: bool, 
    heater_level: int, 
    fan_level: int
) -> bool:
    """Met à jour les contrôles manuels dans la dernière mesure de température"""
    try:
        latest_temp = get_latest_temperature(db)
        if latest_temp:
            latest_temp.heater_level = heater_level if heater_on else 0
            latest_temp.fan_level = fan_level if fan_on else 0
            db.commit()
            return True
        
        now = datetime.now()
        new_temp = IndoorTemperatureData(
            timestamp=now,
            year=now.year,
            month=now.month,
            day=now.day,
            hour=now.hour,
            indoor_temp=20.0,
            heater_level=heater_level if heater_on else 0,
            fan_level=fan_level if fan_on else 0
        )
        db.add(new_temp)
        db.commit()
        return True
    except Exception as e:
        print(f"Erreur dans update_manual_controls: {str(e)}")
        db.rollback()
        return False