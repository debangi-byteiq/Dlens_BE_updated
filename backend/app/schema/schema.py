from pydantic import BaseModel
from typing import Any, Dict,Optional

class Details(BaseModel):
    hostname: str
    port: str
    username: str
    password: str
    dbname: str
    schema_name: Optional[str]=None
    table_name : str  
    datecol:  Optional[str]=None
    image: Optional[str]=None
    base_months:  Optional[int]=30
    inc_months:  Optional[int]=30
    text: str

class Source(BaseModel):
    details: Details

