from psycopg2 import pool
from psycopg2.extras import RealDictCursor
from fastapi import Depends
from contextlib import contextmanager
from dotenv import load_dotenv
import os

load_dotenv()

db_pool=pool.ThreadedConnectionPool(
    minconn=1,
    maxconn=30,
    database=os.getenv("DB_NAME"),
    user=os.getenv("DB_USER"),
    password=os.getenv("DB_PASSWORD"),
    host=os.getenv("DB_HOST")
    )

@contextmanager
def get_cursor():
    conn=db_pool.getconn()
    try:
        cursor=conn.cursor(cursor_factory=RealDictCursor)
        yield cursor
        conn.commit()
    except:
        conn.rollback()
        raise
    finally:
        cursor.close()
        db_pool.putconn(conn)

