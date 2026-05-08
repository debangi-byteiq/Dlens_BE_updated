from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from typing import Optional
import os
import datetime
from app.auth.user import get_current_user_id
from app.config import settings
from app.core.mongo_db import source_collection

router=APIRouter()

UPLOAD_DIRECTORY=str(settings.upload_directory_path)
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
  

    if file.content_type != 'text/csv' and not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Invalid file type. Please upload a CSV file.")

    file_path = os.path.join(UPLOAD_DIRECTORY, file.filename)
    detail={'details':csv_source}
    detail['refreshed_date']=datetime.datetime.now()

    try:
        with open(file_path, "wb") as f:
            f.write(await file.read())

        result = await source_collection.insert_one(detail)
        return {
            "id": str(result.inserted_id),
            "filename": file.filename,
            "message": "File uploaded and saved successfully!"
        }
    except Exception as e:
        return {"error": f"Failed to save file: {str(e)}"}
