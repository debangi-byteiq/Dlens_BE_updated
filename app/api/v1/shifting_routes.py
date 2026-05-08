from fastapi import APIRouter, Depends, Path, Request
from typing import List
from pydantic import BaseModel
from app.auth.user import get_current_user_id
from app.schema.shift_schema import MacroModel, NumericModel, CategoricalModel, DSIndexModel, TimelinessModel
# from app.core.postgres_db import conn, cursor
from app.core.db_pool import get_cursor 

router = APIRouter()

class ShiftResponse(BaseModel):
    shift_trend: List[TimelinessModel]
    ds_index: List[DSIndexModel]
    categorical: List[CategoricalModel]
    numerical: List[NumericModel]
    macro: List[MacroModel]

@router.get("/shifting/{table_name}", response_model=ShiftResponse)
async def get_shift_all(request: Request, table_name: str = Path(..., description="Enter table name from 'master_table'"),user_id:int=Depends(get_current_user_id)):
    try:
        with get_cursor() as cursor:
            query_trend = f"SELECT * FROM table_timeliness where table_name='{table_name}' and user_id ={user_id}"
            cursor.execute(query_trend)
            shift_trend = [TimelinessModel(**row) for row in cursor.fetchall()]

            query_ds_index = f"SELECT * FROM table_ds_index where table_name='{table_name}' and user_id ={user_id}"
            cursor.execute(query_ds_index)
            ds_index = [DSIndexModel(**row) for row in cursor.fetchall()]

            query_categorical = f"SELECT * FROM table_categorical_shift where table_name='{table_name}' and user_id ={user_id}"
            cursor.execute(query_categorical)
            categorical = [CategoricalModel(**row) for row in cursor.fetchall()]

            query_numerical = f"SELECT * FROM table_numeric_shift where table_name='{table_name}' and user_id ={user_id}"
            cursor.execute(query_numerical)
            numerical = [NumericModel(**row) for row in cursor.fetchall()]

            query_macro = f"SELECT * FROM table_macroshift where table_name='{table_name}' and user_id ={user_id}"
            cursor.execute(query_macro)
            macro = [MacroModel(**row) for row in cursor.fetchall()]

        return ShiftResponse(
            shift_trend=shift_trend,
            ds_index=ds_index,
            categorical=categorical,
            numerical=numerical,
            macro=macro
        )
    except Exception as e:
        print(e)
        return ShiftResponse(
            shift_trend=[], ds_index=[], categorical=[], numerical=[], macro=[]
        )
