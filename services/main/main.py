import asyncio
from datetime import datetime
from pyspark.sql import SparkSession
from pyspark.sql.functions import col
import sys
import os
from pyspark.sql import SparkSession
from pyspark.sql import functions as F
 
from app.auth.user import get_current_user_id
from app.core.Taskmanager import TaskManager, TaskStatus
from services.connectors import mongodb_connector, rdbms_connection, csv_connection
from services.core import profiling, data_shift, kde_calculation
from services.main.config import fetch_config
from services.Destination.cred import Save
from services.main.settings import DatabaseConfig
from services.main.source_cred import DataFetcher
from services.main.TableTracker import TableTracker
import tempfile

import pandas as pd
import numpy as np

# services/main/main.py

def some_function():
    from app.api.v1.run_routes import TaskManager, TaskStatus
    


class Main:
    def __init__(self,user_id:int, data_source_type=None,task_manager:TaskManager=None,task_id:int=None,start_time=None):
        """Initializer for data processing pipeline"""
        self.user_id=user_id
        self.data_source_type = data_source_type
        self.spark = self.init_spark_session()
        self.data_source_obj = None
        self.obj = Save()
        self.db_data = None
        self.dfs = None
        self.df_dict = None
        self.base_months = 30
        self.inc_months = 30
        self.date_col = None

        self.task_manager=task_manager
        self.task_id=task_id
        self.start_time=start_time

        self.meta_data = []
        self.column_meta = []
        self.numeric_ls = []
        self.categorical_ls = []
        self.date_ls = []

        self.macroshift = []
        self.categorical_shift = []
        self.numeric_shift = []
        self.timeliness_ls = []
        self.ds_index = []

        self.num_format_ls = []
        self.cat_format_ls = []
        self.date_format_ls = []
        self.num_domain_ls = []
        self.cat_domain_ls = []
        self.date_domain_ls = []
        self.completeness_ls = []
        self.trend_ls = []
        self.overall_ls = []

        self.source=""
        self.table_name=""

    async def initialize(self):
            if self.task_manager:
                await self.task_manager.update_task(self.task_id,TaskStatus.RUNNING,"Loading Configuration",0.01)
            self.db_data = await self.load_config()
            self.source=self.db_data['text']
            self.date_col = self.db_data.get('datecol')
            
            if(self.date_col):

                if self.db_data.get('base_months') and self.db_data.get('inc_months'):
                    self.base_months = int(self.db_data['base_months'])
                    self.inc_months = int(self.db_data['inc_months'])
            
            self.dbconfig = DatabaseConfig(self.db_data)
            self.data_config = await fetch_config(self.user_id)
            # print("""*************************  initialize:
            # ****************************************************  """)
            self.data_dest_obj = self.obj.setup_db(
                self.dbconfig.dest_hostname,
                self.dbconfig.dest_port,
                self.dbconfig.dest_username,
                self.dbconfig.dest_password,
                self.dbconfig.dest_db_name,
                self.dbconfig.dest_db_schema,
                self.spark
            )
            self.table_tracker = TableTracker(self.user_id)
            self.table_tracker.create_tracker_table()

            await self._setup_data_source()



    async def _setup_data_source(self):
        """Configure data source based on type"""

        if self.task_manager:
           await self.task_manager.update_task(self.task_id,TaskStatus.RUNNING,"Data source setup complete",.02)
        if not self.data_source_type:
            print("No data source specified")
            return

        if self.data_source_type == 'RDBMS':
            self.data_source_obj = rdbms_connection.RelationalDBConnector(
                self.spark, self.db_data['text']
            )
            self.data_source_obj.setup_db(
                self.dbconfig.source_hostname,
                self.dbconfig.source_db_name,
                self.dbconfig.source_username,
                self.dbconfig.source_password
            )
        
        elif self.data_source_type == 'csv':
            self.data_source_obj = csv_connection.CSVConnector(self.spark, self.dbconfig)
            # print("""*************************  csv_connection.CSVConnector(self.spark, self.dbconfig):
            # ****************************************************  """)
        elif self.data_source_type == 'Mongodb':
            self.data_source_obj = mongodb_connector.MongoDbConnector(self.spark)
            self.data_source_obj.setup_db(
                self.dbconfig.source_username,
                self.dbconfig.source_password,
                self.dbconfig.source_hostname,
                self.dbconfig.source_port,
                self.dbconfig.source_db_name,
                self.dbconfig.source_table
            )

    async def load_config(self):
        """Load configuration data"""
        a=DataFetcher(self.user_id)
        return await a.fetch_data()

    def init_spark_session(self):
        """Initialize Spark session with optimized configuration"""
        os.environ['PYSPARK_DRIVER_PYTHON'] = sys.executable
        os.environ['PYSPARK_PYTHON'] = sys.executable

        spark= SparkSession.builder \
            .config("spark.driver.memory", "8g") \
            .config("spark.executor.memory", "8g") \
            .config("spark.sql.shuffle.partitions", "10") \
            .config("spark.memory.fraction", "0.6") \
            .config("spark.executor.cores", "1") \
            .config("spark.driver.cores", "1") \
            .config("spark.sql.legacy.allowNonEmptyLocationInCTAS", "true") \
            .config("spark.sql.windowExec.buffer.spill.threshold", "2147483647") \
            .config("spark.sql.windowExec.buffer.in.memory.threshold", "2147483647") \
            .config("spark.sql.legacy.timeParserPolicy", "LEGACY") \
            .getOrCreate()
        
        spark.sparkContext.setLogLevel("ERROR")
       
        return spark

    def get_dfs(self):
        """Retrieve dataframes from data source"""

        if self.task_manager:
            asyncio.run(self.task_manager.update_task(self.task_id, TaskStatus.RUNNING, "Fetching data",.04))

        if self.data_source_type == 'RDBMS':
            self.df_dict = {self.db_data['table_name']: self.data_source_obj.read_table(self.db_data['table_name'])}
        elif self.data_source_type == 'Mongodb':
            self.df_dict = {self.db_data['table_name']: self.data_source_obj.read_table()}
        elif self.data_source_type == 'csv':
            self.df_dict = self.data_source_obj.get_csv_data()
        else:
            raise ValueError("Unsupported data source type")


    def run(self, save=True):
        """Execute the full processing pipeline"""
        if self.task_manager:
                asyncio.run(self.task_manager.update_task(self.task_id, TaskStatus.RUNNING, "Processing data" ,0.03))
        self.get_dfs()
        flag = False
        if not self.df_dict:
            print("No data to process")
            return

        self.table_name = list(self.df_dict.keys())[0]
        for table_name, df in self.df_dict.items():
           
                date_col = self.data_config[0]['date_col']
                if self.task_manager:
                        asyncio.run(self.task_manager.update_task(self.task_id, TaskStatus.RUNNING, "PROFILING STARTED" ,.05))
                self._process_profiling(table_name, df)
                if self.task_manager:
                        asyncio.run(self.task_manager.update_task(self.task_id, TaskStatus.RUNNING, "PROFILING COMPLETED AND SHIFTING STARTED",0.16))
                if(date_col!=""):
                    flag=True
                    # if self.task_manager:
                    #         asyncio.run(self.task_manager.update_task(self.task_id, TaskStatus.RUNNING, "SHIFTING STARTED" ))
                    self._process_data_shift(table_name, df, date_col)
                    if self.task_manager:
                            asyncio.run(self.task_manager.update_task(self.task_id, TaskStatus.RUNNING, "SHIFTING COMPLETED AND KDE STARTED",.17)) 
            
                            # asyncio.run(self.task_manager.update_task(self.task_id, TaskStatus.RUNNING, "KDE STARTED" ))
                    self._process_kde(table_name, df, date_col)
                    if self.task_manager:
                            asyncio.run(self.task_manager.update_task(self.task_id, TaskStatus.RUNNING, "KDE COMPLETED",.19)) 
                    self.table_tracker.add_processed_table(table_name, 'public',self.source)    
                else:
                    self.table_tracker.add_processed_table(table_name, 'public',self.source)
                    asyncio.run(self.task_manager.update_task(self.task_id, TaskStatus.RUNNING, "Date columnn does not exist, skipping shifting and kde"))


        if save == 'System':
            self.save_files()
        elif save == 'Destination':
            if self.task_manager:
                asyncio.run(self.task_manager.update_task(self.task_id,TaskStatus.RUNNING,"Storing in db started"))
            # if(flag):
            #      self.destination_pandas()
            # else:
            #      self.destination1_pandas()

            self.destination(flag)
            if self.task_manager:
                asyncio.run(self.task_manager.update_task(self.task_id,TaskStatus.COMPLETED,"Storing in db ended"))
        else:
            print("No save operation performed")


    def _process_profiling(self, table_name, df):
        """Run profiling operations"""
        profile_obj = profiling.DescriptiveDetails(spark=self.spark)
        profile_obj.read_data(df, self.date_col)
        desc = profile_obj.run()
        desc=self._add_table_name(desc,table_name)
        # desc=self._add_table_name_pandas(desc,table_name)
        # for i in desc:
            #  print(type(i),"&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&")
        (meta_data, numeric, num_del,
         category, date) = desc

        self.meta_data.append(meta_data)
        self.column_meta.append(numeric)
        self.numeric_ls.append(num_del)
        self.categorical_ls.append(category)
        self.date_ls.append(date)
  
    def _process_data_shift(self, table_name, df, date_col):
        """Run data shift analysis"""
        datashift_obj = data_shift.DataShift(self.spark, self.base_months, self.inc_months)
        datashift_obj.set_up(df, date_col)
        
        ds_results = datashift_obj.run()
        ds_results=self._add_table_name(ds_results, table_name)

        timeliness =datashift_obj.Timeliness()
        timeliness=timeliness.withColumn('table_name',F.lit(table_name.lower()))\
                                .withColumn('user_id',F.lit(self.user_id).cast('int'))

        macroshift, cat_shift, num_shift, ds_index = ds_results
        
        self.macroshift.append(macroshift)
        self.categorical_shift.append(cat_shift)
        self.numeric_shift.append(num_shift)
        self.ds_index.append(ds_index)
        # self.timeliness_ls.append(timeliness.toPandas())       
        self.timeliness_ls.append(timeliness)       

    def _process_kde(self, table_name, df, date_col):
        """Run KDE analysis"""
        kde_obj = kde_calculation.KDECalculation(self.spark, self.base_months, self.inc_months)
        kde_obj.set_up(df, date_col)

        kde_results = kde_obj.run()
        kde_results=self._add_table_name(kde_results, table_name)
        
        (categorical_format, numerical_format, date_format,
         categorical_domain, numerical_domain, date_domain,
         comp, trend, overall) = kde_results
        
        self.num_format_ls.append(numerical_format)
        self.cat_format_ls.append(categorical_format)
        self.date_format_ls.append(date_format)
        self.num_domain_ls.append(numerical_domain)
        self.cat_domain_ls.append(categorical_domain)
        self.date_domain_ls.append(date_domain)
        self.completeness_ls.append(comp)
        self.trend_ls.append(trend)
        self.overall_ls.append(overall)

    def _add_table_name(self, dfs, table_name): 
        
        updated_dfs = []
        for df in dfs:
            updated_df = df.withColumn("table_name", F.lit(table_name.lower()))\
                                            .withColumn('user_id',F.lit(self.user_id).cast('int'))
  
            updated_dfs.append(updated_df)  

        return updated_dfs
    
    def _add_table_name_pandas(self, dfs, table_name): 
        updated_dfs = []
        for df in dfs:
            updated_df=df.toPandas()
            updated_df["table_name"]=table_name.lower()
            updated_dfs.append(updated_df)  

        return updated_dfs
 

    def destination(self,flag):
    #   PROFILING

        meta_data = self.union_and_fill_null(self.meta_data)
        column_meta = self.union_and_fill_null(self.column_meta)
        num_profile = self.union_and_fill_null(self.numeric_ls)
        categorical = self.union_and_fill_null(self.categorical_ls)
        date_prof = self.union_and_fill_null(self.date_ls)

        output_lst = [meta_data, column_meta,num_profile,categorical,date_prof ] 
        table_ls=['table_meta_data','table_column_meta','table_num_profiling','table_categorical_profiling','table_date_profiling']  

        if(flag):
            # SHIFING
            macroshift_df = self.union_and_fill_null(self.macroshift)
            categorical_shift = self.union_and_fill_null(self.categorical_shift)
            numeric_shift = self.union_and_fill_null(self.numeric_shift)
            ds_index = self.union_and_fill_null(self.ds_index)
            df_timeliness = self.union_and_fill_null(self.timeliness_ls)
            # KDE
            numerical_format = self.union_and_fill_null(self.num_format_ls)
            categorical_format = self.union_and_fill_null(self.cat_format_ls)
            date_format = self.union_and_fill_null(self.date_format_ls)
            numerical_domain = self.union_and_fill_null(self.num_domain_ls)
            categorical_domain = self.union_and_fill_null(self.cat_domain_ls)
            date_domain = self.union_and_fill_null(self.date_domain_ls)
            for column in date_domain.schema:
                if "timestamp" in str(column.dataType).lower() or "date" in str(column.dataType).lower():
                    date_domain = date_domain.withColumn(column.name, col(column.name).cast("string").substr(1, 10))

            date_domain = date_domain.withColumn("fault", col("fault").cast("string"))

            completeness = self.union_and_fill_null(self.completeness_ls)
            trend = self.union_and_fill_null(self.trend_ls)
            overall = self.union_and_fill_null(self.overall_ls)

            output_lst.extend([macroshift_df,categorical_shift,numeric_shift,ds_index,df_timeliness,numerical_format,categorical_format,date_format,numerical_domain,\
                    categorical_domain,date_domain,completeness,trend,overall])
            
            table_ls.extend(['table_macroshift','table_categorical_shift','table_numeric_shift','table_ds_index','table_timeliness'\
                    ,'kde_numerical_format','kde_categorical_format','kde_date_format','kde_numerical_domain','kde_categorical_domain','kde_date_domain','kde_completeness','kde_trend','kde_overall'])
            
    
        for var, df in enumerate(output_lst):
            table_name = table_ls[var]
            self.obj.create_table(df, table_name)
            if (self.task_manager):
                if(table_name=='table_date_profiling'):
                    asyncio.run(self.task_manager.update_task(self.task_id,TaskStatus.RUNNING,"Profiling is Ready to view",.34))
                    
                elif table_name=='table_timeliness':
                    asyncio.run(self.task_manager.update_task(self.task_id,TaskStatus.RUNNING,"Shifting is Ready to view" , .68))
    
            print("Successfully Created ",table_name)
        
        self.table_tracker.add_processing_time(self.table_name , (datetime.now()- self.start_time).total_seconds() )  
        print("files saved!")

    def union_and_fill_null(self,df_list):
        if not df_list:
            raise ValueError("The input list of DataFrames i" \
            "s empty.")
        
        # print(df_list,type(df_list))

        result_df = df_list[0]
        if(len(df_list)>1):
            for df in df_list[1:]:
                result_df = result_df.union(df)
 
        
        return result_df
    def destination_pandas(self):

        # profiling
        meta_data = pd.concat(self.meta_data)
        meta_data.replace({np.nan: None}, inplace=True)
        column_meta = pd.concat(self.column_meta)
        column_meta.replace({np.nan: None}, inplace=True)   
        num_profile = pd.concat(self.numeric_ls)
        num_profile.replace({np.nan: None}, inplace=True)
        categorical = pd.concat(self.categorical_ls)
        categorical.replace({np.nan: None}, inplace=True)
        # categorical['category']= categorical['category'].astype(str)
        date_prof = pd.concat(self.date_ls)
        date_prof.replace({np.nan: None}, inplace=True)

        #Datashift
        macroshift_df = pd.concat(self.macroshift)
        macroshift_df.replace({np.nan: None}, inplace=True)
        categorical_shift = pd.concat(self.categorical_shift)
        categorical_shift.replace({np.nan: None}, inplace=True)
        # categorical_shift['value_base'] = categorical_shift['value_base'].astype(str)
        # categorical_shift['value_inc']= categorical_shift['value_inc'].astype(str)
        numeric_shift = pd.concat(self.numeric_shift)
        numeric_shift.replace({np.nan: None}, inplace=True)
        ds_index = pd.concat(self.ds_index) 
        ds_index.replace({np.nan: None}, inplace=True)
        df_timeliness = pd.concat(self.timeliness_ls)
        df_timeliness.replace({np.nan: None}, inplace=True)
         
        
        #KDE
        numerical_format = pd.concat(self.num_format_ls)
        numerical_format.replace({np.nan: None}, inplace=True)
        categorical_format = pd.concat(self.cat_format_ls)
        categorical_format.replace({np.nan: None}, inplace=True)
        date_format = pd.concat(self.date_format_ls)
        date_format.replace({np.nan: None}, inplace=True)
        numerical_domain = pd.concat(self.num_domain_ls)
        numerical_domain.replace({np.nan: None}, inplace=True)
        categorical_domain = pd.concat(self.cat_domain_ls)
        categorical_domain.replace({np.nan: None}, inplace=True)
        date_domain = pd.concat(self.date_domain_ls)
        date_domain.replace({np.nan: None}, inplace=True)
        for i in date_domain.select_dtypes(include=['datetime64[ns]']):
            date_domain[i] = date_domain[i].dt.strftime('%m/%d/%Y')
            # print(i)
        date_domain['fault']= date_domain['fault'].astype(str)
        completeness = pd.concat(self.completeness_ls)
        completeness.replace({np.nan: None}, inplace=True)
        trend = pd.concat(self.trend_ls)
        trend.replace({np.nan: None}, inplace=True)
        overall = pd.concat(self.overall_ls)
        overall.replace({np.nan: None}, inplace=True)


        output_lst = [meta_data, column_meta,num_profile,categorical,date_prof,macroshift_df,categorical_shift,numeric_shift,ds_index,df_timeliness,numerical_format,categorical_format,date_format,numerical_domain,\
                categorical_domain,date_domain,completeness,trend,overall] 

        table_ls=['table_meta_data','table_column_meta','table_num_profiling','table_categorical_profiling','table_date_profiling','table_macroshift','table_categorical_shift','table_numeric_shift','table_ds_index','table_timeliness'\
                  ,'kde_numerical_format','kde_categorical_format','kde_date_format','kde_numerical_domain','kde_categorical_domain','kde_date_domain','kde_completeness','kde_trend','kde_overall'] 
 


        # var=0
        
        # for df in output_lst:
        #     print(df.shape)
        #     table_name = table_ls[var]
        #     obj.create_table(df,table_name)
        #     var+=1

        for var, df in enumerate(output_lst):
            # print(df.shape)
            table_name = table_ls[var]
            self.obj.create_table(df, table_name)
       
        print("files saved!")

    def destination1_pandas(self):

        meta_data = pd.concat(self.meta_data)
        meta_data.replace({np.nan: None}, inplace=True)
        column_meta = pd.concat(self.column_meta)
        column_meta.replace({np.nan: None}, inplace=True)   
        num_profile = pd.concat(self.numeric_ls)
        num_profile.replace({np.nan: None}, inplace=True)
        categorical = pd.concat(self.categorical_ls)
        categorical.replace({np.nan: None}, inplace=True)
        # categorical['category']= categorical['category'].astype(str)
        date_prof = pd.concat(self.date_ls)
        date_prof.replace({np.nan: None}, inplace=True)

        output_lst = [meta_data, column_meta,num_profile,categorical,date_prof ] 

        table_ls=['table_meta_data','table_column_meta','table_num_profiling','table_categorical_profiling','table_date_profiling']  

        # var=0
        
        # for df in output_lst:
        #     print(df.shape)
        #     table_name = table_ls[var]
        #     obj.create_table(df,table_name)
        #     var+=1

        for var, df in enumerate(output_lst):
            print(df.shape)
            table_name = table_ls[var]
            self.obj.create_table(df, table_name)
            
        print("files saved!")
    
    def close(self):
        """Cleanup resources"""
        self.obj.close()
        self.spark.stop()
 