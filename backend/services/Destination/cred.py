import pandas as pd

class Save:
    def __init__(self) -> None: 
        self.host=None
        self.port=None
        self.user=None
        self.password=None
        self.database=None
        self.schema_name = None
        # self.conn = None
        # self.cur = None
    def setup_db(self,host,port,user,password,database,schema,spark):
        self.spark=spark
        self.host = host
        self.port = port
        self.user = user
        self.password = password
        self.database = database
        self.schema_name = schema
        self.jdbc_url=f"jdbc:postgresql://{self.host}:{self.port}/{self.database}"
        # self.jdbc_url="jdbc:postgresql://localhost:5432/destinationtest"
        self.connection_properties={
             "user":self.user,
             "password":self.password,
             "driver":"org.postgresql.Driver"
        }

    def create_table(self,df,tb_name):

        table_name = tb_name
        print(f"{table_name} table creation Started")
    
        print(f"{table_name} Insertion Start")
        df.write.jdbc(url=self.jdbc_url,table=f'{self.schema_name}.{table_name}',mode='append',properties=self.connection_properties)
   
        # list_col=[i.name for i in df.schema]
        # insert_query = f"INSERT INTO {self.schema_name}.{table_name} ({','.join(list_col)}) VALUES ({','.join(['%s']*len(df.columns))})"
        
        # insert_query = f"INSERT INTO {self.schema_name}.{table_name} ({','.join(df.columns.to_list())}) VALUES ({','.join(['%s']*len(df.columns))})"
        # self.cur.executemany(insert_query, values)
        print(f"{table_name} Intertion complete")
        print("=====================")
 
        # self.conn.commit()
        print(f"{table_name} Push complete")
        print("===================")


    def close(self):
            self.conn.commit()
      