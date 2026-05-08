from pyspark.sql import SparkSession
from pyspark.sql.functions import col, year, month, dayofmonth, split, regexp_replace, length, when, max as spark_max, count
from pyspark.sql.types import StringType, TimestampType, DateType, IntegerType
from pyspark.sql import  DataFrame, SparkSession,Window
from pyspark.sql.types import StructType, StructField, StringType, IntegerType, DoubleType , FloatType, LongType, MapType
from pyspark.sql.types import DateType,TimestampType,TimestampNTZType
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


class FormatCheck:
    def __init__(self,spark):
        self.spark=spark

    def check(self, series_df, col_name):
        """Determine if the column represents Year, Month, or Day."""
        # Check for non-null max value
        max_val = series_df.select(spark_max(col(col_name)).alias("max_value")).collect()[0]["max_value"]
        if max_val is None:
            return 'Empty'

        # Check unique values
        unique_vals = series_df.select(col(col_name)).distinct().rdd.flatMap(lambda x: x).collect()

        if len(str(max_val)) == 4:
            return 'Year'
        elif any(val > 12 for val in unique_vals if val is not None):
            return 'Day'
        else:
            return 'Month'

    def double_check(self, series1_df, series2_df, series3_df, col_names):
        """Resolve conflicts between formats."""
        dfs = [series1_df, series2_df, series3_df]
        result_list = []
        freq_list = []

        for i, df in enumerate(dfs):
            max_val = df.select(spark_max(col(col_names[i])).alias("max_value")).collect()[0]["max_value"]
            if max_val is None or len(str(max_val)) == 4:
                result_list.append('Year')
                freq_list.append(None)
            else:
                freq = df.groupBy(col(col_names[i])).count().orderBy(col("count").desc()).first()["count"]
                result_list.append(freq)
                freq_list.append(freq)

        # Resolve conflicts
        indices = [i for i, val in enumerate(result_list) if type(val) != str]
        if len(indices) == 2:
            v1, v2 = indices[0], indices[1]
            if freq_list[v1] > freq_list[v2]:
                result_list[v1] = 'Month'
                result_list[v2] = 'Day'
            else:
                result_list[v1] = 'Day'
                result_list[v2] = 'Month'

        return f"{result_list[0]}-{result_list[1]}-{result_list[2]}"

    def format_check(self, series_df, col_name):
        """Main method to identify date format."""
        try:
            # Get column type
            col_type = [f.dataType for f in series_df.schema.fields if f.name == col_name][0]

            if isinstance(col_type, (TimestampType, DateType)):
                # Extract Year, Month, Day components
                series_df = series_df.withColumn("year_col", year(col(col_name))) \
                                     .withColumn("month_col", month(col(col_name))) \
                                     .withColumn("day_col", dayofmonth(col(col_name)))
            elif isinstance(col_type, StringType):
                # Replace separators and split
                separators = r'[^\w]+'
                series_df = series_df.withColumn(col_name, regexp_replace(col(col_name), separators, "-"))
                series_df = series_df.withColumn("year_col", split(col(col_name), "-")[0].cast(IntegerType())) \
                                     .withColumn("month_col", split(col(col_name), "-")[1].cast(IntegerType())) \
                                     .withColumn("day_col", split(col(col_name), "-")[2].cast(IntegerType()))
            else:
                return 'Empty'

            # Check each column
            check1 = self.check(series_df, "year_col")
            check2 = self.check(series_df, "month_col")
            check3 = self.check(series_df, "day_col")

            # Handle conflicts
            if len(set([check1, check2, check3])) < 3:
                if [check1, check2, check3].count('Month') > 1:
                    return self.double_check(series_df, series_df, series_df, ["year_col", "month_col", "day_col"])
                elif [check1, check2, check3].count('Day') > 1:
                    return 'Error'
                else:
                    return f"{check1}-{check2}-{check3}"
            else:
                return f"{check1}-{check2}-{check3}"

        except Exception as e:
            return 'Empty'

"""
This Module is responsible for calculating the KDE for a dataframe
"""

from dateutil.relativedelta import relativedelta

from datetime import datetime,timedelta


class KDECalculation:

    def __init__(self,spark,main_w:30,inc_w:30):
        """Initializer of the class DescriptiveDetails"""
        self.spark=spark
        self._df = None
        self.trend_df=None
        self.date_col = None
        self.incremental_window = None
        self.main_window = None
        self.cutoff_date = None
        self.mainstream_df = None
        self.incremental_df = None
        self.n_window = None
        self.df_windows = []
        self.comp_date = None
        self.window_main=main_w
        self.window_inc=inc_w
        self.format_obj = FormatCheck(self.spark)
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

    def set_up(self, df, date_col, incremental_window=30, main_window=180):
        start_time = time.time()
        self.log_function_start("set_up")
        self._df = df
        if self._df.schema[date_col].dataType != DateType() and self._df.schema[date_col].dataType != TimestampType():
            self._df = self._df.withColumn(date_col, to_date(col(date_col)))
        self.trend_df=self._df

        self.date_col = date_col
        # self._df=self._df.withColumn('date_col',F.to_date(date_col))
        self.incremental_window = incremental_window
        self.main_window = main_window
        self.log_function_time("set_up", start_time)
        self.log_function_end("set_up")
 
    def set_meta_date(self, incremental_window , main_window ):
        """
        Main data and incremental data can be created using days only.
        The incremental data can contain multiple dates.
        """
        start_time = time.time()
        self.log_function_start("set_meta_date")
        self.incremental_window = incremental_window
        self.main_window = main_window
        max_date = self._df.agg(F.max(self.date_col)).collect()[0][0]
        # print(type(max_date))
     
        self.cutoff_date = max_date - relativedelta(days=self.incremental_window)
        self.comp_date = max_date - relativedelta(days=self.main_window + self.incremental_window)

        
        self._df = self._df.filter(F.col(self.date_col) >= self.comp_date)
        self.mainstream_df = self._df.filter(F.col(self.date_col) < self.cutoff_date).cache()   
        self.incremental_df = self._df.filter(F.col(self.date_col) >= self.cutoff_date).cache()
        self.log_function_time("set_meta_date", start_time)
        self.log_function_end("set_meta_date")

        
        # max_date_mainstream = self.mainstream_df.agg(F.max(self.date_col).alias("max_date")).collect()[0]["max_date"]
        # min_date_mainstream = self.mainstream_df.agg(F.min(self.date_col).alias("min_date")).collect()[0]["min_date"]

        # self.n_window = int(self.main_window / self.incremental_window)
        # self.df_windows = []

      
        # cutoff_min_window = min_date_mainstream
        # for _ in range(self.n_window):
        #     cutoff_max_window = cutoff_min_window + relativedelta(days=self.incremental_window)
         
        #     sel_df = self.mainstream_df.filter(
        #         (F.col(self.date_col) >= cutoff_min_window) &
        #         (F.col(self.date_col) < cutoff_max_window)
        #     )
            
          
        #     self.df_windows.append(sel_df)
            
        #     cutoff_min_window = cutoff_max_window



    def numeric_format(self):
        """
        Compare numeric format differences between mainstream and incremental dataframes using PySpark
        """
        start_time = time.time()
        self.log_function_start("numeric_format")

        try:
            mainstrm_float_cols = [
                f.name for f in self.mainstream_df.schema.fields
                if isinstance(f.dataType, (IntegerType, FloatType, DoubleType, LongType))
            ]
            inc_float_cols = [
                f.name for f in self.incremental_df.schema.fields
                if isinstance(f.dataType, (IntegerType, FloatType, DoubleType, LongType))
            ]

            def check_decimal(col_name):
                return (
                    F.when(F.col(col_name).cast('double') % 1 != 0, 1)
                    .otherwise(0)
                    .alias('is_float')
                )

            main_results = []
            for col in mainstrm_float_cols:
                counts = (
                    self.mainstream_df
                    .select(check_decimal(col))
                    .groupBy('is_float')
                    .agg(F.count('*').alias('count'))
                    .withColumn('total', F.sum('count').over(Window.partitionBy()))
                    .withColumn('ratio', (F.col('count') / F.col('total')).cast('double')) 
                    .collect()
                )

                row = {'column_name': col, 'int_count_base': 0.0, 'float_count_base': 0.0}   
                for count in counts:
                    if count['is_float'] == 0:
                        row['int_count_base'] = count['ratio']
                    else:
                        row['float_count_base'] = count['ratio']
                main_results.append(row)

            

            inc_results = []
            for col in inc_float_cols:
                counts = (
                    self.incremental_df
                    .select(check_decimal(col))
                    .groupBy('is_float')
                    .agg(F.count('*').alias('count'))
                    .withColumn('total', F.sum('count').over(Window.partitionBy()))
                    .withColumn('ratio', (F.col('count') / F.col('total')).cast('double'))  
                    .collect()
                )

                row = {'column_name': col, 'int_count_inc': 0.0, 'float_count_inc': 0.0}  
                for count in counts:
                    if count['is_float'] == 0:
                        row['int_count_inc'] = count['ratio']
                    else:
                        row['float_count_inc'] = count['ratio']
                inc_results.append(row)

            main_df = self.spark.createDataFrame(main_results)
            inc_df = self.spark.createDataFrame(inc_results)

            # Debugging
            print("Schema of main_df:")
            main_df.printSchema()
            print("Schema of inc_df:")
            inc_df.printSchema()

            final = (
                main_df.join(inc_df, 'column_name', 'outer')
                .fillna(0.0)
                .withColumn(
                    'd_type_inc',
                    F.when(F.col('float_count_inc') != 0, 'float').otherwise('int')
                )
                .withColumn(
                    'd_type_base',
                    F.when(F.col('float_count_base') != 0, 'float').otherwise('int')
                )
                .withColumn('change', F.col('d_type_base') == F.col('d_type_inc'))
                .withColumn(
                    'change',
                    F.when(F.col('change') == True, 'No').otherwise('Yes')
                )
                .withColumn(
                    'score',
                    F.when(F.col('change') == 'No', 10).otherwise(0)
                )
            )
            self.log_function_time("numeric_format", start_time)
            self.log_function_end("numeric_format")
            return final

        except Exception as e:
            print('Error in _numeric_format:', e)
            return self.spark.createDataFrame([], StructType([]))

    def categorical_format(self):
        start_time = time.time()
        self.log_function_start("categorical_format")
        cat_schema=StructType([
            StructField("column_name",StringType()),
            StructField("max_len_main",IntegerType()),
            StructField("min_len_main",IntegerType()),
            StructField("max_len_inc",IntegerType()),
            StructField("min_len_inc",IntegerType()),
            StructField("chng_max",FloatType()),
            StructField("chng_min",FloatType()),
            StructField("score",IntegerType())
            ])

        categorical_columns=[f.name for f in self.mainstream_df.schema.fields  if (isinstance (f.dataType,StringType))]
    
        cat_list=[]
        
        
        for c in categorical_columns:
            
            max_len_main=self.mainstream_df.select(F.max(F.length(F.col(c)))).collect()[0][0]
            min_len_main=self.mainstream_df.select(F.min(F.length(F.col(c)))).collect()[0][0]
            max_len_inc=self.incremental_df.select(F.max(F.length(F.col(c)))).collect()[0][0]
            min_len_inc=self.incremental_df.select(F.min(F.length(F.col(c)))).collect()[0][0]
            change_max=(max_len_inc-max_len_main)*100/max_len_main
            if(min_len_main==0):
                change_min=100.0
            else:
                change_min=(min_len_inc-min_len_main)*100/min_len_main

            score=0 if change_max>20 or change_min<-20 else 10
            cat_list.append((c,max_len_main,min_len_main,max_len_inc,min_len_inc,change_max,change_min,score))
        
        cat_df=self.spark.createDataFrame(cat_list,cat_schema)
        self.log_function_time("categorical_format", start_time)
        self.log_function_end("categorical_format")
        return cat_df

    def dov_numeric(self):
        start_time = time.time()
        self.log_function_start("dov_numeric")
        
        num_cols = [f.name for f in self._df.schema.fields 
                    if isinstance(f.dataType, (IntegerType, FloatType, DoubleType, LongType))]
        
        res_ls = []
        for col in num_cols:
            main_stats = self.mainstream_df.agg(
                F.max(col).alias("max"),
                F.min(col).alias("min"),
                F.count(col).alias("count")
            ).collect()[0]
            
            inc_stats = self.incremental_df.agg(
                F.max(col).alias("max"),
                F.min(col).alias("min"),
                F.count(col).alias("count")
            ).collect()[0]
            
            main_90pct = self.mainstream_df.approxQuantile(col, [0.9], 0.01)[0]
            inc_90pct = self.incremental_df.approxQuantile(col, [0.9], 0.01)[0]
            
            pct90_count_main = (self.mainstream_df
                            .filter(F.col(col) >= main_90pct)
                            .count() / main_stats["count"] * 100)
            
            pct90_count_inc = (self.incremental_df
                            .filter(F.col(col) >= inc_90pct)
                            .count() / inc_stats["count"] * 100)
            
            max_main, min_main = main_stats["max"], main_stats["min"]
            max_inc, min_inc = inc_stats["max"], inc_stats["min"]
            
            chng_max = float((max_inc - max_main) * 100 / max_main) if max_main != 0 else 0.0
            chng_min = float((min_inc - min_main) * 100 / min_main) if min_main != 0 else 0.0
            chng_90 = (pct90_count_inc - pct90_count_main) * 100 / pct90_count_main if pct90_count_main != 0 else 0
            
            res_ls.append({
                "column_name": col,
                "max_main": float(max_main),
                "min_main": float(min_main),
                "max_inc": float(max_inc),
                "min_inc": float(min_inc),
                "pct90_count_main": float(pct90_count_main),
                "pct90_count_inc": float(pct90_count_inc),
                "chng_max": float(chng_max),
                "chng_min": float(chng_min),
                "chng_90": float(chng_90)
            })
        
        schema = StructType([
            StructField("column_name", StringType(), True),
            StructField("max_main", DoubleType(), True),
            StructField("min_main", DoubleType(), True),
            StructField("max_inc", DoubleType(), True),
            StructField("min_inc", DoubleType(), True),
            StructField("pct90_count_main", DoubleType(), True),
            StructField("pct90_count_inc", DoubleType(), True),
            StructField("chng_max", DoubleType(), True),
            StructField("chng_min", DoubleType(), True),
            StructField("chng_90", DoubleType(), True),
            StructField("score", IntegerType(), True)
        ])
        
        res_df = self.spark.createDataFrame(res_ls, schema)
        
        res_df = res_df.withColumn(
            'score',
            F.when(F.abs(F.col('chng_90')) < 10, 10)
            .when((F.abs(F.col('chng_90')) >= 10) & (F.abs(F.col('chng_90')) < 20), 8)
            .when((F.abs(F.col('chng_90')) >= 20) & (F.abs(F.col('chng_90')) < 50), 5)
            .when((F.abs(F.col('chng_90')) >= 50) & (F.abs(F.col('chng_90')) < 80), 2)
            .when(F.abs(F.col('chng_90')) >= 80, 0)
            .otherwise(None)
        )
        
        self.log_function_time("dov_numeric", start_time)
        self.log_function_end("dov_numeric")
        
        return res_df
        
    def dov_categorical(self):
        start_time = time.time()
        self.log_function_start("dov_categorical")
        schema = StructType([
                    StructField("column_name", StringType(), True),
                    StructField("values", StringType(), True),
                    StructField("count", DoubleType(), True),
                    StructField("pct", DoubleType(), True),
                    StructField("score", IntegerType(), True)
                ])
        
        df_final=self.spark.createDataFrame([],schema)
        main_rows=self.mainstream_df.count()
        inc_rows=self.incremental_df.count()
        cat_col=[i.name  for i in self.mainstream_df.schema.fields if isinstance(i.dataType,StringType)]
        # print(cat_col)
        res_ls=[]
        # col_df = spark.createDataFrame([(col,) for col in cat_col], ["column_name"])


        for c in cat_col:

            main_cat=self.mainstream_df.select(c).distinct().collect()
            main_cat=[i[0] for i in main_cat ]
            inc_cat=self.incremental_df.select(c).distinct().collect()
            inc_cat=[i[0] for i in inc_cat ]
            diff_cat=[i for i in inc_cat if i not in main_cat]
            # print(diff_cat)

            if len(diff_cat) == 0  or  ( self.mainstream_df.select(c).distinct().count() == main_rows) or (self.mainstream_df.groupby(c).count().orderBy(F.col('count').desc())).first()[1]/main_rows < 0.2:
                    res_ls.append( self.spark.createDataFrame([(c,None,0.,0.,10)],schema))
            else:
                fdf=self.incremental_df.filter(col(c).isin(diff_cat))
                fdf=fdf.groupBy(c).count()
                fdf=fdf.withColumn('pct',F.col('count')*100/inc_rows)
                fdf=fdf.withColumnRenamed(c,'values')
                fdf=fdf.withColumn('column_name',F.lit(c))
                fdf=fdf.withColumn('score',F.lit(0))
                fdf=fdf.select('column_name','values','count','pct','score')
                res_ls.append(fdf)
            
        df_final = reduce(lambda a, b: a.union(b), res_ls)
        
        self.log_function_time("dov_categorical", start_time)
        self.log_function_end("dov_categorical")
        return df_final
    def date_format(self):
        print("======== Inside date format =======")
        start_time = time.time()
        self.log_function_start("date_format")

        date_cols = [f.name for f in self._df.schema.fields 
                    if isinstance(f.dataType, (DateType, TimestampType, TimestampNTZType))]
        

        if not date_cols:
            print("df has no date cols")
            empty_schema = StructType([
                StructField("main_col_format", StringType(), True),
                StructField("inc_col_format", StringType(), True),
                StructField("status", StringType(), True),
                StructField("column_name", StringType(), True),
                StructField("score", StringType(), True),
            ])
            return self.spark.createDataFrame([], schema=empty_schema)

        res_ls = []

        for col_name in date_cols:
            # print('col_names: ', col_name)
            main_col = self.mainstream_df.select(col(col_name).cast(StringType()).alias("date_col"))
            inc_col = self.incremental_df.select(col(col_name).cast(StringType()).alias("date_col"))

            if main_col.count() == 0 or inc_col.count() == 0:
                main_format, inc_format, status = "Empty", "Empty", False
            else:
                main_format = self.format_obj.format_check(main_col, "date_col")
                inc_format = self.format_obj.format_check(inc_col, "date_col")
                status = main_format == inc_format
               
            res_dict = {
                "main_col_format": main_format,
                "inc_col_format": inc_format,
                "status": "No" if status else "Yes",
                "column_name": col_name,
                "score": 10 if status else 0
            }
            res_ls.append(res_dict)

            schema = StructType([
                StructField("main_col_format", StringType(), True),
                StructField("inc_col_format", StringType(), True),
                StructField("status", StringType(), True),
                StructField("column_name", StringType(), True),
                StructField("score", StringType(), True),
            ])

      
        res_df = self.spark.createDataFrame(res_ls, schema)
        self.log_function_time("date_format", start_time)
        self.log_function_end("date_format")
        return res_df
    

    def completeness(self,Base, Increment, Type):
        start_time = time.time()
        self.log_function_start("completeness")
        
        d_type = [i.name for i in Base.schema.fields if isinstance(i.dataType, Type)]
        
    
        base_df = Base.select(d_type)
        increment_df = Increment.select(d_type)
        
        def fill(dataset):
            total_rows = dataset.count()
            column_lst = dataset.columns
            lst = []
            for i in column_lst:
                temp = []
        
                non_null_count = dataset.filter(F.col(i).isNotNull()).count()
                fill_rate = non_null_count * 100 / total_rows
                temp.append(i)
                temp.append(fill_rate)
                lst.append(temp)
            
            df =  self.spark.createDataFrame(lst, ['column_name', 'fill_rate'])
            return df
        
        fill_base = fill(base_df)
        fill_base = fill_base.withColumnRenamed('fill_rate', 'fill_rate_base')
        fill_increment = fill(increment_df)
    
        fill_increment = fill_increment.withColumnRenamed('fill_rate', 'fill_rate_increment')
        final = fill_base.join(fill_increment, on='column_name')
        self.log_function_time("completeness", start_time)
        self.log_function_end("completeness")
        return final



    def score(self):
        start_time = time.time()
        self.log_function_start("score")
        categorical=(StringType,)
        numerical=(IntegerType,FloatType,LongType,DoubleType)
        date=(DateType,TimestampType)

        completeness_categorical = self.completeness(self.mainstream_df,self.incremental_df,categorical)
        completeness_categorical = completeness_categorical.withColumn('data_type',F.lit('categorical'))

        completeness_numerical = self.completeness(self.mainstream_df,self.incremental_df,numerical)
        completeness_numerical = completeness_numerical.withColumn('data_type',F.lit('numerical'))
    
        completeness_date = self.completeness(self.mainstream_df,self.incremental_df,date)
        completeness_date = completeness_date.withColumn('data_type',F.lit('date'))

        final=reduce(lambda a,b:a.union(b),[completeness_categorical,completeness_numerical,completeness_date])
        final = final.withColumn(
        'difference',
        (F.abs(F.col('fill_rate_base') - F.col('fill_rate_increment')) / F.col('fill_rate_base') ) )

        # final=final.withColumn('difference_score',F.when(F.col('difference')<1.0,10.0 ).when((F.col('difference')>=1.0) & (F.col('difference')<=2.0) ),8.0).when((F.col('difference')>=2.0) & (F.col('difference')<=5.0) ,5.0).when((F.col('difference')>=5.0) & (F.col('difference')<=8.0) ,2.0).otherwise(0)
        final=final.withColumn('difference_score',
        F.when(F.col('difference')<1.0,10.0 ).\
         when((F.col('difference')>=1.0) & (F.col('difference')<=2.0) ,8.0).\
         when((F.col('difference')>=2.0) & (F.col('difference')<=5.0) ,5.0).\
         when((F.col('difference')>=5.0) & (F.col('difference')<=8.0) ,2.0).\
        otherwise(0)
        ) 

        final=final.withColumn('difference_score',F.when(F.col('fill_rate_increment') >=F.col('fill_rate_base'),10).otherwise(F.col('difference_score')) )
        final=final.withColumn('increment_score', F.round(F.col('fill_rate_increment')/10,1) )
        final=final.withColumn('completeness_score', ( F.col('difference_score')+F.col('increment_score')) / 2 )
        final = final.withColumn(
        'difference',
        ((F.abs(F.col('fill_rate_base') - F.col('fill_rate_increment')) * 100 )/ F.col('fill_rate_base') ) )

        self.log_function_time("score", start_time)
        self.log_function_end("score")
        return final

    def dov_date(self):
        start_time = time.time()
        self.log_function_start("dov_date")
    
        schema = StructType([
                StructField('column_name', StringType(), True),
                StructField('growing', StringType(), True),
                StructField('increment_min', DateType(), True),
                StructField('increment_max', DateType(), True),
                StructField('base_min', DateType(), True),
                StructField('base_max', DateType(), True),
                StructField('fault', StringType(), True)
            ])
        
        final_df=self.spark.createDataFrame([],schema)
        columns=[i.name for  i in self.mainstream_df.schema.fields  if isinstance(i.dataType,(DateType,TimestampType))]
        
        for i in columns:
                min_increment = self.incremental_df.select(F.min(i)).collect()[0][0]
                max_increment = self.incremental_df.select(F.max(i)).collect()[0][0]
                min_base = self.mainstream_df.select(F.min(i)).collect()[0][0]
                max_base = self.mainstream_df.select(F.max(i)).collect()[0][0]
            
                # max_base=max_base+relativedelta(months=1)
                # # Extract the month
                # month_value_base = max_base.month
                # month_value_increment = min_increment.month
             
                if(max_base>=min_increment):
                    missing_months_count=0
                else:
                        
                        # left_df=existing_dates.select(col("Registration_Date").alias("Dates")).distinct()
                        # left_df.show()
                        # left_dff=left_df.withColumn('Dates',F.date_format('Dates',"yyyy-MM"))
                        # left_dff.show()

                    date_range = self.spark.sql("SELECT sequence(to_date('{}'), to_date('{}'), interval 1 month) as Dates"
                                        .format(max_base, min_increment))
                  

                    date_range = date_range.select(explode(col("Dates")) .alias('Dates'))

                    date_range=date_range.withColumn('Dates',F.date_format('Dates',"yyyy-MM"))
                


                    # here total df is to be used
                    existing_dates = self._df.filter((col(i) >= max_base)& (col(i)<= min_increment) )

                    existing_dates=existing_dates.select(col(i).alias("Dates")).distinct()
                    
                    existing_dates=existing_dates.withColumn('Dates',F.date_format('Dates',"yyyy-MM"))
                 
                
                    missing_months = date_range.join(existing_dates, "Dates", "left_anti")
                    
                    missing_months_count = missing_months.count()
                schema_null = StructType([StructField("Dates", DateType(), True)])
                
                if missing_months_count == 0:
                    missing_months = self.spark.createDataFrame([(None,)], schema_null)

                
                # missing_months = missing_months.withColumn("fault", F.date_trunc("month", col(i)))
                grow="Growing"
                column_type =self.mainstream_df.schema[i].dataType
                if(isinstance(column_type,DateType)):
                    grow='NON-Growing'
                
                
                missing_months = missing_months.withColumn("column_name", lit(i)) \
                                            .withColumn("Growing", F.lit(grow)   ) \
                                            .withColumn("Increment_min", F.lit(min_increment)) \
                                            .withColumn("Increment_max", F.lit(max_increment)) \
                                            .withColumn("Base_min", F.lit(min_base)) \
                                            .withColumn("Base_max", F.lit(max_base)) \
                                            .withColumnRenamed('Dates','Fault')\
                                            .select("column_name", "Growing", "Increment_min", "Increment_max", "Base_min", "Base_max", "fault")
                                            # .select("column_name", "Growing", "Increment_min", "Increment_max", "Base_min", "Base_max")

               
                final_df=final_df.union(missing_months)
        final_df=final_df.withColumn('score',F.when(F.isnull(F.col('fault')) , 10).otherwise(0))
                
                # final_df = missing_months.withColumn("fault", when(col("fault").isNull(), lit(None))
                #                                     .otherwise(col("fault")))

        self.log_function_time("dov_date", start_time)
        self.log_function_end("dov_date")
       
        return final_df
    

    def Trend(self):
        start_time = time.time()
        self.log_function_start("Trend")
        t_df=self.trend_df
        # t_df.printSchema()
        # t_df.select(F.max(self.date_col)).printSchema()
        var=6
        schema=StructType([StructField("column_name",StringType()),
                        StructField("completeness",FloatType()),
                        StructField("date",DateType())])

        start_date=t_df.select(F.min(self.date_col)).collect()[0][0]

        final =self.spark.createDataFrame([],schema)
        for i in range(0,6):
            k=t_df.select(F.max(self.date_col)).collect()[0][0]
            # print(k)
            # print(type(k))
            end_date=k-relativedelta(months=var-i)
            # if(end_date==None):
            #     return final

            new_dataframe=t_df.filter( ( (F.col(self.date_col) >= start_date ) &  (F.col(self.date_col) < end_date) ) )
    
            def fill(dataset):
                try:
                    total_rows = dataset.count()
                    column_lst = dataset.columns
                    lst = []
                    for i in column_lst:
                        temp = []
                
                        non_null_count = dataset.filter(F.col(i).isNotNull()).count()
                        
                        fill_rate = non_null_count * 100 / total_rows
                     
                        temp.append(i)
                        temp.append(fill_rate)
                        lst.append(temp)
                    
                    df = self.spark.createDataFrame(lst, ['column_name', 'completeness'])
                    df=df.withColumn('date',F.lit(end_date))
                except Exception as e:
                
                    schema = StructType([
                        StructField("column1", StringType(), True),
                        StructField("column2", IntegerType(), True)
                    ])
                    df= self.spark.createDataFrame([], schema)
                    df=df.withColumn('date',F.lit(end_date))

                return df
            temp=fill(new_dataframe)
            
            final=final.union(temp)
        self.log_function_time("Trend", start_time)
        self.log_function_end("Trend")
        return final
    

    def run(self):
        start_time = time.time()
        self.log_function_start("run")
        self.set_meta_date(self.window_inc,self.window_main)
        categorical_format = self.categorical_format()
        numerical_format = self.numeric_format()
        date_format = self.date_format()
        date_domain = self.dov_date()
        categorical_domain = self.dov_categorical()
        numerical_domain = self.dov_numeric()
        completeness = self.score()
        
        trend = self.Trend()
        overall = completeness.select(['column_name','data_type','completeness_score'])
        # print(overall.show(10000),'I AM  OVERALL')

    
        overall_num_format = numerical_format.select(['column_name','score'])\
                    .withColumnRenamed('score','format_score')
        # overall_num_format.show()
        overall_num_domain = numerical_domain.select(['column_name','score'])\
                    .withColumnRenamed('score','domain_score')
        # overall_num_domain.show()

        overall_cat_format = categorical_format.select(['column_name','score'])\
                    .withColumnRenamed('score','format_score')
        overall_cat_domain = categorical_domain.select(['column_name','score'])\
                    .distinct()\
                    .withColumnRenamed('score','domain_score')

        overall_date_format = date_format.select(['column_name','score'])\
                    .withColumnRenamed('score','format_score')
        
        overall_date_domain = date_domain.select(['column_name','score'])\
                            .distinct()\
                  .withColumnRenamed('score','domain_score')



        overall_num= overall_num_domain.join(overall_num_format,on='column_name')\
            .withColumn('data_type',F.lit('numerical'))
            # .withColumnRenamed('score_x','domain_score')\
            # .withColumnRenamed('score_y','format_score')
            
        overall_cat= overall_cat_domain.join(overall_cat_format,on='column_name').withColumn('data_type',F.lit('categorical'))
            # .withColumnRenamed('score_x','domain_score')\
            # .withColumnRenamed('score_y','format_score')
    
        overall_date=overall_date_domain.join(overall_date_format,on='column_name')\
            .withColumn('data_type',F.lit('date'))
            # .withColumnRenamed('score_x','domain_score')\
            # .withColumnRenamed('score_y','format_score')
   
        
        res=overall_num.union(overall_cat)\
            .union(overall_date)\
            .fillna(0,subset=['domain_score','format_score'])

        overall=overall.join(res,on=['column_name','data_type'])
        overall=overall.withColumn('score',  (F.col('completeness_score')+F.col('domain_score')+F.col('format_score') ) / 3 )
        print("===============================================SUCCESSFULLY EXECUTED ========================================")
        
        self.log_function_time("run", start_time)
        self.log_function_end("run")
        self.mainstream_df.unpersist()
        self.incremental_df.unpersist()
        return categorical_format, numerical_format, date_format,categorical_domain,numerical_domain,date_domain,completeness,trend,overall

# kde=KDECalculation(spark)
# kde.set_up(df,'Registration_Date')
# kde.set_meta_date()
# l=kde.Trend()