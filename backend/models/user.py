# models/user.py
from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from database.database import Base

class User(Base):
    __tablename__ = "Users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    password = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=func.now())