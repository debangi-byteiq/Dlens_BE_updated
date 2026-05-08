from datetime import datetime, timedelta
import secrets
from fastapi import HTTPException,BackgroundTasks, Security
from fastapi.security import OAuth2PasswordBearer
from app.models import User, UserToken
from app.utils.email import FORGOT_PASSWORD, USER_VERIFY_ACCOUNT
from app.utils.security import generate_token, get_token_payload, hash_password, load_user, str_decode, str_encode,verify_password
from app.auth.email import send_account_verification_email,send_account_activation_confirmation_email, send_password_reset_email
import logging
from app.config import settings
from datetime import datetime, timezone
from sqlalchemy.orm import joinedload, Session

security = OAuth2PasswordBearer(tokenUrl="/auth/login", auto_error=False)


def auth_bypass_enabled():
    return settings.AUTH_BYPASS

async def create_user_account(data,session,background_task:BackgroundTasks):

    user_exist=session.query(User).filter(User.email==data.email).first()

    if user_exist:
        raise HTTPException(status_code=400,detail='Email already Exists')
    
    user=User()
    user.name=data.name
    user.email=data.email
    user.password=hash_password(data.password)
    user.is_active=False
    user.updated_at=datetime.now(timezone.utc)
    
    session.add(user)
    session.commit()
    session.refresh(user)

    await send_account_verification_email(user,background_task)

    return user

   
async def activate_user_account(data, session, background_tasks):
    user = session.query(User).filter(User.email == data.email).first()
    if not user:
        raise HTTPException(status_code=400, detail="This link is not valid.")
    
    user_token = user.get_context_string(context=USER_VERIFY_ACCOUNT)   

    try:
        token_valid = verify_password(user_token, data.token)
    except Exception as verify_exec:
        logging.exception(verify_exec)
        token_valid = False
    if not token_valid:
        raise HTTPException(status_code=400, detail="This link either expired or not valid.")
    
    user.is_active = True
    user.updated_at = datetime.now(timezone.utc)
    user.verified_at = datetime.now(timezone.utc)
    session.add(user)
    session.commit()
    session.refresh(user)
 
    await send_account_activation_confirmation_email(user, background_tasks)
    
async def get_login_token(data,session):

    user=session.query(User).filter(User.email==data.username).first()

    if not user:
        raise HTTPException(status_code=400,detail='Email is not resgistered with us')
    
    if not verify_password(data.password,user.password):
        raise HTTPException(status_code=400,detail= 'Invalid Email or Password')
    
    if not user.verified_at:
        raise HTTPException(status_code=400, detail="Your account is not verified. Please check your email inbox to verify your account.")
    
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Your account has been dactivated. Please contact support.")
    
    return _generate_tokens(user, session)

def _generate_tokens(user, session):
    refresh_key = secrets.token_urlsafe(100)
    access_key = secrets.token_urlsafe(50)
    rt_expires = timedelta(minutes=settings.REFRESH_TOKEN_EXPIRE_MINUTES)

    user_token = UserToken()
    user_token.user_id = user.id
    user_token.refresh_key = refresh_key
    user_token.access_key = access_key
    user_token.expires_at = datetime.now(timezone.utc) + rt_expires
    session.add(user_token)
    session.commit()
    session.refresh(user_token)

    at_payload = {
        "sub": str_encode(str(user.id)),
        'a': access_key,
        'r': str_encode(str(user_token.id)),
        'n': str_encode(f"{user.name}")
    }

    at_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = generate_token(at_payload, settings.JWT_SECRET, settings.JWT_ALGORITHM, at_expires)

    rt_payload =  {
        "sub": str_encode(str(user.id)),
        "t": refresh_key,
        'a': access_key
        }
    
    refresh_token = generate_token(rt_payload, settings.SECRET_KEY, settings.JWT_ALGORITHM, rt_expires)

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "expires_in": str(at_expires.seconds)
    }


async def get_refresh_token(refresh_token, session):
    token_payload = get_token_payload(refresh_token, settings.SECRET_KEY, settings.JWT_ALGORITHM)
    if not token_payload:
        raise HTTPException(status_code=400, detail="Invalid Request.")
    
    refresh_key = token_payload.get('t')
    access_key = token_payload.get('a')
    user_id = str_decode(token_payload.get('sub'))
    user_token = session.query(UserToken).options(joinedload(UserToken.user)).filter(UserToken.refresh_key == refresh_key,
                                                 UserToken.access_key == access_key,
                                                 UserToken.user_id == user_id,
                                                 UserToken.expires_at > datetime.now(timezone.utc)
                                                 ).first()
    if not user_token:
        raise HTTPException(status_code=400, detail="Invalid Request.")
    
    user_token.expires_at = datetime.now(timezone.utc)
    session.add(user_token)
    session.commit()
    return _generate_tokens(user_token.user, session)

async def email_forgot_password_link(data, background_tasks, session):
    user = await load_user(data.email, session)

    if not user:
        raise HTTPException(status_code=400, detail="User does not exists")
    
    if not user.verified_at:
        raise HTTPException(status_code=400, detail="Your account is not verified. Please check your email inbox to verify your account.")
    
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Your account has been dactivated. Please contact support.")
    
    await send_password_reset_email(user, background_tasks)


async def reset_user_password(data, session):
    user = await load_user(data.email, session)
    
    if not user:
        raise HTTPException(status_code=400, detail="Invalid request")
    
    if not user.verified_at:
        raise HTTPException(status_code=400, detail="Invalid request")
    
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Invalid request")
    
    user_token = user.get_context_string(context=FORGOT_PASSWORD)
    try:
        token_valid = verify_password(user_token, data.token)
    except Exception as verify_exec:
        logging.exception(verify_exec)
        token_valid = False
    if not token_valid:
        raise HTTPException(status_code=400, detail="Invalid window.")
    
    user.password = hash_password(data.password)
    user.updated_at =  datetime.now(timezone.utc)
    session.add(user)
    session.commit()
    session.refresh(user)
    
    
async def fetch_user_detail(pk, session):
    user = session.query(User).filter(User.id == pk).first()
    if user:
        return user
    raise HTTPException(status_code=400, detail="User does not exists.")

def get_current_user_id(token: str = Security(security)):

    if auth_bypass_enabled():
        return str(settings.AUTH_BYPASS_USER_ID)

    if token is None:
        raise HTTPException(status_code=401, detail="Invalid authorization")
       
    # print(f"Received Token: {token}")
     
    token_payload = get_token_payload(token, settings.JWT_SECRET, settings.JWT_ALGORITHM)
    
    if not token_payload:
        print("Error: Token Payload is None")
        raise HTTPException(status_code=401, detail="Invalid token")
   
    # print(f"Token Payload: {token_payload}")
    user_id = str_decode(token_payload.get("sub"))
    print("User ID is:", user_id)
   
    if not user_id:
        print("Error: User ID is missing or invalid")
        raise HTTPException(status_code=401, detail="Invalid user")
   
    return user_id
