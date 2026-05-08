from fastapi import APIRouter, Depends
from datetime import datetime, timedelta
from fastapi import HTTPException
from app.auth.user import get_current_user_id
from app.schema.schema import Source
from app.core.db_utils import check_conn_mysql,check_conn_postgres
from app.core.mongo_db import source_collection
# from app.core.postgres_db import conn, cursor
from app.core.db_pool import get_cursor

router=APIRouter()

@router.get("/master_table")
async def get_all_tables(user_id:int=Depends(get_current_user_id)):
    try:
        with get_cursor() as cursor:

            query = f"SELECT table_name, schema_name, processed_date, is_active,source,time_taken FROM processed_tables_tracker where user_id ={user_id} ORDER BY processed_date desc;"
            cursor.execute(query)
            raw_data=cursor.fetchall()  
            master_df = []
            for row in raw_data:
                        row = dict(row)
                         
                        time_taken_seconds = row.get('time_taken', 0)
                        try:
                            td = timedelta(seconds=float(time_taken_seconds))
                            total_seconds = int(td.total_seconds())
                            hours, remainder = divmod(total_seconds, 3600)
                            minutes, seconds = divmod(remainder, 60)
                            
                            if hours > 0:
                                time_str = f"{hours} hours, {minutes} minutes, {seconds} seconds"
                            else:
                                time_str = f"{minutes} minutes, {seconds} seconds"
                        except (ValueError, TypeError):
                            time_str = "Invalid time"
                        row['time_taken'] = time_str 

                        processed_date = row.get('processed_date')
                        if isinstance(processed_date, datetime):
                            row['processed_date'] = processed_date.strftime("%B %d, %Y at %I:%M %p")
                        else:
                            row['processed_date'] = "Invalid Date"

                        master_df.append(row)
        return master_df
    except Exception as e:
        print(e)
        return []

@router.post("/save_source")
async def save_details(source: Source,user_id:int=Depends(get_current_user_id)):
    try:
        
        if not source.details:
            raise HTTPException(status_code=400, detail="Empty data sent, please check again")

        print(source,'source FIRST')
        source_dict = source.model_dump()
        source_dict['refreshed_date']=datetime.now()
        # print(source_dict,'source ')
        db_type=source_dict['details']['text']
        
        d=source_dict['details']
        source_dict['details']['user_id']=user_id
        date_col=d['datecol']
        
        if(db_type=='Postgres'):
            check=check_conn_postgres(d['hostname'],d['dbname'],d['username'],d['password'],d['table_name'],d['datecol'])
        elif(db_type=='MySQL'):
            print("SUCCESS1")
            check=check_conn_mysql(d['hostname'],d['dbname'],d['username'],d['password'],d['table_name'],d['datecol'])
            print("SUCCESS2")
        else:
            raise HTTPException(status_code=400 , detail = f"Unsupported database type: {db_type}")
        
        if check:
            result = await source_collection.insert_one(source_dict)
        else:
            raise HTTPException(status_code=400,detail=f'This {date_col} Column does not exist')
        
        return {
            "message": "Data Saved Successfully",
            "id": str(result.inserted_id)
        }
 
    except Exception as e:
        print(e)
       
        raise HTTPException(status_code=400, detail=f'Error occured while saving the data , ERROR IS {e}')
    
