from motor.motor_asyncio import AsyncIOMotorClient

from app.config import settings

class DataFetcher:
    def __init__(self,user_id):
        self._cache={}
        self.user_id=user_id
        self.client=AsyncIOMotorClient(settings.MONGO_CRED)
        self.db=self.client.Local_NEW
        self.source_collection=self.db.Source
        # print("INSIDE DATA FETCHER")

    async def fetch_data(self):
        """
        Fetches data for a specific user from the database if not already cached.
        """
        # print("INSIDE FETCH DATA")
        if self.user_id not in self._cache:
           await self._fetch_from_db()

        return  self._cache.get(self.user_id)
    
    async def refresh_data(self):
        """
        Forces a refresh of the cached data for the given user by fetching from the database.
        """
        # print("INSIDE refresh_data  DATA")
        await self._fetch_from_db()
        return self._cache.get(self.user_id)
    
    async def _fetch_from_db(self):
        """
        Internal method to fetch data from the database for a specific user.
        """
        # print('INSIDE FETCH FROM DB')
        cursor=self.source_collection.find({"details.user_id":str(self.user_id)}).sort("refreshed_date", -1).limit(1)
        data=await cursor.to_list()

        if data:
            self._cache[self.user_id]=data[0]['details']
            print(f"Data fetched and cached for user {self.user_id}: {self._cache[self.user_id]}")
        else:
            print(f"No documents found for user {self.user_id}.")
