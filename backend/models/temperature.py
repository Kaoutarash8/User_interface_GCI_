"""
Modèles pour les tables de température
"""
from sqlalchemy import Column, Integer, Float, DateTime, TIMESTAMP
from sqlalchemy.sql import func
from database.database import Base


class TemperaturePrediction(Base):
    """
    Table temperature_prediction : Prédictions ML
    """
    __tablename__ = "temperature_prediction"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    year = Column(Integer, nullable=False)
    month = Column(Integer, nullable=False)
    day = Column(Integer, nullable=False)
    hour = Column(Integer, nullable=False)
    predicted_temp = Column(Float, nullable=False)
    adjusted_temp = Column(Float)
    outdoor_temp = Column(Float)
    heater_level = Column(Integer)
    fan_speed = Column(Integer)
    comfort_temp = Column(Float)
    created_at = Column(TIMESTAMP, default=func.now())


class IndoorTemperatureData(Base):
    """
    Table indoor_temperature_data : Données réelles des capteurs
    """
    __tablename__ = "indoor_temperature_data"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    timestamp = Column(DateTime, nullable=False, index=True)
    year = Column(Integer, nullable=False)
    month = Column(Integer, nullable=False)
    day = Column(Integer, nullable=False)
    hour = Column(Integer, nullable=False)
    indoor_temp = Column(Float, nullable=False)
    heater_level = Column(Integer)
    fan_level = Column(Integer)
    created_at = Column(TIMESTAMP, default=func.now())

