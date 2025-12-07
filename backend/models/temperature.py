# models/temperature.py
from sqlalchemy import Column, Integer, Float, DateTime, TIMESTAMP, Boolean
from sqlalchemy.sql import func
from database.database import Base

class IndoorTemperatureData(Base):
    __tablename__ = "IndoorTempData2020_2025"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    timestamp = Column(DateTime, nullable=False, index=True)
    year = Column(Integer, nullable=False)
    month = Column(Integer, nullable=False)
    day = Column(Integer, nullable=False)
    hour = Column(Integer, nullable=False)
    indoor_temp = Column(Float, nullable=False)
    heater_level = Column(Integer)
    fan_level = Column(Integer)
    

class TemperaturePrediction(Base):
    __tablename__ = "TemperaturePredictions"

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
    prediction_date = Column(DateTime, default=func.now())
    