from pyspark.sql import SparkSession
from services.main.settings import DatabaseConfig

class RelationalDBConnector:
        def __init__(self, spark: SparkSession,db_type):
            self.spark = spark
            self.jdbc_url = None
            self.connection_properties = None
            self.db_type=db_type

        def setup_db(self, host: str, db_name: str, uid: str, pwd: str, port: int = 5432):
            """
            Sets up the JDBC connection URL and connection properties for PostgreSQL and mysql.
            """

            if self.db_type=="Postgres":
                self.jdbc_url = f"jdbc:postgresql://{host}:{port}/{db_name}"
                driver="org.postgresql.Driver"
            else:   
                self.jdbc_url = f"jdbc:mysql://{host}:3306/{db_name}"
                driver="com.mysql.cj.jdbc.Driver"

            self.connection_properties = {
                "user": uid,
                "password": pwd,
                "driver": driver
            }
            # print(self.connection_properties)
            print(f"Database connection URL: {self.jdbc_url}")
            print("Database connection properties set.")

        def return_table_list(self):
            """
            Retrieves the list of tables from the database using JDBC.
            """
            if self.db_type=="Postgres":
               table_name='public'
               ks='table_name'  
            else:   
                table_name=self.jdbc_url.split("/")[-1]
                ks='TABLE_NAME'
                
            query = f"(SELECT table_name FROM information_schema.tables WHERE table_schema='{table_name}') AS table_list"
            tables_df = self.spark.read.jdbc(url=self.jdbc_url, table=query, properties=self.connection_properties)
 
            # print(tables_df.show(),"******************")
            tables = [row[ks] for row in tables_df.collect()]
            return tables
        
        def read_table(self, table_name: str) :
                query = f"SELECT * FROM {table_name}"
                
                df = self.spark.read.jdbc(
                    url=self.jdbc_url,
                    table=f"({query}) AS {table_name}",  
                    properties=self.connection_properties
                )

                return df

        def close_connection(self):
            """
            Since we are using JDBC, there is no persistent connection to close, 
            as Spark handles connection pooling and management for JDBC automatically.
            """
            print("JDBC connection does not need to be manually closed.")
