from fastapi import APIRouter, Depends, Path
from app.auth.user import get_current_user_id
# from app.core.postgres_db import cursor
from app.core.db_pool import get_cursor 
from app.core.postgres_utils import fetch_rows_if_table_exists
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


def empty_kde_response():
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

            query_overall = "SELECT * FROM kde_overall WHERE table_name=%s and user_id=%s"
            overall_data = [
                KDEOverall(**row)
                for row in fetch_rows_if_table_exists(cursor, "kde_overall", query_overall, (table_name, user_id))
            ]

            
            query_completeness = "SELECT * FROM kde_completeness WHERE table_name=%s and user_id=%s"
            completeness_data = [
                KDECompleteness(**row)
                for row in fetch_rows_if_table_exists(cursor, "kde_completeness", query_completeness, (table_name, user_id))
            ]

            
            query_trend = "SELECT * FROM kde_trend WHERE table_name=%s and user_id=%s"
            trend_data = [
                KDETrend(**row)
                for row in fetch_rows_if_table_exists(cursor, "kde_trend", query_trend, (table_name, user_id))
            ]

        
            query_num_format = "SELECT * FROM kde_numerical_format WHERE table_name=%s and user_id=%s"
            numerical_format_data = [
                KDENumericalFormat(**row)
                for row in fetch_rows_if_table_exists(cursor, "kde_numerical_format", query_num_format, (table_name, user_id))
            ]

            
            query_cat_format = "SELECT * FROM kde_categorical_format WHERE table_name=%s and user_id=%s"
            categorical_format_data = [
                KDECategoricalFormat(**row)
                for row in fetch_rows_if_table_exists(cursor, "kde_categorical_format", query_cat_format, (table_name, user_id))
            ]

            
            query_date_format = "SELECT * FROM kde_date_format WHERE table_name=%s and user_id=%s"
            date_format_data = [
                KDEDateFormat(**row)
                for row in fetch_rows_if_table_exists(cursor, "kde_date_format", query_date_format, (table_name, user_id))
            ]

            
            query_num_domain = "SELECT * FROM kde_numerical_domain WHERE table_name=%s and user_id=%s"
            numerical_domain_data = [
                KDENumericalDomain(**row)
                for row in fetch_rows_if_table_exists(cursor, "kde_numerical_domain", query_num_domain, (table_name, user_id))
            ]

        
            query_cat_domain = "SELECT * FROM kde_categorical_domain WHERE table_name=%s and user_id=%s"
            categorical_domain_data = [
                KDECategoricalDomain(**row)
                for row in fetch_rows_if_table_exists(cursor, "kde_categorical_domain", query_cat_domain, (table_name, user_id))
            ]

            
            query_date_domain = "SELECT * FROM kde_date_domain WHERE table_name=%s and user_id=%s"
            date_domain_raw = fetch_rows_if_table_exists(cursor, "kde_date_domain", query_date_domain, (table_name, user_id))
        
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
        return empty_kde_response()
