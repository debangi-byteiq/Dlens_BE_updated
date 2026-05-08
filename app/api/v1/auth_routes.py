from fastapi import APIRouter, BackgroundTasks, Header,status,Depends,status
from fastapi.responses import JSONResponse
from app.schema.auth_schema import EmailRequest, RegisterUser, ResetRequest,UserResponse, VerifyUserRequest,LoginResponse
from app.auth import user
from app.database import get_db_session
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordRequestForm
from app.utils.security import get_current_user, logout, oauth2_scheme

 
user_router = APIRouter(
    prefix="/users",
    tags=["Users"],
    responses={404: {"description": "Not found"}},
)

auth_router = APIRouter(
    prefix="/users",
    tags=["Users"],
    responses={404: {"description": "Not found"}},
    dependencies=[Depends(oauth2_scheme) ]
)

guest_router = APIRouter(
    prefix="/auth",
    tags=["Auth"],
    responses={404: {"description": "Not found"}},
)


@user_router.post("/",response_model=UserResponse,status_code=status.HTTP_201_CREATED)
async def register_user(user_data:RegisterUser,backgroundTask:BackgroundTasks,db_session : Session =Depends(get_db_session)):
    
    return await user.create_user_account(user_data,db_session,backgroundTask)


@user_router.post("/verify", status_code=status.HTTP_200_OK)
async def verify_user_account(data: VerifyUserRequest, background_tasks: BackgroundTasks, session: Session = Depends(get_db_session)):
    await user.activate_user_account(data, session, background_tasks)
    return JSONResponse({"message": "Account is activated successfully."})

# @router.post('/login',status_code=status.HTTP_200_OK,response_model=LoginResponse)

@guest_router.post('/login',status_code=status.HTTP_200_OK,response_model=LoginResponse)
async def user_login(data:OAuth2PasswordRequestForm=Depends() ,session:Session=Depends(get_db_session)):
   return  await user.get_login_token(data,session)


@guest_router.post("/refresh", status_code=status.HTTP_200_OK, response_model=LoginResponse)
async def refresh_token(refresh_token = Header(), session: Session = Depends(get_db_session)):
    return await user.get_refresh_token(refresh_token, session)


@guest_router.post("/forgot-password", status_code=status.HTTP_200_OK)
async def forgot_password(data: EmailRequest, background_tasks: BackgroundTasks, session: Session = Depends(get_db_session)):
    await user.email_forgot_password_link(data, background_tasks, session)
    return JSONResponse({"message": "A email with password reset link has been sent to you."})

@guest_router.put("/reset-password", status_code=status.HTTP_200_OK)
async def reset_password(data: ResetRequest, session: Session = Depends(get_db_session)):
    await user.reset_user_password(data, session)
    return JSONResponse({"message": "Your password has been updated."})

# @auth_router.get("/me", status_code=status.HTTP_200_OK, response_model=UserResponse)      
@auth_router.get("/me", status_code=status.HTTP_200_OK)
async def fetch_user(user = Depends(get_current_user)):
    return {"Name":user.name,"Email":user.email}

# @auth_router.post("/logout")
# async def logout_(token:str=Depends(oauth2_scheme),db:Session=Depends(get_db_session)):
#     await logout(token,db)
#     return {"message": "Successfully logged out"}

