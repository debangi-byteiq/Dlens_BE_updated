from datetime import date
from typing import Optional
from pydantic import BaseModel

class ColumnMeta(BaseModel):
    column_name:Optional[ str]
    d_type: str
    Non_null_count: Optional[ int]
    fill_rate: float
    rank: int
    unique_count: int
    unique_rate: float

class NumericalDetail(BaseModel):
    column_name: str
    count: int
    min: float
    max: float
    percentile_05: float
    percentile_95: float
    percentile_25: float
    percentile_75: float
    median: float
    mean: float
    std_dev: float
    skewness: float=0.0
    variance: float
    first: float
    second: float
    third: float
    fourth: float
    fifth: float


class MetaData(BaseModel):
    data_field: int                   
    record: int                    
    completeness: float             
    duplicates: int                   
    numerical: int                 
    categorical: int              
    date: int                      


class CategoryDetail(BaseModel):
    category: Optional[str]
    value_counts: int
    column_name: str
    category_distribution: float

class DateDetail(BaseModel):
    column_name:  Optional[str] 
    mon_yr:  Optional[str] 
    mon_yr_count: int
    month: int
    year: int
    min_date: Optional[date] 
    max_date: Optional[date]


