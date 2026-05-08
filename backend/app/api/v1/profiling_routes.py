from typing import List

from fastapi import APIRouter, Depends, Path
from pydantic import BaseModel

from app.auth.user import get_current_user_id
from app.core.db_pool import get_cursor
from app.core.postgres_utils import fetch_rows_if_table_exists
from app.schema.profile_schema import (
    CategoryDetail,
    ColumnMeta,
    DateDetail,
    MetaData,
    NumericalDetail,
)


router = APIRouter()


class TableProfilingResponse(BaseModel):
    table_meta: List[MetaData]
    kde_index: List[ColumnMeta]
    numerical_details: List[NumericalDetail]
    category_details: List[CategoryDetail]
    date_details: List[DateDetail]


def empty_profile_response():
    return TableProfilingResponse(
        table_meta=[],
        kde_index=[],
        numerical_details=[],
        category_details=[],
        date_details=[],
    )


@router.get("/profiling/{table_name}", response_model=TableProfilingResponse, tags=["Profiling"])
async def get_table_profiling(
    table_name: str = Path(..., description="Enter table name from 'master_table'"),
    user_id: int = Depends(get_current_user_id),
):
    table_name = table_name.lower()
    try:
        with get_cursor() as cursor:
            table_meta = [
                MetaData(**row)
                for row in fetch_rows_if_table_exists(
                    cursor,
                    "table_meta_data",
                    """
                    SELECT data_field, record, completeness, duplicates, numerical, categorical, date
                    FROM table_meta_data
                    WHERE table_name = %s AND user_id = %s
                    """,
                    (table_name, user_id),
                )
            ]

            kde_index = [
                ColumnMeta(**row)
                for row in fetch_rows_if_table_exists(
                    cursor,
                    "table_column_meta",
                    """
                    SELECT column_name, d_type, "Non_null_count", fill_rate, rank, unique_count, unique_rate
                    FROM table_column_meta
                    WHERE table_name = %s AND user_id = %s
                    """,
                    (table_name, user_id),
                )
            ]

            numerical_details = [
                NumericalDetail(**row)
                for row in fetch_rows_if_table_exists(
                    cursor,
                    "table_num_profiling",
                    """
                    SELECT column_name, count, min, max, percentile_05, percentile_95, percentile_25,
                        percentile_75, median, mean, std_dev, skewness, variance, first, second,
                        third, fourth, fifth
                    FROM table_num_profiling
                    WHERE table_name = %s AND user_id = %s
                    """,
                    (table_name, user_id),
                )
            ]

            category_details = [
                CategoryDetail(**row)
                for row in fetch_rows_if_table_exists(
                    cursor,
                    "table_categorical_profiling",
                    """
                    SELECT category, value_counts, column_name, category_distribution
                    FROM table_categorical_profiling
                    WHERE table_name = %s AND user_id = %s
                    """,
                    (table_name, user_id),
                )
            ]

            date_details = [
                DateDetail(**row)
                for row in fetch_rows_if_table_exists(
                    cursor,
                    "table_date_profiling",
                    """
                    SELECT column_name, mon_yr, mon_yr_count, month, year, min_date, max_date
                    FROM table_date_profiling
                    WHERE table_name = %s AND user_id = %s
                    """,
                    (table_name, user_id),
                )
            ]

        return TableProfilingResponse(
            table_meta=table_meta,
            kde_index=kde_index,
            numerical_details=numerical_details,
            category_details=category_details,
            date_details=date_details,
        )
    except Exception as exc:
        print(exc)
        return empty_profile_response()
