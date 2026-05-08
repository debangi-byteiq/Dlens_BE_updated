from services.main.source_cred import DataFetcher
import asyncio
import os
from dotenv import load_dotenv

load_dotenv()


class DatabaseConfig:
    def __init__(self,d):

        self.db_type=d['text']
        if(self.db_type=='csv'):
            self.filename=d['filename']
            self.datecol=d['datecol']
            self.base_months=d['base_months']
            self.inc_months=d['inc_months']
        elif (self.db_type=='Mongodb'):
            self.source_hostname = d['hostname']
            self.source_port =  d['port']
            self.source_username =  d['username']
            self.source_password =  d['password']
            self.source_db_name =  d['dbname']
            self.source_table =  d['table_name']
            
        else:
            self.source_hostname = d['hostname']
            self.source_port =  d['port']
            self.source_username =  d['username']
            self.source_password =  d['password']
            self.source_db_name =  d['dbname']
            self.source_db_schema =  d['schema_name']
            self.source_table =  d['table_name']

        self.dest_hostname =  os.getenv('DB_HOST')
        self.dest_port =os.getenv('DB_PORT')
        self.dest_username = os.getenv('DB_USER')
        self.dest_password = os.getenv('DB_PASSWORD')
        self.dest_db_name = os.getenv('DB_NAME')
        self.dest_db_schema = 'public'
    
print(__name__)

 