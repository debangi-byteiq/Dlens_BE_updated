from pyspark.sql import  DataFrame, SparkSession,Window
from pyspark.sql.types import StructType, StructField, StringType, IntegerType, DoubleType , FloatType, LongType
from pyspark.sql.types import DateType,TimestampType
from pyspark.sql import functions as F
import logging
import time

class DescriptiveDetails:
    def __init__(self, spark: SparkSession ) -> None:
        self.spark = spark

        self._df: DataFrame = None
        self.date_col = None
        self._col_meta: DataFrame = None
        self._num_col_df: DataFrame = None
        self._quantile_df: DataFrame = None
        self._num_cols: list = None
        self._eligible_cols: list = None
        self._obj_cols_ls: list = None
        self._date_col_details: dict = None
        self._descriptive_df: DataFrame = None
        self.schema = StructType([
            StructField("category", StringType(), True),
            StructField("value_counts", IntegerType(), True),
            StructField("column_name", StringType(), True),
            StructField("category_distribution", StringType(), True)
        ])

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

    def read_data(self, df: DataFrame,date_col) -> None:
        start_time = time.time()
        self.log_function_start("read_data")
        self.date_col = date_col
        self._df = df
        df.show()
        df.printSchema()
        print("BEFORE  read_data Date_Col")
        if(self.date_col):
            # print(self.date_col)
            self._df=self._df.withColumn(self.date_col,F.to_date(F.col(self.date_col),))
        df.show()
        df.printSchema()
        print("AFTER  read_data Date_Col")
        self.log_function_time("read_data", start_time)
        self.log_function_end("read_data")
        # print(self._df.printSchema())
        # print(self._df.show())
        
    def meta_data(self):

        start_time = time.time()
        self.log_function_start("meta_data")

        if self._df is None or self._df.count() == 0:
            return self.spark.createDataFrame([("col_meta",)], schema=["col_meta"])

        record = self._df.count()
        duplicates = record - self._df.distinct().count()
        columns = self._df.columns

        data_field = len(columns)
        total_elements = data_field * record
        total_non_null_count = sum(self._df.filter(F.col(c).isNotNull()).count() for c in columns)
        completeness = (total_non_null_count / total_elements) * 100 if total_elements > 0 else 0
        completeness = round(completeness, 2)

        numerical = len([f.name for f in self._df.schema.fields if isinstance(f.dataType, (IntegerType, FloatType, DoubleType, LongType))])
        categorical = len([f.name for f in self._df.schema.fields if isinstance(f.dataType, StringType)])
        date = len([f.name for f in self._df.schema.fields if isinstance(f.dataType, (DateType,TimestampType))])

        meta_data_df = self.spark.createDataFrame(
            [(data_field, record, completeness, duplicates, numerical, categorical, date)],
            schema=['data_field', 'record', 'completeness', 'duplicates', 'numerical', 'categorical', 'date']
        )

        self.log_function_time("meta_data", start_time)
        self.log_function_end("meta_data")
        return meta_data_df

    def get_col_meta(self) -> DataFrame:
        start_time = time.time()
        self.log_function_start("get_col_meta")

        if self._df is None or self._df.count() == 0:
            return self._col_meta

        column_names = self._df.columns
        total_row_count = self._df.count()

        col_meta_data = [
    (
        column,  
        str(self._df.schema[column].dataType), 
        (non_null_count := self._df.filter(F.col(column).isNotNull()).count()),
        (fill_rate := (non_null_count * 100) / total_row_count) if total_row_count > 0 else 0,
        (
                1 if 0 <= fill_rate <= 20 else
                2 if 21 <= fill_rate <= 40 else
                3 if 41 <= fill_rate <= 60 else
                4 if 61 <= fill_rate <= 80 else
                5
            ),
        (unique_count := self._df.select(column).distinct().count()),
        (unique_count * 100) / total_row_count if total_row_count > 0 else 0  
    )
    for column in column_names]

        self._col_meta = self.spark.createDataFrame(col_meta_data, schema=['column_name', 'd_type', 'Non_null_count', 'fill_rate','rank', 'unique_count', 'unique_rate'])

        self.log_function_time("get_col_meta", start_time)
        self.log_function_end("get_col_meta")
        return self._col_meta

    def get_descriptive_stat(self) -> DataFrame:
        start_time = time.time()
        self.log_function_start("get_descriptive_stat")

        if self._df is None:
            raise ValueError("DataFrame is not loaded. Please load data using read_data method.")

        num_cols = [f.name for f in self._df.schema.fields if isinstance(f.dataType, (IntegerType, FloatType, DoubleType, LongType))]
        if not num_cols:
            return self.spark.createDataFrame([], self.schema)

        self._num_col_df = self._df.select(num_cols)
        descriptive_df = self._num_col_df.agg(
            *[F.count(c).alias(f"{c}_count") for c in num_cols],
            *[F.min(c).alias(f"{c}_min") for c in num_cols],
            *[F.max(c).alias(f"{c}_max") for c in num_cols],
            *[F.expr(f"percentile_approx(`{c}`, 0.05)").alias(f"{c}_percentile_05") for c in num_cols],
            *[F.expr(f"percentile_approx(`{c}`, 0.95)").alias(f"{c}_percentile_95") for c in num_cols],
            *[F.expr(f"percentile_approx(`{c}`, 0.25)").alias(f"{c}_percentile_25") for c in num_cols],
            *[F.expr(f"percentile_approx(`{c}`, 0.75)").alias(f"{c}_percentile_75") for c in num_cols],
            *[F.expr(f"percentile_approx(`{c}`, 0.50)").alias(f"{c}_median") for c in num_cols],
            *[F.mean(c).alias(f"{c}_mean") for c in num_cols],
            *[F.stddev(c).alias(f"{c}_std_dev") for c in num_cols],
            *[F.skewness(c).alias(f"{c}_skewness") for c in num_cols],
            *[F.variance(c).alias(f"{c}_variance") for c in num_cols]
        )

        exprs = [
            F.struct(
                F.lit(c).alias('column_name'),
                *[F.col(f"{c}_{stat}").alias(stat) for stat in [
                    'count', 'min', 'max', 'percentile_05', 'percentile_95',
                    'percentile_25', 'percentile_75', 'median', 'mean',
                    'std_dev', 'skewness', 'variance']]
            )
            for c in num_cols
        ]

        final_df = descriptive_df.select(F.explode(F.array(*exprs)).alias("stats"))
        final_df = final_df.select("stats.*")
        final_df=final_df.select(F.col('column_name'),
                                F.col('count').cast(LongType()),
                                F.col('min').cast(DoubleType()),
                                F.col('max').cast(DoubleType()),
                                F.col('percentile_05').cast(DoubleType()),
                                F.col('percentile_95').cast(DoubleType()),
                                F.col('percentile_25').cast(DoubleType()),
                                F.col('percentile_75').cast(DoubleType()),
                                F.col('median').cast(DoubleType()),
                                F.col('mean').cast(DoubleType()),
                                F.col('std_dev').cast(DoubleType()),
                                F.col('skewness').cast(DoubleType()),
                                F.col('variance').cast(DoubleType()),
        )

        final_df = final_df.fillna(0)

        self.log_function_time("get_descriptive_stat", start_time)
        self.log_function_end("get_descriptive_stat")
        return final_df

    def get_numerical_details(self):
        start_time = time.time()
        self.log_function_start("get_numerical_details")
        self._df.printSchema()
        
        desc_stats = self.get_descriptive_stat()
        schema = StructType([
            StructField('column_name', StringType(), True),
            StructField('count', LongType(), True),
            StructField('mean', DoubleType(), True),
            StructField('median', DoubleType(), True),
            StructField('std', DoubleType(), True),
            StructField('min', DoubleType(), True),
            StructField('one_fourth', DoubleType(), True),
            StructField('half', DoubleType(), True),
            StructField('three_fourth', DoubleType(), True),
            StructField('max', DoubleType(), True),
            StructField('less_than_max', DoubleType(), True),
            StructField('variance', DoubleType(), True),
            StructField('skewness', DoubleType(), True),
            StructField("first", DoubleType(), True),
            StructField("second", DoubleType(), True),
            StructField("third", DoubleType(), True),
            StructField("fourth", DoubleType(), True),
            StructField("fifth", DoubleType(), True)
        ])

        if desc_stats.count() == 0:
            empty_df = self.spark.createDataFrame([], self.schema)
            return empty_df

        num_cols = [f.name for f in self._df.schema.fields if isinstance(f.dataType, (IntegerType, FloatType, DoubleType, LongType))]
        top_values_list = []
        for c in num_cols:
            if self._df.filter(self._df[c].isNotNull()).count() == 0:
                continue 
            top_n_values = self._df.orderBy(self._df[c].desc()).limit(5).select(self._df[c]).collect()
            top_values_list.append([c] + [float(row[0]) for row in top_n_values])


        top_values_df = self.spark.createDataFrame(top_values_list, schema=StructType([
            StructField("column_name", StringType(), True),
            StructField("first", DoubleType(), True),
            StructField("second", DoubleType(), True),
            StructField("third", DoubleType(), True),
            StructField("fourth", DoubleType(), True),
            StructField("fifth", DoubleType(), True)
        ]))

        num_profiling = desc_stats.join(top_values_df, 'column_name', 'inner')

        self.log_function_time("get_numerical_details", start_time)
        self.log_function_end("get_numerical_details")
        return num_profiling
    def get_category_details(self) -> DataFrame:
        start_time = time.time()
        self.log_function_start("get_category_details")

        obj_cols = [f.name for f in self._df.schema.fields if isinstance(f.dataType, StringType)]
        schema_cat = StructType([
            StructField("category", StringType(), True),
            StructField("value_counts", IntegerType(), True),
            StructField("column_name", StringType(), True),
            StructField("category_distribution", StringType(), True)
        ])  

        if len(obj_cols) == 0:
            return self.spark.createDataFrame([], schema_cat)

        category_details_df = self.spark.createDataFrame([], schema_cat)
        total_count = self._df.count()  

        for col_name in obj_cols:
            val_counts = self._df.groupBy(col_name).count().orderBy(F.desc('count')).limit(5)
            res_df = val_counts.withColumn("temp_column_name", F.lit(col_name)) \
                              .withColumn("category_distribution", F.round((F.col("count") * 100) / total_count, 2)) \
                              .select(F.col(col_name).alias("category"), F.col("count").alias("value_counts"), F.col("temp_column_name").alias("column_name"), F.col("category_distribution"))
            category_details_df = category_details_df.unionByName(res_df, allowMissingColumns=True)

        self.log_function_time("get_category_details", start_time)
        self.log_function_end("get_category_details")
        return category_details_df
    
    def get_date_details(self):
        start_time = time.time()
        self.log_function_start("get_date_details")

        schema = StructType([
            StructField("column_name", StringType(), True),
            StructField("mon_yr", StringType(), True),
            StructField("mon_yr_count", IntegerType(), True),
            StructField("month", IntegerType(), True),
            StructField("year", IntegerType(), True),
            StructField("min_date", DateType(), True),
            StructField("max_date", DateType(), True),
        ])

        date_df = self.spark.createDataFrame([], schema=schema)
        dt_cols = [f.name for f in self._df.schema.fields if isinstance(f.dataType, (DateType,TimestampType))]

        if len(dt_cols) == 0:
            return date_df

        for col in dt_cols:
            try:
            
                if isinstance(self._df.schema[col].dataType, TimestampType):
                    date_value_df = self._df.select(
                        F.when(
                            (F.col(col).isNotNull()) ,
                            F.to_date(F.col(col))
                        ).alias(col)
                    )
                else:
                    date_value_df = self._df.select(
                        F.when(
                            (F.col(col).isNotNull()) ,
                            F.col(col)
                        ).alias(col)
                    )
 
                date_value_df = date_value_df.filter(F.col(col).isNotNull()).cache()
                if date_value_df.count() == 0:
                    tempdf=self.spark.createDataFrame([(col,None,0,0,0,None,None)],schema=schema)
                   
                    date_df= date_df.union(tempdf)
                    # print("INSIDE IF")
            
                    continue

 
                min_max_df = date_value_df.agg(
                    F.min(col).alias('min_date'),
                    F.max(col).alias('max_date')
                ).collect()
                
                min_date = min_max_df[0]['min_date']
                max_date = min_max_df[0]['max_date']

                if not min_date or not max_date:
                    continue
 
                date_value_df = date_value_df.withColumnRenamed(col, 'value')
                date_value_df = date_value_df.withColumn(
                    'value', 
                    F.date_format(F.col('value'), 'MM-yyyy')
                )
                date_value_df = date_value_df.groupBy('value').count()

 
                date_range_df = self.spark.sql(f"""
                    SELECT explode(sequence(
                        to_date('{min_date}'),  
                        to_date('{max_date}'),
                        interval 1 month
                    )) as value
                """)
                
            
                date_range_df = date_range_df.withColumn(
                    'value',
                    F.date_format(F.col('value'), 'MM-yyyy')
                )

                full_date_df = date_range_df.join(
                    date_value_df, 
                    on='value', 
                    how='left'
                ).fillna(0)

                full_date_df = full_date_df \
                    .withColumn('min_date', F.lit(min_date)) \
                    .withColumn('max_date', F.lit(max_date)) \
                    .withColumn('column_name', F.lit(col)) \
                    .withColumn('year', F.year(F.to_date('value', 'MM-yyyy'))) \
                    .withColumn('month', F.month(F.to_date('value', 'MM-yyyy'))) \
                    .withColumnRenamed('value', 'mon_yr') \
                    .withColumnRenamed('count', 'mon_yr_count') \
                    .select(
                        "column_name", "mon_yr", "mon_yr_count", 
                        "month", 'year', 'min_date', 'max_date'
                    )

                date_df = date_df.unionByName(full_date_df, allowMissingColumns=True)
                date_value_df.unpersist()


            except Exception as e:
                
                print(f"Error processing column {col}: {str(e)}")
                 
                continue

        self.log_function_time("get_date_details", start_time)
        self.log_function_end("get_date_details")

        return date_df
    def run(self):
                meta_data = self.meta_data()
                col_meta = self.get_col_meta()
                numerical = self.get_numerical_details()
                categorical = self.get_category_details()
                date = self.get_date_details()

                return meta_data, col_meta, numerical, categorical, date