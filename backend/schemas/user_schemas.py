# schemas/user_schemas.py
from pydantic import BaseModel, Field

class LoginRequest(BaseModel):
    password: str = Field(..., description="Mot de passe")

class ChangePasswordRequest(BaseModel):
    new_password: str = Field(..., min_length=4, description="Nouveau mot de passe")

class LoginResponse(BaseModel):
    message: str
    success: bool