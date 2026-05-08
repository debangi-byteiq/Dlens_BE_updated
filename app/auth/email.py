from fastapi import BackgroundTasks
from app.config import settings
from app.models import User
from app.utils.email import FORGOT_PASSWORD, send_email ,USER_VERIFY_ACCOUNT
from app.utils.security import hash_password
 
# from app.utils.email import USER_VERIFY_ACCOUNT, FORGOT_PASSWORD

async def send_account_verification_email(user: User, background_tasks: BackgroundTasks):
     
    string_context = user.get_context_string(context=USER_VERIFY_ACCOUNT)
    token = hash_password(string_context)
    # activate_url = f"{settings.FRONTEND_HOST}/auth/account-verify?token={token}&email={user.email}"
    activate_url = f"localhost:5173/auth/account-verify?token={token}&email={user.email}"
    data = {
        'app_name': settings.APP_NAME,
        "name": user.name,
        'activate_url': activate_url
    }
    subject = f"Account Verification - {settings.APP_NAME}"
    await send_email(
        recipients=[user.email],
        subject=subject,
        template_name="account-verification",
        context=data,
        background_tasks=background_tasks
    )


async def send_account_activation_confirmation_email(user: User, background_tasks: BackgroundTasks):
    data = {
        'app_name': settings.APP_NAME,
        "name": user.name,
        'login_url': f'{settings.FRONTEND_HOST}'
    }
    subject = f"Welcome - {settings.APP_NAME}"
    await send_email(
        recipients=[user.email],
        subject=subject,
        template_name="account-verification-confirmation",
        context=data,
        background_tasks=background_tasks
    )
    
async def send_password_reset_email(user: User, background_tasks: BackgroundTasks):
     
    string_context = user.get_context_string(context=FORGOT_PASSWORD)
    token = hash_password(string_context)
    reset_url = f"{settings.FRONTEND_HOST}/reset-password?token={token}&email={user.email}"
    data = {
        'app_name': settings.APP_NAME,
        "name": user.name,
        'activate_url': reset_url,
    }
    subject = f"Reset Password - {settings.APP_NAME}"
    await send_email(
        recipients=[user.email],
        subject=subject,
        template_name="password-reset",
        context=data,
        background_tasks=background_tasks
    )