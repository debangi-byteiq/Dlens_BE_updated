from fastapi import APIRouter, Depends, Path, Request
from typing import List
from pydantic import BaseModel
from app.auth.user import get_current_user_id
from app.schema.shift_schema import MacroModel, NumericModel, CategoricalModel, DSIndexModel, TimelinessModel
# from app.core.postgres_db import conn, cursor
from app.core.db_pool import get_cursor 
from app.core.postgres_utils import fetch_rows_if_table_exists

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
        table_name = table_name.lower()

        with get_cursor() as cursor:
            query_trend = "SELECT * FROM table_timeliness where table_name=%s and user_id=%s"
            shift_trend = [
                TimelinessModel(**row)
                for row in fetch_rows_if_table_exists(cursor, "table_timeliness", query_trend, (table_name, user_id))
            ]

            query_ds_index = "SELECT * FROM table_ds_index where table_name=%s and user_id=%s"
            ds_index = [
                DSIndexModel(**row)
                for row in fetch_rows_if_table_exists(cursor, "table_ds_index", query_ds_index, (table_name, user_id))
            ]

            query_categorical = "SELECT * FROM table_categorical_shift where table_name=%s and user_id=%s"
            categorical = [
                CategoricalModel(**row)
                for row in fetch_rows_if_table_exists(cursor, "table_categorical_shift", query_categorical, (table_name, user_id))
            ]

            query_numerical = "SELECT * FROM table_numeric_shift where table_name=%s and user_id=%s"
            numerical = [
                NumericModel(**row)
                for row in fetch_rows_if_table_exists(cursor, "table_numeric_shift", query_numerical, (table_name, user_id))
            ]

            query_macro = "SELECT * FROM table_macroshift where table_name=%s and user_id=%s"
            macro = [
                MacroModel(**row)
                for row in fetch_rows_if_table_exists(cursor, "table_macroshift", query_macro, (table_name, user_id))
            ]

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
