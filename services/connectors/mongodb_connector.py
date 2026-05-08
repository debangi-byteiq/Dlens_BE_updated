from pyspark.sql import SparkSession


class MongoDbConnector():
    def __init__(self,spark:SparkSession):
        self.spark=spark
        self.url=""

    def setup_db(self,username,password,host,port,db_name,table_name):
        self.url=f"mongodb://{username}:{password}@{host}:{port}/{db_name}.{table_name}?authSource=admin"
        # print(self.url)
    
    def read_table(self):
        df=self.spark.read.format('com.mongodb.spark.sql.DefaultSource')\
            .option('uri',self.url)\
            .load()
        df=df.drop('_id')
        # print(df.show(),"Dataframe")
        return df
    

