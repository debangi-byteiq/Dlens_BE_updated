from fastapi import Depends, FastAPI, APIRouter, WebSocket, BackgroundTasks, WebSocketDisconnect
from enum import Enum
from typing import Dict, Set, Optional
from datetime import datetime
import uuid
import asyncio
from pydantic import BaseModel
from app.auth.user import get_current_user_id
from app.core.Taskmanager import TaskManager, TaskStatus
from services.main.main import Main
from services.main.source_cred import DataFetcher


task_manager = TaskManager()
router = APIRouter()

async def run_script_task(task_id: str, save: str,user_id:int):
    """
    Background task to run the script logic with progress updates.
    """
    try:
        await task_manager.update_task(
            task_id, 
            TaskStatus.RUNNING, 
            "Fetching data configuration", 
            0.0001
        )
        start_time=datetime.now()
        DataFetcher_obj=DataFetcher(user_id)
        a = await DataFetcher_obj.refresh_data()
        print(f"Data fetched: {a}")
        
        await task_manager.update_task(
            task_id,
            TaskStatus.RUNNING,
            "Initializing data source",
            0.002
        )
        
        db_type = a.get("text", "RDBMS")    
        data_source_type = "csv" if db_type == "csv" else "RDBMS"
        main_obj = Main(user_id,data_source_type,task_manager,task_id,start_time)
        
        await task_manager.update_task(
            task_id,
            TaskStatus.RUNNING,
            "Initializing main process",
            0.003
        )
        
        await main_obj.initialize()
        
        await task_manager.update_task(
            task_id,
            TaskStatus.RUNNING,
            "Processing data",
            0.02
        )
        
        
        await asyncio.to_thread(main_obj.run, save=save)
        
        await task_manager.update_task(
            task_id,
            TaskStatus.COMPLETED,
            "Task completed successfully",
            1.0
        )
        
    except Exception as e:
        print(f"Task failed: {e}")
        await task_manager.update_task(
            task_id,
            TaskStatus.FAILED,
            f"Task failed: {str(e)}",
            None
        )

@router.post("/run-script")
async def run_script(background_tasks: BackgroundTasks, save: str = "Destination",user_id:int=Depends(get_current_user_id)):
    """
    Endpoint to trigger script execution in the background.
    """
    task_id = str(uuid.uuid4())
    await task_manager.create_task(task_id)
    background_tasks.add_task(run_script_task, task_id, save,user_id)
    return {
        "status": "accepted",
        "task_id": task_id,
        "message": f"Script execution started with save='{save}'"
    }

@router.websocket("/ws/{task_id}")
async def websocket_endpoint(websocket: WebSocket, task_id: str):
    """
    WebSocket endpoint for real-time task status updates.
    """
    try:
        if task_id not in task_manager.tasks:
            await websocket.close(code=1008, reason="Task ID not found")
            return

        await websocket.accept()
        await task_manager.register_client(task_id, websocket)
        
        
        if task_id in task_manager.tasks:
            await task_manager.notify_clients(task_id)
     
        while True:
            try:

                data = await websocket.receive_text()
            except WebSocketDisconnect:
                break
            
    except Exception as e:
        print(f"WebSocket error: {e}")
    finally:
        await task_manager.remove_client(task_id, websocket)

@router.get("/task/{task_id}")
async def get_task_status(task_id: str):
    """
    Endpoint to get current task status without WebSocket connection.
    """
    if task_id in task_manager.tasks:
        task_info = task_manager.tasks[task_id]
        return {
            "task_id": task_id,
            "status": task_info.status.value,
            "message": task_info.message,
            "progress": task_info.progress,
            "start_time": task_info.start_time.isoformat(),
            "end_time": task_info.end_time.isoformat() if task_info.end_time else None
        }
    return {"error": "Task not found"}