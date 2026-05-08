from motor.motor_asyncio import AsyncIOMotorClient

from app.config import settings

client = AsyncIOMotorClient(settings.MONGO_CRED)
db = client.Local_NEW
source_collection = db.Source
