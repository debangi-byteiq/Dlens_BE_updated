import base64
from datetime import datetime, timedelta, timezone
from types import SimpleNamespace
from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from passlib.context import CryptContext
from sqlalchemy.orm import joinedload, Session
import jwt
from app.database import get_db_session
from app.config import settings
from app.models import User, UserToken

pwd_context=CryptContext(schemes=['bcrypt'],deprecated="auto")

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login", auto_error=False)


def auth_bypass_enabled():
    return settings.AUTH_BYPASS


def hash_password(password:str):
    return pwd_context.hash(password)

def verify_password(plain_pass,hashed_pass):
    return pwd_context.verify(plain_pass,hashed_pass)

def str_encode(string: str) -> str:
    return base64.b85encode(string.encode('ascii')).decode('ascii')

def str_decode(string: str) -> str:
    return base64.b85decode(string.encode('ascii')).decode('ascii')

def generate_token(payload: dict, secret: str, algo: str, expiry: timedelta):
    expire =  datetime.now(timezone.utc) + expiry
    payload.update({"exp": expire})
    return jwt.encode(payload, secret, algorithm=algo)


def get_token_payload(token: str, secret: str, algo: str):
    try:
        payload = jwt.decode(token, secret, algorithms=algo)
    except Exception as jwt_exec:
        payload = None
    return payload

async def get_token_user(token: str, db):
    payload = get_token_payload(token, settings.JWT_SECRET, settings.JWT_ALGORITHM)
    if payload:
        user_token_id = str_decode(payload.get('r'))
        user_id = str_decode(payload.get('sub'))
        access_key = payload.get('a')
        user_token = db.query(UserToken).options(joinedload(UserToken.user)).filter(UserToken.access_key == access_key,
                                                 UserToken.id == user_token_id,
                                                 UserToken.user_id == user_id,
                                                 UserToken.expires_at >  datetime.now(timezone.utc)
                                                 ).first()
        if user_token:
            return user_token.user
    return None


async def load_user(email: str, db):
     
    try:
        user = db.query(User).filter(User.email == email).first()
    except Exception as user_exec:
        
        user = None
    return user


async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db_session)):
    if auth_bypass_enabled():
        user_id = str(settings.AUTH_BYPASS_USER_ID)
        user = db.query(User).filter(User.id == user_id).first()
        return user or SimpleNamespace(id=user_id, name="Dev User", email="dev@example.com")

    user = await get_token_user(token=token, db=db)
    if user:
        return user
    raise HTTPException(status_code=401, detail="Not authorised.")


async def logout(token,db):
    payload = get_token_payload(token, settings.JWT_SECRET, settings.JWT_ALGORITHM)
    if payload:
        user_token_id = str_decode(payload.get('r'))
        user_id = str_decode(payload.get('sub'))
        access_key = payload.get('a')
        user_token = db.query(UserToken).filter(UserToken.access_key == access_key,
                                                 UserToken.id == user_token_id,
                                                 UserToken.user_id == user_id,
                                                 UserToken.expires_at >  datetime.now(timezone.utc)
                                                 ).first()

    if not user_token:
        raise HTTPException(status_code=404,detail='Invalid Request')
    
    db.delete(user_token)
    db.commit()

    return None
