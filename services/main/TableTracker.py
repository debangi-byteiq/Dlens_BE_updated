from app.core.db_pool import get_cursor
class TableTracker:
    def __init__(self,user_id:int):
        self.user_id=user_id
        self.create_tracker_table()

    def create_tracker_table(self):
 
        create_table_query = """
        CREATE TABLE IF NOT EXISTS public.processed_tables_tracker (
            table_name VARCHAR(255),
            schema_name VARCHAR(255),
            processed_date TIMESTAMP,
            is_active BOOLEAN DEFAULT false,
            user_id integer,
            source VARCHAR(255),
            time_taken DOUBLE PRECISION,
            PRIMARY KEY (table_name, user_id)
        );
        """
        # is_active BOOLEAN DEFAULT true,
        with get_cursor() as cursor:
            cursor.execute(create_table_query)

        # print("SUccess full ************************************")
           

    def get_processed_tables(self):
        query = """
        SELECT table_name, schema_name 
        FROM public.processed_tables_tracker 
        WHERE is_active = false;
        """
        # WHERE is_active = true;
        with get_cursor() as cursor:
            cursor.execute(query)
       
            result=cursor.fetchall()

        if not result:   
            print("No tables found.")
            return set()   
        else:
            return set(row[0] for row in result)  
        

    def add_processed_table(self, table_name, schema_name,source):
        query = """
        INSERT INTO public.processed_tables_tracker 
        (table_name, schema_name, processed_date, is_active,user_id,source)
        VALUES (%s, %s, CURRENT_TIMESTAMP, false,%s,%s)
        ON CONFLICT (table_name, user_id) 
        DO UPDATE SET processed_date = CURRENT_TIMESTAMP;
        """

        with get_cursor() as cursor:
            cursor.execute(query, (table_name, schema_name,self.user_id, source ) )
        
    def add_processing_time(self,table_name,execution_time):
        query="""
        update public.processed_tables_tracker
        set time_taken=%s
        where table_name=%s and user_id=%s
        """

        with get_cursor() as cursor:
            cursor.execute(query, (execution_time, table_name,self.user_id) )

          

    def mark_table_active(self, table_name, schema_name):
        query = """
        UPDATE public.processed_tables_tracker 
        SET is_active = true 
        WHERE table_name = %s AND schema_name = %s;
        """
        self.cur.execute(query, (table_name, schema_name))
        self.data_source_obj.commit()