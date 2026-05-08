from pathlib import Path

from pydantic.v1 import BaseSettings, Field


BACKEND_ROOT = Path(__file__).resolve().parents[1]
ENV_FILE = BACKEND_ROOT / ".env"


class Settings(BaseSettings):

    APP_NAME: str = "DLens"
    FRONTEND_HOST: str = "http://localhost:5173"

    MAIL_USERNAME: str = ""
    MAIL_PASSWORD: str = ""
    MAIL_PORT: int = 1025
    MAIL_SERVER: str = "localhost"
    MAIL_STARTTLS: bool = False
    MAIL_SSL_TLS: bool = False
    MAIL_DEBUG: bool = True
    MAIL_FROM: str = "your_email@example.com"
    MAIL_FROM_NAME: str = "DefaultAppName"  

    DB_HOST: str = "localhost"
    DB_PORT: int = 5432
    DB_NAME: str = "dq_destination7"
    DB_USER: str = "postgres"
    DB_PASSWORD: str = "postgres"
    SQLALCHEMY_DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/fastapi_auth"
    MONGO_CRED: str = Field(default="mongodb://localhost:27017", env=["mongo_cred", "MONGO_CRED"])
    UPLOAD_DIRECTORY: str = "uploaded_files/excel"

    AUTH_BYPASS: bool = True
    AUTH_BYPASS_USER_ID: int = 1

    JAVA_HOME: str = ""
    HADOOP_HOME: str = ""
    POSTGRES_JDBC_JAR: str = ""

    JWT_SECRET: str = "649fb93ef34e4fdf4187709c84d643dd61ce730d91856418fdcf563f895ea40f"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_MINUTES: int = 14400

    SECRET_KEY: str = "8deadce9449770680910741063cd0a3fe0acb62a8978661f421bbcbb66dc41f1"


    @property
    def upload_directory_path(self) -> Path:
        path = Path(self.UPLOAD_DIRECTORY)
        if path.is_absolute():
            return path
        return BACKEND_ROOT / path

    class Config:
        env_file = str(ENV_FILE)
        allow_population_by_field_name = True
        extra = "ignore"


settings = Settings()
