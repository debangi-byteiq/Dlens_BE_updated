# import asyncio
# from services.main.source_cred import fetch_data

# d=await fetch_data()
# date_col=d["datecol"]
# print(d)
# if(d['text']=='csv'):
#     table_name=d["filename"].split('.')[0]
# else:
#     table_name=d["Table Name"]

# data_config=[{"dataset_name":table_name,"date_col":date_col}]


from services.main.source_cred import DataFetcher

async def fetch_config(user_id):
    data_fetcher_obj=DataFetcher(user_id)
    d = await data_fetcher_obj.fetch_data()
    date_col = d["datecol"]
    print(d)
    if d['text'] == 'csv':
        table_name = d["filename"].split('.')[0].lower()
    else:
        table_name = d["table_name"]

    data_config = [{"dataset_name": table_name, "date_col": date_col}]
    print(data_config)
    return data_config
     
