from fastapi import APIRouter, Depends,Path,UploadFile,File,Form
from dotenv import load_dotenv
from typing import Optional
import os
import datetime
from app.auth.user import get_current_user_id
from app.core.mongo_db import source_collection

load_dotenv('.env')

router=APIRouter()

UPLOAD_DIRECTORY=os.getenv('UPLOAD_DIRECTORY')
os.makedirs(UPLOAD_DIRECTORY, exist_ok=True)

@router.post("/newupload")
async def upload_file(
    file: UploadFile = File(...), 
    datecol: Optional[str] = Form(""), 
    base_months: Optional[str] = Form(""),
    inc_months: Optional[str] = Form(""),
    user_id:int =Depends(get_current_user_id)
):  
    csv_source={}
    csv_source['filename']=file.filename
    csv_source['datecol']=datecol
    csv_source['base_months']=base_months
    csv_source['inc_months']=inc_months
    csv_source['text']='csv'
    csv_source['user_id']=user_id
  

    if file.content_type != 'text/csv':
        return {"error": "Invalid file type. Please upload a CSV file."}

    file_path = os.path.join(UPLOAD_DIRECTORY, file.filename)
    detail={'details':csv_source}
    detail['refreshed_date']=datetime.datetime.now()

    try:
        with open(file_path, "wb") as f:
            f.write(await file.read())

        await source_collection.insert_one(detail)
        return {
            "filename": file.filename,
            "message": "File uploaded and saved successfully!"
        }
    except Exception as e:
        return {"error": f"Failed to save file: {str(e)}"}
