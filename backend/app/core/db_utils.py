import re
from contextlib import closing

import mysql.connector
import psycopg2
from psycopg2 import sql
from psycopg2.extras import RealDictCursor


IDENTIFIER_PATTERN = re.compile(r"^[A-Za-z_][A-Za-z0-9_]*$")


def validate_identifier(identifier, label):
    if not identifier or not IDENTIFIER_PATTERN.match(identifier):
        raise ValueError(f"Invalid {label}: {identifier}")
    return identifier


def postgres_identifier(name):
    return sql.Identifier(validate_identifier(name, "identifier"))


def mysql_identifier(name):
    return f"`{validate_identifier(name, 'identifier')}`"


def check_conn_postgres(host, db_name, db_user, db_pass, table_name, date_col):
    conn = None
    try:
        query = sql.SQL("SELECT 1 FROM {} LIMIT 1").format(postgres_identifier(table_name))
        if date_col:
            query = sql.SQL("SELECT 1 FROM {} WHERE {} IS NOT NULL LIMIT 1").format(
                postgres_identifier(table_name),
                postgres_identifier(date_col),
            )

        conn = psycopg2.connect(
            host=host,
            database=db_name,
            user=db_user,
            password=db_pass,
            cursor_factory=RealDictCursor,
        )
        with closing(conn.cursor()) as cursor:
            cursor.execute(query)
        return True
    except Exception as exc:
        print("Database connection failed for postgres source")
        print("Error:", exc)
        if conn:
            conn.rollback()
        return False
    finally:
        if conn:
            conn.close()


def check_conn_mysql(host, db_name, db_user, db_pass, table_name, date_col):
    conn = None
    try:
        table_identifier = mysql_identifier(table_name)
        query = f"SELECT 1 FROM {table_identifier} LIMIT 1"
        if date_col:
            query = f"SELECT 1 FROM {table_identifier} WHERE {mysql_identifier(date_col)} IS NOT NULL LIMIT 1"

        conn = mysql.connector.connect(
            host=host,
            user=db_user,
            database=db_name,
            password=db_pass,
        )
        with closing(conn.cursor()) as cursor:
            cursor.execute(query)
        return True
    except Exception as exc:
        print("Database connection failed for mysql source")
        print("Error:", exc)
        return False
    finally:
        if conn:
            conn.close()
