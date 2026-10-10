from fastapi import APIRouter, HTTPException
from app import schemas
from app.db_ops import kiosk

router = APIRouter(prefix="/kiosk", tags=["Kiosk"])


@router.get("/machines/{plant_id}")
def get_kiosk_machines(plant_id: int):
    try:
        result = kiosk.get_kiosk_machines(plant_id=plant_id)
        if isinstance(result, dict) and "error" in result:
            raise HTTPException(status_code=400, detail=result["error"])
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/jobs", status_code=201)
def create_job(job: schemas.JobCreate):
    try:
        result = kiosk.create_job(job.model_dump())
        if isinstance(result, dict) and "error" in result:
            raise HTTPException(status_code=400, detail=result["error"])
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/jobs/{machine_id}")
def get_jobs(machine_id: int):
    try:
        result = kiosk.get_jobs_for_machine(machine_id=machine_id)
        if isinstance(result, dict) and "error" in result:
            raise HTTPException(status_code=400, detail=result["error"])
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/jobs/{job_id}/run")
def run_job(job_id: int):
    try:
        result = kiosk.run_job(job_id=job_id)
        if isinstance(result, dict) and "error" in result:
            raise HTTPException(status_code=400, detail=result["error"])
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/jobs/{job_id}/complete")
def complete_job(job_id: int, body: schemas.JobComplete):
    try:
        result = kiosk.complete_job(job_id=job_id, units_produced=body.units_produced)
        if isinstance(result, dict) and "error" in result:
            raise HTTPException(status_code=400, detail=result["error"])
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/jobs/{job_id}/produce")
def produce_units(job_id: int, body: schemas.JobProduce = schemas.JobProduce()):
    try:
        count = body.count if body and body.count else 1
        result = kiosk.produce_units(job_id=job_id, count=count)
        if isinstance(result, dict) and "error" in result:
            raise HTTPException(status_code=400, detail=result["error"])
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/jobs/{job_id}/cancel")
def cancel_job(job_id: int):
    try:
        result = kiosk.cancel_job(job_id=job_id)
        if isinstance(result, dict) and "error" in result:
            raise HTTPException(status_code=400, detail=result["error"])
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/machines/{machine_id}/status")
def update_machine_status(machine_id: int, body: schemas.MachineStatusUpdate):
    try:
        result = kiosk.set_machine_status(
            machine_id=machine_id,
            status=body.status,
            note=body.note
        )
        if isinstance(result, dict) and "error" in result:
            raise HTTPException(status_code=400, detail=result["error"])
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/machines/{machine_id}/logs")
def get_machine_logs(machine_id: int, limit: int = 30):
    try:
        result = kiosk.get_machine_logs(machine_id=machine_id, limit=limit)
        if isinstance(result, dict) and "error" in result:
            raise HTTPException(status_code=400, detail=result["error"])
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/jobs/{job_id}/schedule")
def schedule_job(job_id: int, body: schemas.JobScheduleRequest):
    try:
        result = kiosk.schedule_job(
            job_id=job_id,
            scheduled_start_at=body.scheduled_start_at,
            estimated_duration_min=body.estimated_duration_min or 60
        )
        if isinstance(result, dict) and "error" in result:
            raise HTTPException(status_code=400, detail=result["error"])
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/jobs/{job_id}/unschedule")
def unschedule_job(job_id: int):
    try:
        result = kiosk.unschedule_job(job_id=job_id)
        if isinstance(result, dict) and "error" in result:
            raise HTTPException(status_code=400, detail=result["error"])
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/schedule/{plant_id}")
def get_plant_schedule(plant_id: int):
    try:
        result = kiosk.get_plant_schedule(plant_id=plant_id)
        if isinstance(result, dict) and "error" in result:
            raise HTTPException(status_code=400, detail=result["error"])
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/schedule/dispatch")
def auto_dispatch_due_jobs(plant_id: int | None = None):
    try:
        result = kiosk.dispatch_due_scheduled_jobs(plant_id=plant_id)
        if isinstance(result, dict) and "error" in result:
            raise HTTPException(status_code=400, detail=result["error"])
        return {"dispatched": result}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

