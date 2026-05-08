from datetime import datetime
from enum import Enum
from typing import Dict, Optional, Set

from fastapi import WebSocket
from pydantic import BaseModel


class TaskStatus(Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"

class TaskInfo(BaseModel):
    status: TaskStatus
    message: Optional[str] = None
    start_time: datetime
    end_time: Optional[datetime] = None
    progress: Optional[float] = None

class TaskManager:  
    def __init__(self):
        self.tasks: Dict[str, TaskInfo] = {}
        self.active_connections: Dict[str, Set[WebSocket]] = {}
        
    async def create_task(self, task_id: str):
        self.tasks[task_id] = TaskInfo(
            status=TaskStatus.PENDING,
            start_time=datetime.now(),
            message="Task initialized"
        )   
        
    async def update_task(self, task_id: str, status: TaskStatus, message: str = None, 
                         progress: float = None) :
        if task_id in self.tasks:
            task = self.tasks[task_id]
            task.status = status
            if message:
                task.message = message
            if progress:
                task.progress = progress
            if status in [TaskStatus.COMPLETED, TaskStatus.FAILED]:
                task.end_time = datetime.now()
                
            await self.notify_clients(task_id)
            
    async def register_client(self, task_id: str, websocket: WebSocket):
        if task_id not in self.active_connections:
            self.active_connections[task_id] = set()
        self.active_connections[task_id].add(websocket)
        
    async def remove_client(self, task_id: str, websocket: WebSocket)  :
        if task_id in self.active_connections:
            self.active_connections[task_id].remove(websocket)
            if not self.active_connections[task_id]:
                del self.active_connections[task_id]
                
    async def notify_clients(self, task_id: str) :   
        if task_id in self.active_connections:
            task_info = self.tasks[task_id]
            message = {
                "task_id": task_id,
                "status": task_info.status.value,
                "message": task_info.message,
                "progress": task_info.progress,
                "start_time": task_info.start_time.isoformat(),
                "end_time": task_info.end_time.isoformat() if task_info.end_time else None
            }
            
            disconnected_clients = set()
            for websocket in self.active_connections[task_id]:
                try:
                    await websocket.send_json(message)
                except Exception as e:
                    print(f"Failed to send message to client: {e}")
                    disconnected_clients.add(websocket)
                    
          
            for websocket in disconnected_clients:
                await self.remove_client(task_id, websocket)