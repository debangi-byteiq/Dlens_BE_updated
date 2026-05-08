from pyspark.sql import  DataFrame, SparkSession,Window
from pyspark.sql.types import StructType, StructField, StringType, IntegerType, DoubleType , FloatType, LongType, MapType
from pyspark.sql.types import DateType,TimestampType
from pyspark.sql import functions as F
import logging
import time

from pyspark.sql import SparkSession, DataFrame
from pyspark.sql.functions import (
    col, count, when, sum as spark_sum, lit, max as spark_max, 
    min as spark_min, datediff, to_date, countDistinct, 
    date_sub, date_add, sequence, explode
)
from pyspark.sql.types import StructType, StructField, FloatType, StringType, IntegerType, DateType, DoubleType,LongType,Row
from typing import List, Optional
from dateutil.relativedelta import relativedelta
from pyspark.sql import functions as F
from pyspark.sql.window import Window

from datetime import timedelta
from functools import reduce

class DataShift:
    def __init__(self,spark,main_w=30,inc_w=30):
        self.spark = spark
        self._df: Optional[DataFrame] = None
        self._main = None
        self.date_col: Optional[str] = None
        self.main_window_start: Optional[str] = None
        self.main_window_end: Optional[str] = None
        self.cutoff_date: Optional[str] = None
        self.comp_date = None
        self.n_window = None
        self.df_windows = []
        self.mainstream_df: Optional[DataFrame] = None
        self.incremental_df: Optional[DataFrame] = None
        self.window_main=main_w
        self.window_inc=inc_w
        self.window_strategy: str = "default"
        self.macro_shift = None
        self.num_shift = None
        self.cat_shift = None
        self.ds_index = None
        self.logger = logging.getLogger(__name__)
        logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

    def log_function_start(self, func_name: str):
        self.logger.info(f"Started {func_name}")

    def log_function_end(self, func_name: str):
        self.logger.info(f"Ended {func_name}")

    def log_function_time(self, func_name: str, start_time: float):
        end_time = time.time()
        execution_time = end_time - start_time
        self.logger.info(f"{func_name} executed in {execution_time:.2f} seconds")


    def set_up(self, df: DataFrame, date_col: str) -> None:

        start_time = time.time()
        self.log_function_start("set_up_data_shift")
        
      
        if df.schema[date_col].dataType != DateType():
            df = df.withColumn(date_col, to_date(col(date_col)))



        self._df = df
        self._main = self._df
        self.date_col = date_col
        
        # self._df = self._df.withColumn(self.date_col, to_date(col(self.date_col)))

        date_range_df = self._df.agg(
            spark_min(self.date_col).alias("oldest_date"),
            spark_max(self.date_col).alias("latest_date")
        ).collect()[0]

        df.show()
        
        self.oldest_date = date_range_df["oldest_date"]
        self.latest_date = date_range_df["latest_date"]
        print(self.oldest_date," self.oldest_date ",date_col)
        print(self.latest_date," self.latest_date ")
       
        self.set_dynamic_windows(self.window_main,self.window_inc)
        self.log_function_time("set_up_data_shift", start_time)
        self.log_function_end("set_up_data_shift")

    def set_default_windows(self) -> None:
        """
        Set windows using default strategy:
        - Main window: oldest_date to (latest_date - 30 days)
        - Incremental window: oldest_date to cutoff_date
        """
        self.window_strategy = "default"

        self.main_window_start = self.oldest_date
        self.main_window_end = date_sub(lit(self.latest_date), 30)          
        
        self.cutoff_date = self.latest_date

    def set_dynamic_windows(self, main_window, incremental_window ) -> None:

        """
        Main data and incremental data can be created using days only. 
        The incremental data can contain multiple dates.
        
        """
        self.window_strategy = "dynamic"

        # self._df = self._df.withColumn(self.date_col, F.col(self.date_col).cast(DateType()))
        # max_date = self._df.agg(F.max(self.date_col)).collect()[0][0]
        max_date = self.latest_date
        
        self.cutoff_date = max_date - relativedelta(days= incremental_window)
        self.comp_date = max_date - relativedelta(days= main_window + incremental_window)
        self._df = self._df.filter(F.col(self.date_col) >= self.comp_date)  
        
        self.mainstream_df = self._df.filter(F.col(self.date_col) < self.cutoff_date)
        self.incremental_df = self._df.filter(F.col(self.date_col) >= self.cutoff_date)
        self.main_window_end = self.cutoff_date
        self.main_window_start = self.comp_date #date_sub(lit(self.cutoff_date), main_window)

    def set_meta_date(self) -> None:
        try:
           
            self.mainstream_df = self._df.filter(
                (col(self.date_col) >= lit(self.main_window_start)) &
                (col(self.date_col) < lit(self.main_window_end))
            ).cache()

            if self.window_strategy == "default":
                 
                self.incremental_df = self._df.filter(
                    (col(self.date_col) >= lit(self.main_window_start)) &
                    (col(self.date_col) <= lit(self.cutoff_date))
                ).cache()
                print("Window Configuration (Default Strategy):")
                print(f"Main window: {self.main_window_start} to {self.main_window_end}")
                print(f"Incremental window: {self.main_window_start} to {self.cutoff_date}")
            else:
                 
                self.incremental_df = self._df.filter(
                    (col(self.date_col) >= lit(self.main_window_end)) &
                    (col(self.date_col) <= lit(self.latest_date))
                ).cache()
                print("Window Configuration (Dynamic Strategy):")
                print(f"Main window: {self.main_window_start} to {self.main_window_end}")
                print(f"Incremental window: {self.main_window_end} to {self.latest_date}")
            
                        
            print(f"Latest date in dataset: {self.latest_date}")
            
        except Exception as e:
            print(f"Error in set_meta_date: {str(e)}")
            raise

    def check_column_uniqueness(self, column_name: str, uniqueness_threshold: float = 0.90) -> bool:
        
        start_time = time.time()
        
        try:
         
            if not column_name or not isinstance(column_name, str):
                return False

            if self._df is None:
                return False
  
            try:
                total_row_count = self._df.count()
            except Exception as count_error:
                return False
            
            
            if total_row_count == 0:
                return False

            try:
                column_exists = column_name in self._df.columns
                if not column_exists:
                    return False
            except Exception as col_check_error:
                return False
            
            non_null_count = self._df.filter(F.col(column_name).isNotNull()).count()
            
            
            if non_null_count == 0:
                # self.logger.warning(f"Column {column_name} contains only null values")
                return False

            unique_count = self._df.select(column_name).distinct().count()

            unique_rate = (unique_count * 100) / total_row_count if total_row_count > 0 else 0
            
           
            if unique_count <= 5:  # Adjust threshold as needed
                # self.logger.info(f"Column {column_name} has too few unique values")
                return False
            
            is_unique = unique_rate > (uniqueness_threshold * 100)
            
            '''
            self.logger.info(
                f"Column: {column_name}, "
                f"Total Rows: {total_row_count}, "
                f"Unique Count: {unique_count}, "
                f"Unique Rate: {unique_rate:.2f}%, "
                f"Is Highly Unique: {is_unique}"
            )
            '''
            
            # self.log_function_time("check_column_uniqueness", start_time)
            # self.log_function_end("check_column_uniqueness")
            
            return is_unique
        
        except Exception as e:
            self.logger.error(f"Unexpected error in check_column_uniqueness: {e}")
            return False

    def calculate_macroshift(self) -> DataFrame:
        start_time = time.time()
        self.log_function_start("calculate_macroshift")
        def calculate_completeness(df):

            record = df.count()
            columns = df.columns
            data_field = len(columns)
            total_elements = data_field * record
            total_non_null_count = sum(df.filter(F.col(c).isNotNull()).count() for c in columns)
            completeness = (total_non_null_count / total_elements) * 100 if total_elements > 0 else 0
            completeness = round(completeness, 2)

            return completeness
    
        def estimate_df_size(df):
            df.count()   

            def convert_size_mb(size_bytes):
                """
                Converts a size in bytes to megabytes (MB).
                """
                if size_bytes == 0:
                    return 0.0  
                
                size_mb = size_bytes / (1024 ** 2)
                return size_mb

           
            catalyst_plan = df._jdf.queryExecution().logical()
            size_bytes = self.spark._jsparkSession.sessionState().executePlan(catalyst_plan, df._jdf.queryExecution().mode()).optimizedPlan().stats().sizeInBytes()


            return convert_size_mb(size_bytes)

        n_records = self.mainstream_df.count()
        completeness = calculate_completeness(self.mainstream_df)
        size = estimate_df_size(self.mainstream_df)

        inc_n_records = self.incremental_df.count()
        inc_completeness = calculate_completeness(self.incremental_df)
        inc_size = estimate_df_size(self.incremental_df)

        change_shape = ((inc_n_records - n_records) * 100) / n_records if n_records != 0 else 0
        change_completeness = ((inc_completeness - completeness) * 100) / completeness if completeness != 0 else 100
        change_size = ((inc_size - size) * 100) / size if size != 0 else 0

        macro_shift = (change_shape + change_completeness + change_size) / 3

        macro_shift_eval = macro_shift

        schema = StructType([
            StructField("characteristics", StringType(), True),
            StructField("base", DoubleType(), True),
            StructField("increment", DoubleType(), True),
            StructField("change", DoubleType(), True),
            StructField("macro_shift_eval", DoubleType(), True),
            StructField("macro_shift", DoubleType(), True)
        ])
        
        
        data = [
            ("tuple", round(float(n_records), 2), round(float(inc_n_records), 2), round(float(change_shape), 2), float(macro_shift_eval), round(float(macro_shift), 2)),
            ("size in mb", round(float(size), 2), round(float(inc_size), 2), round(float(change_size), 2), float(macro_shift_eval), round(float(macro_shift), 2)),
            ("fill_rate", round(float(completeness), 2), round(float(inc_completeness), 2), round(float(change_completeness), 3), float(macro_shift_eval), round(float(macro_shift), 2))
        ]

        self.log_function_time("calculate_macroshift", start_time)
        self.log_function_end("calculate_macroshift")

        self.macro_shift = self.spark.createDataFrame(data, schema=schema)

        return self.macro_shift

    
    def categorical_shift(self):
        
        start_time = time.time()
        self.log_function_start("categorical_shift")
        # cat_col = [f.name for f in self._df.schema.fields if isinstance(f.dataType, (StringType))]
        cat_col = [
            f.name for f in self._df.schema.fields 
            if isinstance(f.dataType, StringType) 
        ]
            # and not self.check_column_uniqueness(f.name)

       
        def format_number(value):
            if value is None:
                return None
                
            
            small_threshold = 1e-3
            large_threshold = 1e4
            
            try:
                abs_value = abs(value)
                if abs_value == 0 or (abs_value < small_threshold or abs_value > large_threshold):
                    return '{:.2E}'.format(value)
                else:
                    return '{:.2f}'.format(value)  
                    
            except Exception:
                return None

        format_number_udf = F.udf(format_number, StringType())

 
        def get_top_5_value_counts(df, column, record_counts):
            
            return (df.select(column)
                    .groupBy(column)
                    .agg(
                        F.count('*').alias('count'),
                        (F.count('*') / F.lit(record_counts)).alias('proportion')
                    )
                    .orderBy(F.desc('count'))
                    .limit(5))



       
        def compare_dfs(mainstream_counts, incremental_counts, column):
      
            mainstream_counts = mainstream_counts.select(
                F.col(column).alias('value'),
                F.col('count').alias('count_base'),
                F.col('proportion').alias('proportion_base')
            )
            incremental_counts = incremental_counts.select(
                F.col(column).alias('value'),
                F.col('count').alias('count_inc'),
                F.col('proportion').alias('proportion_inc')
            )
 
            compared = mainstream_counts.join(incremental_counts, on='value', how='full_outer')

            w_base = Window.orderBy(F.desc('count_base'))
            w_inc = Window.orderBy(F.desc('count_inc'))
            compared = compared.withColumn('rank_base', F.row_number().over(w_base))
            compared = compared.withColumn('rank_inc', F.row_number().over(w_inc))
            compared = compared.withColumn('rank_change', F.abs(F.col('rank_base') - F.col('rank_inc')))
                 
            total_base = compared.agg(F.sum('proportion_base')).first()[0] or 0
            total_inc = compared.agg(F.sum('proportion_inc')).first()[0] or 0
            diff = F.when(F.lit(total_base) != 0, (F.lit(total_inc) - F.lit(total_base)) / (F.lit(total_base) * 100.0)).otherwise(0)
  
            min_val = F.least(F.lit(5), F.lit(mainstream_counts.count()), F.lit(incremental_counts.count()))
            rank_chng = compared.agg(F.sum('rank_change')).first()[0] or 0
            cat_shift = F.when(min_val != 0, (diff + (100.0 / min_val) * F.lit(rank_chng)) / 2).otherwise(0)
            
            
            result = compared.select(
                F.lit(column).alias('column_name'),
                F.col('value'),
                F.coalesce(F.col('count_base'), F.lit(0)).alias('count_base'),
                F.round(F.coalesce(F.col('proportion_base'), F.lit(0)), 4).alias('proportion_base'),
                F.coalesce(F.col('count_inc'), F.lit(0)).alias('count_inc'),
                F.round(F.coalesce(F.col('proportion_inc'), F.lit(0)), 4).alias('proportion_inc'),
                F.round(F.when(F.coalesce(F.col('proportion_base'), F.lit(0)) != 0, 
                        (F.coalesce(F.col('proportion_inc'), F.lit(0)) - F.coalesce(F.col('proportion_base'), F.lit(0))) / 
                            F.coalesce(F.col('proportion_base'), F.lit(0)) * 100.0).otherwise(100), 2).alias('change_percent'),
                
                format_number_udf(diff).alias('total_change'),
                F.when(min_val != 0, (100.0 / min_val) * F.lit(rank_chng)).otherwise(0).alias('rank_chng'),
                                
                format_number_udf(cat_shift).alias('cat_shift')            
            )
            

            return result

      
        results = []
        for column in cat_col:
            
            # column_data = self.mainstream_df.select(column)
            
            '''
            if column_data.select(F.approx_count_distinct(column)).first()[0] == column_data.count():
                column_data.unpersist()
                continue
            '''
            mainstream_record_counts=self.mainstream_df.count()
            incremental_record_counts=self.incremental_df.count()
            mainstream_counts = get_top_5_value_counts(self.mainstream_df, column,mainstream_record_counts)
            incremental_counts = get_top_5_value_counts(self.incremental_df, column,incremental_record_counts)
            
            
            result = compare_dfs(mainstream_counts, incremental_counts, column)
            results.append(result)

      
        empty_schema = StructType([
            StructField("column_name", StringType(), True),
            StructField("value", StringType(), True),
            StructField("count_base", DoubleType(), True),
            StructField("proportion_base", DoubleType(), True),
            StructField("count_inc", DoubleType(), True),
            StructField("proportion_inc", DoubleType(), True),
            StructField("Change_percent", DoubleType(), True),
            StructField("Total_change", StringType(), True),
            StructField("Rank_chng", DoubleType(), True),
            StructField("cat_shift", StringType(), True)
        ])

     
        if results:
            output_df = reduce(lambda df1, df2: df1.unionByName(df2), results)
        else:
            output_df = self.spark.createDataFrame([], schema=empty_schema)
            
        distinct_cat_shift_df = output_df.groupBy("column_name").agg(F.first("cat_shift").alias("cat_shift"))
        average_cat_shift = distinct_cat_shift_df.agg(F.avg("cat_shift").alias("average_cat_shift")).first()["average_cat_shift"]

        final_output_df = output_df.withColumn(
            "cat_shift_index_eval", 
            F.lit(average_cat_shift)
        ).withColumn(
            "cat_shift_indexation", 
            format_number_udf(F.lit(average_cat_shift))
        )
        
        self.log_function_time("categorical_shift", start_time)
        self.log_function_end("categorical_shift")
        self.cat_shift = final_output_df
        return self.cat_shift


    def data_shift_indexation(self) -> DataFrame:
        start_time = time.time()
        self.log_function_start("data_shift_indexation")
        try:
            
            macro_shift_df = self.macro_shift
            macro_shift_value = macro_shift_df.select('macro_shift').first()[0] if  macro_shift_df and (not macro_shift_df.isEmpty()) else 0

            numerical_shift_df = self.num_shift
            numerical_shift_eval = numerical_shift_df.select('numerical_shift_eval').first()[0] if numerical_shift_df and (not numerical_shift_df.isEmpty()) else 0

            categorical_shift_df = self.cat_shift   

            cat_shift_index_eval = float(categorical_shift_df.select('cat_shift_index_eval').first()[0]) if categorical_shift_df and (not categorical_shift_df.isEmpty()) else 0

            micro_shift = (numerical_shift_eval + cat_shift_index_eval) / 2

            shift_indexation = (macro_shift_value + micro_shift) / 2

            latest_date = self._df.agg(F.max(self.date_col)).collect()[0][0]
            year_month = latest_date.strftime('%Y-%m')
            full_date = latest_date.strftime('%Y-%m-%d')
            
            
            schema = StructType([
                StructField("year_month", StringType(), True),
                StructField("full_date", StringType(), True),
                StructField("macro_shift", DoubleType(), True),
                StructField("micro_shift", DoubleType(), True),
                StructField("shift_indexation", DoubleType(), True)
            ])

            data = [(
                year_month,
                full_date, 
                float(macro_shift_value), 
                float(micro_shift), 
                float(shift_indexation)
            )]

            result_df = self.spark.createDataFrame(data, schema=schema)

            
            for column in ['macro_shift', 'micro_shift', 'shift_indexation']:
                result_df = result_df.withColumn(column, F.round(F.col(column), 2))

            self.log_function_time("data_shift_indexation", start_time)
            self.log_function_end("data_shift_indexation")
            self.ds_index = result_df
            return self.ds_index

        except Exception as e:
            print(f"Error in data_shift_indexation: {str(e)}")
            raise
    
    


    def numerical_shift(self) -> DataFrame:
        start_time = time.time()
        self.log_function_start("numerical_shift")
        
        if self.mainstream_df is None or self.incremental_df is None:
            raise AttributeError("Either mainstream_df or incremental_df is not initialized. Ensure both are loaded as DataFrames.")
        
        # numeric_columns = [f.name for f in self._df.schema.fields if isinstance(f.dataType, (IntegerType, FloatType, DoubleType, LongType))]
        numeric_columns = [
            f.name for f in self._df.schema.fields 
            if isinstance(f.dataType, (IntegerType, FloatType, DoubleType, LongType)) 
        ]
            # and not self.check_column_uniqueness(f.name)
        # print(numeric_columns,"*************************************************************")
        if not numeric_columns:
            schema = StructType([
                StructField("column_name", StringType(), True),
                StructField("mean_base", DoubleType(), True),
                StructField("mean_inc", DoubleType(), True),
                StructField("mean_shift", DoubleType(), True),
                StructField("median_base", DoubleType(), True),
                StructField("median_inc", DoubleType(), True),
                StructField("median_shift", DoubleType(), True),
                StructField("std_base", DoubleType(), True),
                StructField("std_inc", DoubleType(), True),
                StructField("std_shift", DoubleType(), True),
                StructField("min_base", DoubleType(), True),
                StructField("min_inc", DoubleType(), True),
                StructField("min_shift", DoubleType(), True),
                StructField("max_base", DoubleType(), True),
                StructField("max_inc", DoubleType(), True),
                StructField("max_shift", DoubleType(), True),
                StructField("numeric_shift", DoubleType(), True)
            ])
            return self.spark.createDataFrame([], schema)
            

        def calc_percent_change(new_value, old_value):
            return when((old_value != 0) & (old_value.isNotNull()) & (new_value.isNotNull()),
                        (new_value - old_value) * 100 / old_value
                    ).otherwise(
                        when((old_value == 0) & (new_value == 0), lit(0))
                        .otherwise(lit(100))
                    )

        base_stats = self.mainstream_df.select(
            lit("base").alias("dataset_type"),
            *[F.mean(col(column)).alias(f"mean_{column}") for column in numeric_columns],
            *[F.expr(f"percentile_approx(`{column}`, 0.5)").alias(f"median_{column}") for column in numeric_columns],
            *[F.stddev(col(column)).alias(f"std_{column}") for column in numeric_columns],
            *[F.min(col(column)).alias(f"min_{column}") for column in numeric_columns],
            *[F.max(col(column)).alias(f"max_{column}") for column in numeric_columns]
        )

        
        incremental_stats = self.incremental_df.select(
            lit("incremental").alias("dataset_type"),
            *[F.mean(col(column)).alias(f"mean_{column}") for column in numeric_columns],
            *[F.expr(f"percentile_approx(`{column}`, 0.5)").alias(f"median_{column}") for column in numeric_columns],
            *[F.stddev(col(column)).alias(f"std_{column}") for column in numeric_columns],
            *[F.min(col(column)).alias(f"min_{column}") for column in numeric_columns],
            *[F.max(col(column)).alias(f"max_{column}") for column in numeric_columns]
        )

       
        all_stats = base_stats.union(incremental_stats)

       
        result = all_stats.groupBy().pivot("dataset_type").agg(
            *[F.first(f"mean_{column}").alias(f"mean_{column}") for column in numeric_columns],
            *[F.first(f"median_{column}").alias(f"median_{column}") for column in numeric_columns],
            *[F.first(f"std_{column}").alias(f"std_{column}") for column in numeric_columns],
            *[F.first(f"min_{column}").alias(f"min_{column}") for column in numeric_columns],
            *[F.first(f"max_{column}").alias(f"max_{column}") for column in numeric_columns]
        )

         
        for column in numeric_columns:
     
            result = result.withColumn(f"mean_shift_{column}", calc_percent_change(col(f"incremental_mean_{column}"), col(f"base_mean_{column}")))
            result = result.withColumn(f"median_shift_{column}", calc_percent_change(col(f"incremental_median_{column}"), col(f"base_median_{column}")))
            result = result.withColumn(f"std_shift_{column}", calc_percent_change(col(f"incremental_std_{column}"), col(f"base_std_{column}")))
            result = result.withColumn(f"min_shift_{column}", calc_percent_change(col(f"incremental_min_{column}"), col(f"base_min_{column}")))
            result = result.withColumn(f"max_shift_{column}", calc_percent_change(col(f"incremental_max_{column}"), col(f"base_max_{column}")))

             
            result = result.withColumn(f"numeric_shift_{column}", 
                (col(f"mean_shift_{column}") + col(f"median_shift_{column}") + col(f"std_shift_{column}") +
                col(f"min_shift_{column}") + col(f"max_shift_{column}")) / 5)

        
        unpivoted = result.select(
            F.explode(
                F.array([
                    F.struct(
                        F.lit(column).alias("column_name"),
                        F.round(F.col(f"base_mean_{column}"), 3).alias("mean_base"),
                        F.round(F.col(f"incremental_mean_{column}"), 3).alias("mean_inc"),
                        F.round(F.col(f"mean_shift_{column}"), 3).alias("mean_shift"),
                        F.round(F.col(f"base_median_{column}"), 3).alias("median_base"),
                        F.round(F.col(f"incremental_median_{column}"), 3).alias("median_inc"),
                        F.round(F.col(f"median_shift_{column}"), 3).alias("median_shift"),
                        F.round(F.col(f"base_std_{column}"), 3).alias("std_base"),
                        F.round(F.col(f"incremental_std_{column}"), 3).alias("std_inc"),
                        F.round(F.col(f"std_shift_{column}"), 3).alias("std_shift"),
                        F.round(F.col(f"base_min_{column}"), 3).alias("min_base"),
                        F.round(F.col(f"incremental_min_{column}"), 3).alias("min_inc"),
                        F.round(F.col(f"min_shift_{column}"), 3).alias("min_shift"),
                        F.round(F.col(f"base_max_{column}"), 3).alias("max_base"),
                        F.round(F.col(f"incremental_max_{column}"), 3).alias("max_inc"),
                        F.round(F.col(f"max_shift_{column}"), 3).alias("max_shift"),
                        F.round(F.col(f"numeric_shift_{column}"), 3).alias("numeric_shift")
                    ) for column in numeric_columns
                ])
            ).alias("unpivoted")
        ).select("unpivoted.*")

       
        avg_numeric_shift = unpivoted.agg(
            F.mean("numeric_shift").alias("numerical_shift_index")
        ).collect()[0]["numerical_shift_index"]

        
        unpivoted = unpivoted \
            .withColumn("numerical_shift_eval", F.lit(avg_numeric_shift)) \
            .withColumn("numerical_shift_index", F.round(F.lit(avg_numeric_shift), 3))
        
        self.log_function_time("numerical_shift", start_time)
        self.log_function_end("numerical_shift")

        self.num_shift = unpivoted

        return self.num_shift


    def run(self):
        self.set_meta_date()
        macroshift = self.calculate_macroshift()
        categorical_shift = self.categorical_shift()
        numeric_shift = self.numerical_shift()

        data_shift_indexation = self.data_shift_indexation()
        self.mainstream_df.unpersist()
        self.incremental_df.unpersist()
        return macroshift, categorical_shift, numeric_shift, data_shift_indexation

    def Timeliness(self):
        start_time = time.time()
        self.log_function_start("Timeliness")
        new_df = self._main
                  
        timeliness_ls = []
        date = new_df.agg(F.max(self.date_col)).collect()[0][0]   
        run_count = 1   

        try:
            cutoff_date = date
            filtered_df = new_df.filter(F.col(self.date_col) <= cutoff_date)

            
            obj = DataShift(self.spark)
            obj.set_up(filtered_df, self.date_col)
            obj.set_meta_date()
            inc_df = obj.incremental_df
            base_df = obj.mainstream_df

           
            if base_df.isEmpty() and not inc_df.isEmpty():
                shift = 100
            else:
                print("______________Successful_________")
                
                '''
                macro_res, cat_res, num_res, _ = obj.run()  # Ignore the fourth DataFrame

                # Safe fetching of values, defaults to 0 if DataFrame is empty
                macro_shift = macro_res.select('macro_shift_eval').first()[0] if not macro_res.isEmpty() else 0
                cat_shift = cat_res.select('cat_shift_index_eval').first()[0] if not cat_res.isEmpty() else 0
                num_shift = num_res.select('numerical_shift_eval').first()[0] if not num_res.isEmpty() else 0

                # Calculate the average shift from the values obtained
                shift = (((num_shift + cat_shift) / 2) + macro_shift) / 2

                # Round the shift value to two decimal places
                shift = round(shift, 2)
                '''
                # _, _, _, shift_res = obj.run()  
                shift_res = self.ds_index
                shift = shift_res.select('shift_indexation').first()[0] if not shift_res.isEmpty() else 0

            ls = Row(date=cutoff_date, shift=shift, run_count=run_count)
            timeliness_ls.append(ls)

        except Exception as e:
             
            print(f"_______________Exception occurred for date {cutoff_date}: {e}_____________")
            ls = Row(date=cutoff_date, shift=0, run_count=run_count)
            timeliness_ls.append(ls)

       
        res = self.spark.createDataFrame(timeliness_ls)

        self.log_function_time("Timeliness", start_time)
        self.log_function_end("Timeliness")
        return res