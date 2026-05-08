from psycopg2 import pool
from psycopg2.extras import RealDictCursor
from contextlib import contextmanager

from app.config import settings

db_pool = None


def get_db_pool():
    global db_pool

    if db_pool is None:
        db_pool = pool.ThreadedConnectionPool(
            minconn=1,
            maxconn=30,
            database=settings.DB_NAME,
            user=settings.DB_USER,
            password=settings.DB_PASSWORD,
            host=settings.DB_HOST,
            port=settings.DB_PORT,
        )

    return db_pool

@contextmanager
def get_cursor():
    active_pool = get_db_pool()
    conn = active_pool.getconn()
    cursor = None
    try:
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        yield cursor
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        if cursor:
            cursor.close()
        active_pool.putconn(conn)

