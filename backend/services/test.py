from services.main.main import Main
from services.main.source_cred import DataFetcher
import asyncio
 
async def run_script(save: str = "Destination"):
    """
    Endpoint to run the script logic.
    """

    a=await DataFetcher.refresh_data()
    # print(a,"data fetched")

    db_type=a['text']

    if db_type == 'csv':
        data_source_type = 'csv'
    else:
        data_source_type = 'RDBMS'

    main_obj = Main(data_source_type=data_source_type)   
    await main_obj.initialize()
    main_obj.run(save=save)

    return {"status": "success", "message": f"Script executed with save='{save}'"}

asyncio.run(run_script())