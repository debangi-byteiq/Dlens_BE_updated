
from pydantic import BaseModel ,EmailStr

class RegisterUser(BaseModel):
    name:str
    email:EmailStr
    password:str

class UserResponse(BaseModel):
    name:str
    email:EmailStr 

class VerifyUserRequest(BaseModel):
    token: str
    email: EmailStr

class LoginResponse(BaseModel):
    access_token :str
    refresh_token :str
    expires_in :str
    token_type :str="Bearer"

 
class EmailRequest(BaseModel):
    email: EmailStr
    
class ResetRequest(BaseModel):
    token: str
    email: EmailStr
    password: str