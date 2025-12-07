"""
Service pour gérer les données de température
"""
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, desc, or_
from datetime import datetime, timedelta
from typing import Optional, List, Dict
from models.temperature import TemperaturePrediction, IndoorTemperatureData
from models.mode import mode
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
    """Récupère les prédictions des 24 prochaines heures - VERSION CORRIGÉE"""
    now = datetime.now()
    
    # Calculer la date et heure de fin (24h dans le futur)
    end_datetime = now + timedelta(hours=24)
    
    # Pour MySQL, nous devons comparer manuellement les dates
    # Nous allons chercher toutes les prédictions et filtrer après
    
    # Récupérer toutes les prédictions récentes (derniers 2 jours pour être sûr)
    all_recent_predictions = db.query(TemperaturePrediction).filter(
        or_(
            # Aujourd'hui
            and_(
                TemperaturePrediction.year == now.year,
                TemperaturePrediction.month == now.month,
                TemperaturePrediction.day == now.day,
                TemperaturePrediction.hour >= now.hour
            ),
            # Demain (si on dépasse minuit)
            and_(
                TemperaturePrediction.year == end_datetime.year,
                TemperaturePrediction.month == end_datetime.month,
                TemperaturePrediction.day == end_datetime.day,
                TemperaturePrediction.hour < end_datetime.hour
            )
        )
    ).order_by(
        TemperaturePrediction.year,
        TemperaturePrediction.month,
        TemperaturePrediction.day,
        TemperaturePrediction.hour
    ).all()
    
    # Filtrer manuellement pour obtenir seulement les 24 prochaines heures
    result = []
    for pred in all_recent_predictions:
        pred_datetime = datetime(pred.year, pred.month, pred.day, pred.hour)
        
        # Vérifier si la prédiction est dans les 24 prochaines heures
        if now <= pred_datetime <= end_datetime:
            result.append({
                "timestamp": f"{pred.year}-{pred.month:02d}-{pred.day:02d} {pred.hour:02d}:00",
                "predicted_temp": pred.predicted_temp,
                "adjusted_temp": pred.adjusted_temp,
                "outdoor_temp": pred.outdoor_temp,
                "heater_level": pred.heater_level or 0,
                "fan_speed": pred.fan_speed or 0,
                "comfort_temp": pred.comfort_temp
            })
        
        # Limiter à 24 entrées maximum
        if len(result) >= 24:
            break
    
    # NE PAS générer de données factices - retourner seulement ce qui existe
    return result


def get_next_hour_prediction(db: Session) -> Optional[Dict]:
    """Récupère la prédiction pour la prochaine heure"""
    now = datetime.now()
    next_hour_time = now + timedelta(hours=1)
    
    # Chercher la prédiction exacte pour la prochaine heure
    pred = db.query(TemperaturePrediction).filter(
        TemperaturePrediction.year == next_hour_time.year,
        TemperaturePrediction.month == next_hour_time.month,
        TemperaturePrediction.day == next_hour_time.day,
        TemperaturePrediction.hour == next_hour_time.hour
    ).first()
    
    if pred:
        return {
            "timestamp": f"{pred.year}-{pred.month:02d}-{pred.day:02d} {pred.hour:02d}:00",
            "predicted_temp": pred.predicted_temp,
            "adjusted_temp": pred.adjusted_temp,
            "outdoor_temp": pred.outdoor_temp,
            "heater_level": pred.heater_level,
            "fan_speed": pred.fan_speed,
            "comfort_temp": pred.comfort_temp
        }
    
    return None


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
    now = datetime.now()
    yesterday = now - timedelta(hours=24)
    
    data = db.query(IndoorTemperatureData).filter(
        IndoorTemperatureData.timestamp >= yesterday,
        IndoorTemperatureData.timestamp <= now
    ).order_by(IndoorTemperatureData.timestamp.asc()).all()
    
    return [
        {
            "timestamp": item.timestamp.strftime("%Y-%m-%d %H:%M"),
            "temperature": item.indoor_temp,
            "heater_level": item.heater_level or 0,
            "fan_level": item.fan_level or 0
        }
        for item in data
    ]


def get_avg_temperature_24h(db: Session) -> Optional[float]:
    """Calcule la température moyenne sur les dernières 24 heures"""
    now = datetime.now()
    yesterday = now - timedelta(hours=24)
    result = db.query(func.avg(IndoorTemperatureData.indoor_temp)).filter(
        IndoorTemperatureData.timestamp >= yesterday,
        IndoorTemperatureData.timestamp <= now
    ).scalar()
    return round(result, 2) if result else None


def get_outdoor_temperature(db: Session) -> Optional[float]:
    """Récupère la dernière température extérieure depuis les prédictions"""
    latest_pred = get_latest_prediction(db)
    return latest_pred.outdoor_temp if latest_pred else None


def get_current_mode_direct(db: Session) -> int:
    """
    Récupère le mode actuel directement depuis la table mode
    """
    latest = db.query(mode).order_by(desc(mode.created_at)).first()
    return latest.mode_value if latest else 1  # Correction ici: mode_value au lieu de mode


# ==================== DASHBOARD ====================

def get_dashboard_data(db: Session) -> Dict:
    """Récupère toutes les données nécessaires pour le dashboard - VERSION CORRIGÉE"""
    try:
        latest_temp = get_latest_temperature(db)
        
        # Vérifier si la base est vide
        current_temperature = latest_temp.indoor_temp if latest_temp else None
        
        outdoor_temperature = get_outdoor_temperature(db)
        
        # État des équipements avec vérification de null
        heater_level = latest_temp.heater_level if latest_temp else 0
        fan_level = latest_temp.fan_level if latest_temp else 0
        
        heater_status = "ON" if heater_level > 0 else "OFF"
        fan_status = "ON" if fan_level > 0 else "OFF"
        
        latest_pred = get_latest_prediction(db)
        comfort_temperature = latest_pred.comfort_temp if latest_pred else None
        
        # Format complet de la date avec vérification
        last_update = "Aucune donnée disponible"
        if latest_temp and hasattr(latest_temp, 'timestamp') and latest_temp.timestamp:
            try:
                last_update = latest_temp.timestamp.strftime("%Y-%m-%d %H:%M:%S")
            except:
                last_update = str(latest_temp.timestamp)
        
        temperature_24h = get_temperature_24h(db)
        
        # IMPORTANT: Le nom DOIT être "prediction_24h" (singulier) pour correspondre au schéma
        prediction_24h = get_predictions_24h(db)
        
        # Prédiction pour la prochaine heure
        next_hour_prediction = get_next_hour_prediction(db)
        
        # ✅ Utilise la fonction directe (corrigée)
        current_mode = get_current_mode_direct(db)
        current_mode_name = "AUTO" if current_mode == 1 else "MANUEL"
        
        # Vérifier s'il y a des alertes
        alerts = check_system_alerts(db)
        
        # Construction du résultat avec les noms EXACTS attendus par le schéma
        result = {
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
            "prediction_24h": prediction_24h,  # ⚠️ IMPORTANT: SINGULIER "prediction_24h"
            "alerts": alerts
        }
        
        # Optionnel: ajouter la prédiction prochaine heure si disponible
        if next_hour_prediction:
            result["next_hour_prediction"] = next_hour_prediction
        
        return result
        
    except Exception as e:
        print(f"❌ ERREUR dans get_dashboard_data: {str(e)}")
        import traceback
        traceback.print_exc()
        
        # Retourner une structure minimale en cas d'erreur
        return {
            "current_temperature": None,
            "outdoor_temperature": None,
            "heater_status": "OFF",
            "fan_status": "OFF",
            "heater_level": 0,
            "fan_level": 0,
            "current_mode": "AUTO",
            "comfort_temperature": None,
            "last_update": "Erreur système",
            "temperature_24h": [],
            "prediction_24h": [],  # ⚠️ SINGULIER
            "alerts": [
                {
                    "type": "CRITICAL",
                    "message": f"Erreur système: {str(e)[:100]}",
                    "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                }
            ]
        }


def update_comfort_temperature(db: Session, comfort_temp: float) -> bool:
    """
    Met à jour la température de confort dans la table TemperaturePredictions
    """
    try:
        # Validation de la température
        if comfort_temp < 16.0 or comfort_temp > 30.0:
            raise ValueError("Température de confort doit être entre 16°C et 30°C")
        
        now = datetime.now()
        
        # Vérifier s'il existe déjà une prédiction pour cette heure
        existing_pred = db.query(TemperaturePrediction).filter(
            TemperaturePrediction.year == now.year,
            TemperaturePrediction.month == now.month,
            TemperaturePrediction.day == now.day,
            TemperaturePrediction.hour == now.hour
        ).first()
        
        if existing_pred:
            # Mettre à jour la prédiction existante
            existing_pred.comfort_temp = comfort_temp
        else:
            # Créer une nouvelle entrée
            new_prediction = TemperaturePrediction(
                year=now.year,
                month=now.month,
                day=now.day,
                hour=now.hour,
                predicted_temp=22.0,
                comfort_temp=comfort_temp,
                prediction_date=now
            )
            db.add(new_prediction)
        
        db.commit()
        return True
        
    except ValueError as ve:
        print(f"❌ Validation erreur dans update_comfort_temperature: {str(ve)}")
        db.rollback()
        return False
    except Exception as e:
        print(f"❌ ERREUR dans update_comfort_temperature: {str(e)}")
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
        # Validation des niveaux
        if heater_level < 0 or heater_level > 5:
            raise ValueError("Niveau chauffage doit être entre 0 et 5")
        if fan_level < 0 or fan_level > 5:
            raise ValueError("Niveau ventilateur doit être entre 0 et 5")
        
        now = datetime.now()
        
        # Créer toujours une nouvelle entrée pour garder un historique
        new_temp = IndoorTemperatureData(
            timestamp=now,
            year=now.year,
            month=now.month,
            day=now.day,
            hour=now.hour,
            indoor_temp=20.0,  # Valeur par défaut
            heater_level=heater_level if heater_on else 0,
            fan_level=fan_level if fan_on else 0
        )
        db.add(new_temp)
        
        db.commit()
        return True
        
    except ValueError as ve:
        print(f"❌ Validation erreur dans update_manual_controls: {str(ve)}")
        db.rollback()
        return False
    except Exception as e:
        print(f"❌ Erreur dans update_manual_controls: {str(e)}")
        db.rollback()
        return False


# ==================== SYSTÈME D'ALERTES ====================

def check_system_alerts(db: Session) -> List[Dict]:
    """Vérifie les alertes système"""
    alerts = []
    
    # 1. Vérifier capteur silencieux
    latest_temp = get_latest_temperature(db)
    if not latest_temp:
        alerts.append({
            "type": "CRITICAL",
            "message": "⚠️ Aucune donnée de capteur disponible",
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        })
        return alerts  # Retourner immédiatement si pas de données
    
    # Vérifier si la dernière mesure est récente (< 15 minutes)
    time_diff = datetime.now() - latest_temp.timestamp
    if time_diff > timedelta(minutes=15):
        alerts.append({
            "type": "WARNING",
            "message": f"⚠️ Dernière mesure il y a {int(time_diff.total_seconds()/60)} minutes",
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        })
    
    # 2. Vérifier température anormale
    temp = latest_temp.indoor_temp
    if temp is not None:
        if temp < 10.0:
            alerts.append({
                "type": "WARNING",
                "message": f"⚠️ Température trop basse: {temp}°C",
                "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            })
        elif temp > 30.0:
            alerts.append({
                "type": "WARNING",
                "message": f"⚠️ Température trop élevée: {temp}°C",
                "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            })
    
    # 3. Vérifier équipements allumés trop longtemps
    hour_ago = datetime.now() - timedelta(hours=1)
    long_running = db.query(IndoorTemperatureData).filter(
        IndoorTemperatureData.timestamp >= hour_ago,
        IndoorTemperatureData.heater_level > 3
    ).count()
    
    if long_running > 6:  # Plus de 30 minutes à niveau élevé
        alerts.append({
            "type": "INFO",
            "message": "ℹ️ Chauffage fonctionne à haut niveau depuis plus de 30 minutes",
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        })
    
    return alerts


# ==================== FONCTIONS UTILITAIRES ====================

def format_timestamp_for_display(timestamp: datetime) -> str:
    """Formate un timestamp pour l'affichage"""
    if not timestamp:
        return "N/A"
    return timestamp.strftime("%Y-%m-%d %H:%M:%S")


def calculate_temperature_stats(db: Session, hours: int = 24) -> Dict:
    """Calcule les statistiques de température sur une période donnée"""
    now = datetime.now()
    start_time = now - timedelta(hours=hours)
    
    stats = db.query(
        func.min(IndoorTemperatureData.indoor_temp).label('min_temp'),
        func.max(IndoorTemperatureData.indoor_temp).label('max_temp'),
        func.avg(IndoorTemperatureData.indoor_temp).label('avg_temp'),
        func.count(IndoorTemperatureData.id).label('data_points')
    ).filter(
        IndoorTemperatureData.timestamp >= start_time,
        IndoorTemperatureData.timestamp <= now
    ).first()
    
    return {
        "min_temperature": round(stats.min_temp, 2) if stats.min_temp else None,
        "max_temperature": round(stats.max_temp, 2) if stats.max_temp else None,
        "avg_temperature": round(stats.avg_temp, 2) if stats.avg_temp else None,
        "data_points": stats.data_points or 0,
        "period_hours": hours
    }


def get_recent_temperature_data(db: Session, hours: int = 48) -> List[Dict]:
    """Récupère les données récentes pour les graphiques"""
    now = datetime.now()
    start_time = now - timedelta(hours=hours)
    
    data = db.query(IndoorTemperatureData).filter(
        IndoorTemperatureData.timestamp >= start_time,
        IndoorTemperatureData.timestamp <= now
    ).order_by(IndoorTemperatureData.timestamp.asc()).all()
    
    return [
        {
            "timestamp": item.timestamp.strftime("%Y-%m-%d %H:%M"),
            "temperature": item.indoor_temp,
            "heater_level": item.heater_level or 0,
            "fan_level": item.fan_level or 0
        }
        for item in data
    ]