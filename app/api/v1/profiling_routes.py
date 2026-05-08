from fastapi import APIRouter, Depends, Path
from typing import List, Optional
from app.auth.user import get_current_user_id
from app.schema.profile_schema import (
    MetaData, ColumnMeta, NumericalDetail, CategoryDetail, DateDetail
)
# from app.core.postgres_db import conn, cursor
from app.core.db_pool import get_cursor 
from pydantic import BaseModel

router = APIRouter()

class TableProfilingResponse(BaseModel):
    table_meta: List[MetaData]
    kde_index: List[ColumnMeta]
    numerical_details: List[NumericalDetail]
    category_details: List[CategoryDetail]
    date_details: List[DateDetail]

@router.get("/profiling/{table_name}", response_model=TableProfilingResponse, tags=["Profiling"] )
async def get_table_profiling(table_name: str = Path(..., description="Enter table name from 'master_table'"),user_id:int=Depends(get_current_user_id)):
    try:
        with get_cursor() as cursor:

            cursor.execute(f"""
                SELECT data_field, record, completeness, duplicates, numerical, categorical, date 
                FROM table_meta_data 
                WHERE table_name='{table_name}' and user_id ={user_id}
            """)
            table_meta = [MetaData(**row) for row in cursor.fetchall()]
    
            cursor.execute(f"""
                SELECT column_name, d_type, "Non_null_count", fill_rate, rank, unique_count, unique_rate 
                FROM table_column_meta 
                WHERE table_name='{table_name}' and user_id ={user_id}
            """)
            kde_index = [ColumnMeta(**row) for row in cursor.fetchall()]
    
            cursor.execute(f"""
                SELECT column_name, count, min, max, percentile_05, percentile_95, percentile_25, 
                    percentile_75, median, mean, std_dev, skewness, variance, first, second, 
                    third, fourth, fifth 
                FROM table_num_profiling 
                WHERE table_name='{table_name}' and user_id ={user_id}
            """)
            numerical_details = [NumericalDetail(**row) for row in cursor.fetchall()]

    
            cursor.execute(f"""
                SELECT category, value_counts, column_name, category_distribution 
                FROM table_categorical_profiling 
                WHERE table_name='{table_name}' and user_id ={user_id}
            """)
            category_details = [CategoryDetail(**row) for row in cursor.fetchall()]

            cursor.execute(f"""
                SELECT column_name, mon_yr, mon_yr_count, month, year, min_date, max_date 
                FROM table_date_profiling 
                WHERE table_name='{table_name}' and user_id ={user_id}
            """)
            date_details = [DateDetail(**row) for row in cursor.fetchall()]

        return TableProfilingResponse(
            table_meta=table_meta,
            kde_index=kde_index,
            numerical_details=numerical_details,
            category_details=category_details,
            date_details=date_details
        )
    

    except Exception as e:
      
        print(e)
        return TableProfilingResponse(
            table_meta=[], kde_index=[], numerical_details=[], category_details=[], date_details=[]
        )
