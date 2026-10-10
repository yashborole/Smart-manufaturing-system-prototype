from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class UserCreate(BaseModel):
    name: str
    email: str

class PlantBase(BaseModel):
    name: str
    description: Optional[str] = None
    location: Optional[str] = None

class PlantCreate(PlantBase):
    pass

class PlantResponse(PlantBase):
    id: int
    created_at: datetime

    model_config = {"from_attributes": True}

class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    created_at: datetime
    plants: list[PlantResponse] = []

    model_config = {"from_attributes": True}


# --- Machine Schemas ---

class MachineResponse(BaseModel):
    id: int
    name: str
    machine_type: Optional[str] = None
    status: str
    plant_id: int
    created_at: datetime

    model_config = {"from_attributes": True}


# --- Dashboard Schemas ---

class DashboardKPI(BaseModel):
    total_production: int
    active_machines: int
    total_machines: int
    efficiency: float
    active_alerts: int
    downtime_machines: int

class ActivityLogResponse(BaseModel):
    id: int
    event: str
    status: str
    timestamp: datetime

    model_config = {"from_attributes": True}

class AlertResponse(BaseModel):
    id: int
    message: str
    severity: str
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}

class MachineInsight(BaseModel):
    id: int
    name: str
    machine_type: Optional[str] = None
    status: str
    total_produced: int
    target_units: int
    efficiency: float

    model_config = {"from_attributes": True}


# --- Job Schemas ---

class JobCreate(BaseModel):
    title: str
    part_name: str
    target_qty: int
    priority: Optional[str] = "Normal"
    machine_id: int
    plant_id: int
    scheduled_start_at: Optional[datetime] = None
    estimated_duration_min: Optional[int] = None

class JobScheduleRequest(BaseModel):
    scheduled_start_at: datetime
    estimated_duration_min: Optional[int] = 60

class JobResponse(BaseModel):
    id: int
    title: str
    part_name: str
    target_qty: int
    priority: str
    status: str
    units_produced: int
    machine_id: int
    plant_id: int
    scheduled_start_at: Optional[datetime] = None
    scheduled_end_at: Optional[datetime] = None
    estimated_duration_min: Optional[int] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    created_at: datetime

    model_config = {"from_attributes": True}

class JobComplete(BaseModel):
    units_produced: int

class JobProduce(BaseModel):
    count: Optional[int] = 1

# --- MachineLog Schemas ---

class MachineLogResponse(BaseModel):
    id: int
    machine_id: int
    job_id: Optional[int] = None
    status: str
    units_produced: int
    note: Optional[str] = None
    timestamp: datetime

    model_config = {"from_attributes": True}

# --- Machine Status Update ---

class MachineStatusUpdate(BaseModel):
    status: str  # Idle, Stopped, Down
    note: Optional[str] = None

# --- Kiosk Machine Overview ---

class KioskMachineResponse(BaseModel):
    id: int
    name: str
    machine_type: Optional[str] = None
    status: str
    current_job_id: Optional[int] = None
    current_job_title: Optional[str] = None
    current_job_part: Optional[str] = None
    current_job_target: Optional[int] = None
    current_job_produced: Optional[int] = None
    pending_jobs: int
    scheduled_jobs: Optional[int] = 0

    model_config = {"from_attributes": True}