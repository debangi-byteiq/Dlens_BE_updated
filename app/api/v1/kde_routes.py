from fastapi import APIRouter, Depends, Path
from app.auth.user import get_current_user_id
# from app.core.postgres_db import cursor
from app.core.db_pool import get_cursor 
from typing import List
from pydantic import BaseModel
from app.schema.kde_schema import (
    KDENumericalFormat,
    KDECategoricalDomain,
    KDECategoricalFormat,
    KDECompleteness,
    KDEDateDomain,
    KDEDateFormat,
    KDENumericalDomain,
    KDEOverall,
    KDETrend,
)

router = APIRouter()

class KDEResponse(BaseModel):
    overall: List[KDEOverall]
    completeness: List[KDECompleteness]
    trend: List[KDETrend]
    numerical_format: List[KDENumericalFormat]
    categorical_format: List[KDECategoricalFormat]
    date_format: List[KDEDateFormat]
    numerical_domain: List[KDENumericalDomain]
    categorical_domain: List[KDECategoricalDomain]
    date_domain: List[dict]  

@router.get('/kde/{table_name}', response_model=KDEResponse)
async def get_kde_all(table_name: str = Path(..., description="Enter table name from 'master_table'"),user_id:int=Depends(get_current_user_id)):
    try:
        table_name = table_name.lower()

        with get_cursor() as cursor:

            query_overall = f"SELECT * FROM kde_overall WHERE table_name='{table_name}' and user_id ={user_id}"
            cursor.execute(query_overall)
            overall_data = [KDEOverall(**row) for row in cursor.fetchall()]

            
            query_completeness = f"SELECT * FROM kde_completeness WHERE table_name='{table_name}' and user_id ={user_id}"
            cursor.execute(query_completeness)
            completeness_data = [KDECompleteness(**row) for row in cursor.fetchall()]

            
            query_trend = f"SELECT * FROM kde_trend WHERE table_name='{table_name}' and user_id ={user_id}"
            cursor.execute(query_trend)
            trend_data = [KDETrend(**row) for row in cursor.fetchall()]

        
            query_num_format = f"SELECT * FROM kde_numerical_format WHERE table_name='{table_name}' and user_id ={user_id}"
            cursor.execute(query_num_format)
            numerical_format_data = [KDENumericalFormat(**row) for row in cursor.fetchall()]

            
            query_cat_format = f"SELECT * FROM kde_categorical_format WHERE table_name='{table_name}' and user_id ={user_id}"
            cursor.execute(query_cat_format)
            categorical_format_data = [KDECategoricalFormat(**row) for row in cursor.fetchall()]

            
            query_date_format = f"SELECT * FROM kde_date_format WHERE table_name='{table_name}' and user_id ={user_id}"
            cursor.execute(query_date_format)
            date_format_data = [KDEDateFormat(**row) for row in cursor.fetchall()]

            
            query_num_domain = f"SELECT * FROM kde_numerical_domain WHERE table_name='{table_name}' and user_id ={user_id}"
            cursor.execute(query_num_domain)
            numerical_domain_data = [KDENumericalDomain(**row) for row in cursor.fetchall()]

        
            query_cat_domain = f"SELECT * FROM kde_categorical_domain WHERE table_name='{table_name}' and user_id ={user_id}"
            cursor.execute(query_cat_domain)
            categorical_domain_data = [KDECategoricalDomain(**row) for row in cursor.fetchall()]

            
            query_date_domain = f"SELECT * FROM kde_date_domain WHERE table_name='{table_name}' and user_id ={user_id}"
            cursor.execute(query_date_domain)
            date_domain_raw = cursor.fetchall()
        
        date_domain_dict = {}
        for row in date_domain_raw:
            key = (
                row['column_name'], row['growing'], row['increment_min'], 
                row['increment_max'], row['base_min'], row['base_max'], 
                row['score'], row['table_name']
            )
            if key not in date_domain_dict:
                date_domain_dict[key] = {
                    'column_name': row['column_name'],
                    'growing': row['growing'],
                    'increment_min': row['increment_min'],
                    'increment_max': row['increment_max'],
                    'base_min': row['base_min'],
                    'base_max': row['base_max'],
                    'score': row['score'],
                    'table_name': row['table_name'],
                    'fault': []
                }
            date_domain_dict[key]['fault'].append(row['fault'])
        date_domain_data = list(date_domain_dict.values())

        
        return KDEResponse(
            overall=overall_data,
            completeness=completeness_data,
            trend=trend_data,
            numerical_format=numerical_format_data,
            categorical_format=categorical_format_data,
            date_format=date_format_data,
            numerical_domain=numerical_domain_data,
            categorical_domain=categorical_domain_data,
            date_domain=date_domain_data
        )

    except Exception as e:
        print(e)
        return KDEResponse(
            overall=[],
            completeness=[],
            trend=[],
            numerical_format=[],
            categorical_format=[],
            date_format=[],
            numerical_domain=[],
            categorical_domain=[],
            date_domain=[]
        )
