import os

from app.config import settings

class CSVConnector():
    def __init__(self,spark,obj):
        self.csv_obj=obj
        self.spark=spark
        self.filename=self.csv_obj.filename
        self.datecol=self.csv_obj.datecol
        self.base_months=self.csv_obj.base_months
        self.inc_months=self.csv_obj.inc_months
        self.path=os.path.join(settings.upload_directory_path,self.filename)
    def get_csv_data(self):
        df = self.spark.read.csv(self.path, header=True, inferSchema=True)
        # df.show()
        # df.printSchema()
        return {self.filename.split('.')[0].lower():df}
    

        

