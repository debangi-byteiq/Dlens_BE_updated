from motor.motor_asyncio import AsyncIOMotorClient
import asyncio
import os
from dotenv import load_dotenv

load_dotenv('.env')

client = AsyncIOMotorClient(os.getenv('mongo_cred'))
db = client.Local_NEW
source_collection = db.Source
