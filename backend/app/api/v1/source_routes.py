from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException

from app.auth.user import get_current_user_id
from app.core.db_pool import get_cursor
from app.core.db_utils import check_conn_mysql, check_conn_postgres
from app.core.mongo_db import source_collection
from app.schema.schema import Source


router = APIRouter()


def format_time_taken(seconds):
    try:
        td = timedelta(seconds=float(seconds or 0))
        total_seconds = int(td.total_seconds())
        hours, remainder = divmod(total_seconds, 3600)
        minutes, seconds = divmod(remainder, 60)
        if hours > 0:
            return f"{hours} hours, {minutes} minutes, {seconds} seconds"
        return f"{minutes} minutes, {seconds} seconds"
    except (TypeError, ValueError):
        return "Invalid time"


@router.get("/master_table")
async def get_all_tables(user_id: int = Depends(get_current_user_id)):
    try:
        with get_cursor() as cursor:
            cursor.execute(
                """
                SELECT table_name, schema_name, processed_date, is_active, source, time_taken
                FROM processed_tables_tracker
                WHERE user_id = %s
                ORDER BY processed_date DESC;
                """,
                (user_id,),
            )
            rows = cursor.fetchall()

        master_df = []
        for row in rows:
            row = dict(row)
            row["time_taken"] = format_time_taken(row.get("time_taken"))

            processed_date = row.get("processed_date")
            row["processed_date"] = (
                processed_date.strftime("%B %d, %Y at %I:%M %p")
                if isinstance(processed_date, datetime)
                else "Invalid Date"
            )
            master_df.append(row)

        return master_df
    except Exception as exc:
        print(exc)
        return []


@router.post("/save_source")
async def save_details(source: Source, user_id: int = Depends(get_current_user_id)):
    try:
        if not source.details:
            raise HTTPException(status_code=400, detail="Empty data sent, please check again")

        source_dict = source.model_dump()
        source_dict["refreshed_date"] = datetime.now()

        details = source_dict["details"]
        details["user_id"] = user_id
        db_type = details["text"]
        date_col = details.get("datecol", "")

        if db_type == "Postgres":
            check = check_conn_postgres(
                details["hostname"],
                details["dbname"],
                details["username"],
                details["password"],
                details["table_name"],
                date_col,
            )
        elif db_type == "MySQL":
            check = check_conn_mysql(
                details["hostname"],
                details["dbname"],
                details["username"],
                details["password"],
                details["table_name"],
                date_col,
            )
        else:
            raise HTTPException(status_code=400, detail=f"Unsupported database type: {db_type}")

        if not check:
            raise HTTPException(status_code=400, detail=f"This {date_col} column does not exist")

        result = await source_collection.insert_one(source_dict)
        return {
            "message": "Data Saved Successfully",
            "id": str(result.inserted_id),
        }

    except HTTPException:
        raise
    except Exception as exc:
        print(exc)
        raise HTTPException(status_code=400, detail=f"Error occurred while saving data: {exc}")
