from app.utils.security import get_current_user
from fastapi import FastAPI,Depends
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from app.api.v1 import source_routes, profiling_routes, shifting_routes,upload_routes,run_routes,kde_routes
# from app.core import postgres_db
from app.api.v1 import auth_routes as user
from app import models
from app.database import engine
from app.auth.user import get_current_user_id

app = FastAPI()
load_dotenv(".env")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

models.Base.metadata.create_all(bind=engine)

@app.get("/")
async def read_root():
    return {"message": "Welcome to the DataQuality application!"}

DEBUG = True

app.include_router(source_routes.router,tags=["Source"])
app.include_router(profiling_routes.router, tags=["Profiling"])
app.include_router(shifting_routes.router,tags=["Shifting"] )
app.include_router(kde_routes.router,tags=["KDE"] )
app.include_router(upload_routes.router,tags=["File Upload"])
app.include_router(run_routes.router,tags=["Run Script"] )

app.include_router(user.user_router)
app.include_router(user.auth_router)
app.include_router(user.guest_router)

# app.include_router(user.router, prefix="/api/v1/test")