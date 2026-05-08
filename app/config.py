from pydantic.v1 import BaseSettings

class Settings(BaseSettings):

    APP_NAME:str="DLens"
    FRONTEND_HOST : str=""

    MAIL_USERNAME: str = "your_username"
    MAIL_PASSWORD: str = "your_password"
    MAIL_PORT: int = 1025
    MAIL_SERVER: str = "localhost"
    MAIL_STARTTLS: bool = False
    MAIL_SSL_TLS: bool = False
    MAIL_DEBUG: bool = True
    MAIL_FROM: str = 'your_email@example.com'
    MAIL_FROM_NAME: str = "DefaultAppName"  


    JWT_SECRET: str =   "649fb93ef34e4fdf4187709c84d643dd61ce730d91856418fdcf563f895ea40f"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_MINUTES: int =14400

    SECRET_KEY: str =  "8deadce9449770680910741063cd0a3fe0acb62a8978661f421bbcbb66dc41f1"


    # TEMPLATE_FOLDER=Path(__file__).parent.parent / "templates",
     
    class Config:
        env_file = ".env"

settings=Settings()