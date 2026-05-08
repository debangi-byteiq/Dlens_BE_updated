from pydantic import BaseModel
from typing import Optional
from datetime import date

class KDENumericalFormat(BaseModel):
    column_name: Optional[str]
    int_count_base: Optional[float]
    float_count_base: Optional[float]
    int_count_inc: Optional[float]
    float_count_inc: Optional[float]
    d_type_inc: Optional[str]
    d_type_base: Optional[str]
    change: Optional[str]
    score: Optional[int]
    table_name: Optional[str]

class KDECategoricalFormat(BaseModel):
    column_name: Optional[str]
    max_len_main: Optional[int]
    min_len_main: Optional[int]
    max_len_inc: Optional[int]
    min_len_inc: Optional[int]
    chng_max: Optional[float]
    chng_min: Optional[float]
    score: Optional[int]
    table_name: Optional[str]

class KDEDateFormat(BaseModel):
    main_col_format: Optional[str]
    inc_col_format: Optional[str]
    status: Optional[str]
    column_name: Optional[str]
    score: Optional[int]
    table_name: Optional[str]

class KDENumericalDomain(BaseModel):
    column_name: Optional[str]
    max_main: Optional[float]
    min_main: Optional[float]
    max_inc: Optional[float]
    min_inc: Optional[float]
    pct90_count_main: Optional[float]
    pct90_count_inc: Optional[float]
    chng_max: Optional[float]
    chng_min: Optional[float]
    chng_90: Optional[float]
    score: Optional[int]
    table_name: Optional[str]

class KDECategoricalDomain(BaseModel):
    column_name: Optional[str]
    values: Optional[str]
    count: Optional[int]
    pct: Optional[float]
    score: Optional[int]
    table_name: Optional[str]

class KDEDateDomain(BaseModel):
    column_name: Optional[str]
    growing: Optional[str]
    increment_min: Optional[date]
    increment_max: Optional[date]
    base_min: Optional[date]
    base_max: Optional[date]
    fault: Optional[str]
    score: Optional[int]
    table_name: Optional[str]

class KDECompleteness(BaseModel):
    column_name: Optional[str]
    fill_rate_base: Optional[float]
    fill_rate_increment: Optional[float]
    data_type: Optional[str]
    difference: Optional[float]
    difference_score: Optional[float]
    increment_score: Optional[float]
    completeness_score: Optional[float]
    table_name: Optional[str]

class KDETrend(BaseModel):
    column_name: Optional[str]
    completeness: Optional[float]
    date: Optional[date]
    table_name: Optional[str]

class KDEOverall(BaseModel):
    column_name: Optional[str]
    data_type: Optional[str]
    completeness_score: Optional[float]
    domain_score: Optional[int]
    format_score: Optional[int]
    score: Optional[float]
    table_name: Optional[str]
