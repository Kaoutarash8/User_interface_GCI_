"""
Modèle pour la table user_mode_history
Historique des changements de mode (AUTO/MANUEL)
"""
from sqlalchemy import Column, Integer, TIMESTAMP
from sqlalchemy.sql import func
from database.database import Base


class UserModeHistory(Base):
    """
    Table user_mode_history : Historique des modes
    mode = 1 pour AUTO, mode = 0 pour MANUEL
    """
    __tablename__ = "user_mode_history"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    mode = Column(Integer, nullable=False, comment="1 = AUTO | 0 = MANUEL")
    selected_at = Column(TIMESTAMP, default=func.now(), index=True)

