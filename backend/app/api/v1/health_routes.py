import os
from datetime import datetime, timezone

from fastapi import APIRouter, status
from fastapi.responses import JSONResponse
from sqlalchemy import text

from app.core.db_pool import get_cursor
from app.core.mongo_db import client as mongo_client
from app.core.runtime_checks import check_hadoop_runtime, check_java_runtime, check_postgres_jdbc_driver
from app.config import settings
from app.database import engine


router = APIRouter()


def healthy_component(extra=None):
    data = {"status": "ok"}
    if extra:
        data.update(extra)
    return data


def unhealthy_component(exc):
    return {
        "status": "error",
        "error": exc.__class__.__name__,
        "detail": str(exc),
    }


def check_auth_database():
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        return healthy_component()
    except Exception as exc:
        return unhealthy_component(exc)


def check_pipeline_database():
    try:
        with get_cursor() as cursor:
            cursor.execute("SELECT 1")
            cursor.fetchone()
        return healthy_component()
    except Exception as exc:
        return unhealthy_component(exc)


async def check_mongo_database():
    try:
        await mongo_client.admin.command("ping")
        return healthy_component()
    except Exception as exc:
        return unhealthy_component(exc)


def check_upload_directory():
    upload_directory = settings.upload_directory_path
    try:
        os.makedirs(upload_directory, exist_ok=True)
        writable = os.access(upload_directory, os.W_OK)
        if not writable:
            raise RuntimeError("UPLOAD_DIRECTORY is not writable")

        return healthy_component({"path": str(upload_directory)})
    except Exception as exc:
        return unhealthy_component(exc)


@router.get("/health", tags=["Health"])
async def health_check():
    checks = {
        "api": healthy_component(),
        "auth_database": check_auth_database(),
        "pipeline_database": check_pipeline_database(),
        "mongo_database": await check_mongo_database(),
        "upload_directory": check_upload_directory(),
        "java_runtime": check_java_runtime(),
        "hadoop_runtime": check_hadoop_runtime(),
        "postgres_jdbc_driver": check_postgres_jdbc_driver(),
    }

    is_healthy = all(component["status"] == "ok" for component in checks.values())
    body = {
        "status": "ok" if is_healthy else "degraded",
        "checked_at": datetime.now(timezone.utc).isoformat(),
        "checks": checks,
    }

    status_code = status.HTTP_200_OK if is_healthy else status.HTTP_503_SERVICE_UNAVAILABLE
    return JSONResponse(status_code=status_code, content=body)
