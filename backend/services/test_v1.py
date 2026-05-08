# from main.main import Main
# from main.settings import DatabaseConfig

from services.main.main_v1 import Main
from services.main.settings import DatabaseConfig

obj=DatabaseConfig()

if obj.db_type=='csv' :
    data_source_type='csv'
else:
    data_source_type='RDBMS'

main_obj = Main(
    data_source_type=data_source_type,
)

main_obj.run(save='Destination')


 