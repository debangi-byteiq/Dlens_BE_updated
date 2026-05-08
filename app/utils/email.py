from fastapi import BackgroundTasks
from app.config import settings
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig, MessageType
from jinja2 import Template

USER_VERIFY_ACCOUNT='verify-account'
FORGOT_PASSWORD='forgot-password'

# FOR mailtrap websitex
# conf = ConnectionConfig(
#     MAIL_USERNAME=settings.MAIL_USERNAME,
#     MAIL_PASSWORD=settings.MAIL_PASSWORD,
#     MAIL_FROM=settings.MAIL_FROM,
#     MAIL_SERVER=settings.MAIL_SERVER,
#     MAIL_PORT=settings.MAIL_PORT,
#     MAIL_FROM_NAME=settings.MAIL_FROM_NAME,
#     MAIL_STARTTLS=settings.MAIL_STARTTLS,
#     MAIL_SSL_TLS=settings.MAIL_SSL_TLS, 
# )


# FOR LOCAL
conf = ConnectionConfig(
    MAIL_USERNAME="localhost", 
    MAIL_PASSWORD="", 
    MAIL_FROM="your_email@example.com",
    MAIL_PORT=1025,
    MAIL_SERVER="localhost",
    MAIL_STARTTLS=False,
    MAIL_SSL_TLS=False,
    USE_CREDENTIALS=False
)

fm=FastMail(conf)

async def send_email(recipients: list, subject: str, context: dict, template_name: str,
                     background_tasks: BackgroundTasks):
    

    with open(f"app/templates/user/{template_name}.html", "r", encoding="utf-8") as file:
        template_str = file.read()


    template = Template(template_str)
    rendered_template = template.render(context)

    message = MessageSchema(
        subject=subject,
        recipients=recipients,
        template_body=rendered_template,
        subtype=MessageType.html
    )

    background_tasks.add_task(fm.send_message, message, template_name=template_name)

 