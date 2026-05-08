from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app import models
from app.api.v1 import (
    auth_routes,
    health_routes,
    kde_routes,
    profiling_routes,
    run_routes,
    shifting_routes,
    source_routes,
    upload_routes,
)
from app.database import engine


openapi_tags = [
    {"name": "Health", "description": "Runtime readiness checks for API, databases, Spark, and local dependencies."},
    {"name": "Source"},
    {"name": "Profiling"},
    {"name": "Shifting"},
    {"name": "KDE"},
    {"name": "File Upload"},
    {"name": "Run Script"},
    {"name": "Users"},
    {"name": "Auth"},
]


app = FastAPI(title="DLens API", openapi_tags=openapi_tags)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# This project does not have migrations yet. Keep auth table creation explicit
# until Alembic or another migration tool is introduced.
models.Base.metadata.create_all(bind=engine)


@app.get("/", tags=["Health"])
async def read_root():
    return {"message": "Welcome to the DataQuality application!"}


app.include_router(health_routes.router)
app.include_router(source_routes.router, tags=["Source"])
app.include_router(profiling_routes.router, tags=["Profiling"])
app.include_router(shifting_routes.router, tags=["Shifting"])
app.include_router(kde_routes.router, tags=["KDE"])
app.include_router(upload_routes.router, tags=["File Upload"])
app.include_router(run_routes.router, tags=["Run Script"])

app.include_router(auth_routes.user_router)
app.include_router(auth_routes.auth_router)
app.include_router(auth_routes.guest_router)
