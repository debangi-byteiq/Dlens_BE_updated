from pydantic import BaseModel
from typing import Optional
import datetime

class MacroModel(BaseModel):
    characteristics: Optional[str] = None
    base: Optional[float] = None
    increment: Optional[float] = None
    change: Optional[float] = None
    macro_shift_eval: Optional[float] = None
    macro_shift: Optional[float] = None
    table_name: Optional[str] = None

class NumericModel(BaseModel):
    column_name: Optional[str] = None
    mean_base: Optional[float] = None
    mean_inc: Optional[float] = None
    mean_shift: Optional[float] = None
    median_base: Optional[float] = None
    median_inc: Optional[float] = None
    median_shift: Optional[float] = None
    std_base: Optional[float] = None
    std_inc: Optional[float] = None
    std_shift: Optional[float] = None
    min_base: Optional[float] = None
    min_inc: Optional[float] = None
    min_shift: Optional[float] = None
    max_base: Optional[float] = None
    max_inc: Optional[float] = None
    max_shift: Optional[float] = None
    numeric_shift: Optional[float] = None
    numerical_shift_eval: Optional[float] = None
    numerical_shift_index: Optional[float] = None  
    table_name: Optional[str] = None

class CategoricalModel(BaseModel):
    column_name: Optional[str] = None
    value: Optional[str] = None
    count_base: Optional[int] = None
    proportion_base: Optional[float] = None
    count_inc: Optional[int] = None
    proportion_inc: Optional[float] = None
    change_percent: Optional[float] = None
    total_change: Optional[str] = None
    rank_chng: Optional[float] = None
    cat_shift: Optional[str] = None
    cat_shift_index_eval: Optional[float] = None
    cat_shift_indexation: Optional[str] = None
    table_name: Optional[str] = None

class DSIndexModel(BaseModel):
    year_month: Optional[str] = None
    full_date: Optional[str] = None
    macro_shift: Optional[float] = None
    micro_shift: Optional[float] = None
    shift_indexation: Optional[float] = None
    table_name: Optional[str] = None

class TimelinessModel(BaseModel):
    date: Optional[datetime.date] = None
    shift: Optional[float] = None
    run_count: Optional[int] = None
    table_name: Optional[str] = None
