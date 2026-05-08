import mysql.connector
import psycopg2
import os
from psycopg2.extras import RealDictCursor

def check_conn_postgres(host,db_name,db_user,db_pass,table_name,date_col):
    
    try:
        conn = psycopg2.connect(host=host, database=db_name, user=db_user, password=db_pass,cursor_factory=RealDictCursor)
        cursor = conn.cursor()
    
        if(date_col):
            cursor.execute(f"select 1 from {table_name} where {date_col}='2023-05-07' limit 1")
        else:
            cursor.execute(f"select 1 from {table_name} limit 1")

        print("Database connection was successful for postgres source")
        return True
    except Exception as e:
        print("Database connection failed postgres source")
        print("Error:", e)
        conn.rollback()
        return False
       
    finally :

        if cursor:
            cursor.close()
        if conn:
            conn.close()


def check_conn_mysql(host,db_name,db_user,db_pass,table_name,date_col):
    try:
        mydb = mysql.connector.connect(
        host=host,
        user=db_user,
        database=db_name,
        password=db_pass
        )
        cursor = mydb.cursor()
        if(date_col):
            cursor.execute(f"select 1 from {table_name} where {date_col}='2023-05-07' limit 1")
        else:
            cursor.execute(f"select 1 from {table_name} limit 1")

        print("Database connection was successful mysql source")
    
        return True
 
    except Exception as e:
        print("Database connection failed mysql source")
        print("Error:", e)
        return False
    # finally :
    #     if cursor:
    #         cursor.close()
    #     if mydb:
    #         mydb.close()


# check_conn_mysql('localhost','source_db','root','root','customer','registration_date')
