from datetime import datetime, timedelta
from app.database import SessionLocal
from sqlalchemy import text
from typing import Optional


def create_job(job_data: dict):
    db = SessionLocal()
    try:
        scheduled_start = job_data.get("scheduled_start_at")
        estimated_duration = job_data.get("estimated_duration_min")
        scheduled_end = None

        if scheduled_start:
            if isinstance(scheduled_start, str):
                try:
                    scheduled_start = datetime.fromisoformat(scheduled_start.replace("Z", "+00:00"))
                except Exception:
                    pass
            initial_status = "Scheduled"
            if estimated_duration and isinstance(scheduled_start, datetime):
                scheduled_end = scheduled_start + timedelta(minutes=int(estimated_duration))
        else:
            initial_status = "Pending"

        query = text("""
            INSERT INTO jobs (
                title, part_name, target_qty, priority, status, units_produced,
                machine_id, plant_id, scheduled_start_at, scheduled_end_at, estimated_duration_min, created_at
            )
            VALUES (
                :title, :part_name, :target_qty, :priority, :status, 0,
                :machine_id, :plant_id, :scheduled_start, :scheduled_end, :estimated_duration, NOW()
            )
            RETURNING *
        """)
        result = db.execute(query, {
            "title": job_data["title"],
            "part_name": job_data["part_name"],
            "target_qty": job_data["target_qty"],
            "priority": job_data.get("priority", "Normal"),
            "status": initial_status,
            "machine_id": job_data["machine_id"],
            "plant_id": job_data["plant_id"],
            "scheduled_start": scheduled_start,
            "scheduled_end": scheduled_end,
            "estimated_duration": estimated_duration,
        })
        db.commit()
        row = result.mappings().first()
        return dict(row) if row else None
    except Exception as e:
        db.rollback()
        return {"error": str(e)}
    finally:
        db.close()


def get_jobs_for_machine(machine_id: int):
    db = SessionLocal()
    try:
        query = text("""
            SELECT j.*, m.name as machine_name
            FROM jobs j
            JOIN machines m ON j.machine_id = m.id
            WHERE j.machine_id = :machine_id
            ORDER BY 
                CASE j.status
                    WHEN 'Running' THEN 1
                    WHEN 'Scheduled' THEN 2
                    WHEN 'Pending' THEN 3
                    ELSE 4
                END,
                j.scheduled_start_at ASC NULLS LAST,
                CASE j.priority 
                    WHEN 'Urgent' THEN 1
                    WHEN 'High' THEN 2
                    WHEN 'Normal' THEN 3
                    WHEN 'Low' THEN 4
                    ELSE 5
                END,
                j.created_at ASC
        """)
        result = db.execute(query, {"machine_id": machine_id})
        return [dict(row) for row in result.mappings().all()]
    except Exception as e:
        return {"error": str(e)}
    finally:
        db.close()


def run_job(job_id: int):
    db = SessionLocal()
    try:
        job = db.execute(text("SELECT * FROM jobs WHERE id = :job_id"), {"job_id": job_id}).mappings().first()
        if not job:
            return {"error": "Job not found"}

        if job["status"] not in ("Pending", "Scheduled"):
            return {"error": f"Cannot run job with status '{job['status']}'"}

        machine_id = job["machine_id"]
        plant_id = job["plant_id"]

        machine = db.execute(text("SELECT * FROM machines WHERE id = :mid"), {"mid": machine_id}).mappings().first()
        if not machine:
            return {"error": "Machine not found"}
        if machine["status"] == "Running":
            return {"error": "Machine is already running a job. Complete or cancel the current job first."}

        # Update job status to Running
        db.execute(text("""
            UPDATE jobs SET status = 'Running', started_at = NOW()
            WHERE id = :job_id
        """), {"job_id": job_id})

        # Update machine status to Running
        db.execute(text("""
            UPDATE machines SET status = 'Running', current_job_id = :job_id
            WHERE id = :machine_id
        """), {"job_id": job_id, "machine_id": machine_id})

        # Insert machine log entry
        db.execute(text("""
            INSERT INTO machine_logs (machine_id, job_id, status, units_produced, note, timestamp)
            VALUES (:machine_id, :job_id, 'Running', 0, :note, NOW())
        """), {
            "machine_id": machine_id,
            "job_id": job_id,
            "note": f"Job '{job['title']}' started"
        })

        # Insert activity log
        db.execute(text("""
            INSERT INTO activity_logs (event, status, plant_id, timestamp)
            VALUES (:event, 'Running', :plant_id, NOW())
        """), {
            "event": f"{machine['name']} started job: {job['title']} ({job['part_name']})",
            "plant_id": plant_id
        })

        db.commit()
        return {"success": True, "message": f"Job '{job['title']}' is now running on '{machine['name']}'"}
    except Exception as e:
        db.rollback()
        return {"error": str(e)}
    finally:
        db.close()


def complete_job(job_id: int, units_produced: int):
    db = SessionLocal()
    try:
        job = db.execute(text("SELECT * FROM jobs WHERE id = :job_id"), {"job_id": job_id}).mappings().first()
        if not job:
            return {"error": "Job not found"}

        if job["status"] != "Running":
            return {"error": f"Cannot complete job with status '{job['status']}'"}

        machine_id = job["machine_id"]
        plant_id = job["plant_id"]
        machine = db.execute(text("SELECT * FROM machines WHERE id = :mid"), {"mid": machine_id}).mappings().first()
        if not machine:
            return {"error": "Machine not found"}

        # Complete the job
        db.execute(text("""
            UPDATE jobs 
            SET status = 'Completed', units_produced = :units, completed_at = NOW()
            WHERE id = :job_id
        """), {"units": units_produced, "job_id": job_id})

        # Machine goes Idle
        db.execute(text("""
            UPDATE machines SET status = 'Idle', current_job_id = NULL
            WHERE id = :machine_id
        """), {"machine_id": machine_id})

        # Machine log for completion
        db.execute(text("""
            INSERT INTO machine_logs (machine_id, job_id, status, units_produced, note, timestamp)
            VALUES (:machine_id, :job_id, 'Idle', :units, :note, NOW())
        """), {
            "machine_id": machine_id,
            "job_id": job_id,
            "units": units_produced,
            "note": f"Job '{job['title']}' completed. {units_produced}/{job['target_qty']} units produced."
        })

        # Auto-create production record
        target = job["target_qty"]
        rejected = max(0, target - units_produced) if units_produced < target else 0
        oee = round((units_produced / target * 100), 1) if target > 0 else 0.0

        db.execute(text("""
            INSERT INTO productions (units_produced, target_units, rejected_qty, defect_qty, oee_score, defect_type, date, plant_id, machine_id)
            VALUES (:produced, :target, :rejected, 0, :oee, NULL, NOW(), :plant_id, :machine_id)
        """), {
            "produced": units_produced,
            "target": target,
            "rejected": rejected,
            "oee": oee,
            "plant_id": plant_id,
            "machine_id": machine_id
        })

        # Activity log
        db.execute(text("""
            INSERT INTO activity_logs (event, status, plant_id, timestamp)
            VALUES (:event, 'Completed', :plant_id, NOW())
        """), {
            "event": f"{machine['name']} completed job: {job['title']} — {units_produced} units produced (OEE: {oee}%)",
            "plant_id": plant_id
        })

        db.commit()
        return {"success": True, "message": f"Job completed. {units_produced} units recorded.", "oee": oee}
    except Exception as e:
        db.rollback()
        return {"error": str(e)}
    finally:
        db.close()


def produce_units(job_id: int, count: int = 1):
    db = SessionLocal()
    try:
        job = db.execute(text("SELECT * FROM jobs WHERE id = :job_id"), {"job_id": job_id}).mappings().first()
        if not job:
            return {"error": "Job not found"}

        if job["status"] != "Running":
            return {"error": f"Cannot produce units for job with status '{job['status']}'. Job must be Running."}

        target = job["target_qty"]
        current = job["units_produced"]
        new_units = current + max(1, count)

        db.execute(text("""
            UPDATE jobs 
            SET units_produced = :new_units 
            WHERE id = :job_id
        """), {"new_units": new_units, "job_id": job_id})

        db.commit()
        progress = round((new_units / target * 100), 1) if target > 0 else 0.0
        return {
            "success": True,
            "job_id": job_id,
            "units_produced": new_units,
            "target_qty": target,
            "progress_percent": progress,
            "target_reached": new_units >= target
        }
    except Exception as e:
        db.rollback()
        return {"error": str(e)}
    finally:
        db.close()


def cancel_job(job_id: int):
    db = SessionLocal()
    try:
        job = db.execute(text("SELECT * FROM jobs WHERE id = :job_id"), {"job_id": job_id}).mappings().first()
        if not job:
            return {"error": "Job not found"}

        if job["status"] not in ("Pending", "Running"):
            return {"error": f"Cannot cancel job with status '{job['status']}'"}

        machine_id = job["machine_id"]
        plant_id = job["plant_id"]
        machine = db.execute(text("SELECT * FROM machines WHERE id = :mid"), {"mid": machine_id}).mappings().first()
        if not machine:
            return {"error": "Machine not found"}
        was_running = job["status"] == "Running"

        db.execute(text("UPDATE jobs SET status = 'Cancelled' WHERE id = :job_id"), {"job_id": job_id})

        if was_running and machine["current_job_id"] == job_id:
            db.execute(text("""
                UPDATE machines SET status = 'Idle', current_job_id = NULL WHERE id = :machine_id
            """), {"machine_id": machine_id})

            db.execute(text("""
                INSERT INTO machine_logs (machine_id, job_id, status, units_produced, note, timestamp)
                VALUES (:machine_id, :job_id, 'Idle', 0, :note, NOW())
            """), {
                "machine_id": machine_id,
                "job_id": job_id,
                "note": f"Job '{job['title']}' was cancelled."
            })

            db.execute(text("""
                INSERT INTO activity_logs (event, status, plant_id, timestamp)
                VALUES (:event, 'Maintenance', :plant_id, NOW())
            """), {
                "event": f"{machine['name']} — job cancelled: {job['title']}",
                "plant_id": plant_id
            })

        db.commit()
        return {"success": True, "message": "Job cancelled."}
    except Exception as e:
        db.rollback()
        return {"error": str(e)}
    finally:
        db.close()


def set_machine_status(machine_id: int, status: str, note: Optional[str] = None):
    db = SessionLocal()
    try:
        allowed = ("Idle", "Stopped", "Down")
        if status not in allowed:
            return {"error": f"Invalid status. Allowed: {', '.join(allowed)}"}

        machine = db.execute(text("SELECT * FROM machines WHERE id = :mid"), {"mid": machine_id}).mappings().first()
        if not machine:
            return {"error": "Machine not found"}

        if machine["status"] == "Running" and machine["current_job_id"]:
            db.execute(text("UPDATE jobs SET status = 'Cancelled' WHERE id = :jid"), {"jid": machine["current_job_id"]})

        db.execute(text("""
            UPDATE machines SET status = :status, current_job_id = NULL WHERE id = :mid
        """), {"status": status, "mid": machine_id})

        db.execute(text("""
            INSERT INTO machine_logs (machine_id, job_id, status, units_produced, note, timestamp)
            VALUES (:machine_id, NULL, :status, 0, :note, NOW())
        """), {
            "machine_id": machine_id,
            "status": status,
            "note": note or f"Machine manually set to {status}"
        })

        activity_status = "Maintenance" if status in ("Down", "Stopped") else "Running"
        db.execute(text("""
            INSERT INTO activity_logs (event, status, plant_id, timestamp)
            VALUES (:event, :act_status, :plant_id, NOW())
        """), {
            "event": f"{machine['name']} status changed to {status}",
            "act_status": activity_status,
            "plant_id": machine["plant_id"]
        })

        db.commit()
        return {"success": True, "message": f"Machine status set to {status}"}
    except Exception as e:
        db.rollback()
        return {"error": str(e)}
    finally:
        db.close()


def get_machine_logs(machine_id: int, limit: int = 30):
    db = SessionLocal()
    try:
        query = text("""
            SELECT ml.id, ml.machine_id, ml.job_id, ml.status, ml.units_produced, ml.note, ml.timestamp,
                   j.title as job_title, j.part_name
            FROM machine_logs ml
            LEFT JOIN jobs j ON ml.job_id = j.id
            WHERE ml.machine_id = :machine_id
            ORDER BY ml.timestamp DESC
            LIMIT :limit
        """)
        result = db.execute(query, {"machine_id": machine_id, "limit": limit})
        return [dict(row) for row in result.mappings().all()]
    except Exception as e:
        return {"error": str(e)}
    finally:
        db.close()


def get_kiosk_machines(plant_id: int):
    db = SessionLocal()
    try:
        query = text("""
            SELECT 
                m.id, m.name, m.machine_type, m.status, m.current_job_id,
                j.title as current_job_title,
                j.part_name as current_job_part,
                j.target_qty as current_job_target,
                j.units_produced as current_job_produced,
                (SELECT COUNT(*) FROM jobs jj WHERE jj.machine_id = m.id AND jj.status = 'Pending') as pending_jobs,
                (SELECT COUNT(*) FROM jobs jj WHERE jj.machine_id = m.id AND jj.status = 'Scheduled') as scheduled_jobs
            FROM machines m
            LEFT JOIN jobs j ON m.current_job_id = j.id
            WHERE m.plant_id = :plant_id
            ORDER BY m.name
        """)
        result = db.execute(query, {"plant_id": plant_id})
        return [dict(row) for row in result.mappings().all()]
    except Exception as e:
        return {"error": str(e)}
    finally:
        db.close()


def schedule_job(job_id: int, scheduled_start_at, estimated_duration_min: int = 60):
    db = SessionLocal()
    try:
        job = db.execute(text("""
            SELECT j.*, m.name as machine_name 
            FROM jobs j 
            JOIN machines m ON j.machine_id = m.id 
            WHERE j.id = :job_id
        """), {"job_id": job_id}).mappings().first()
        if not job:
            return {"error": "Job not found"}
        if job["status"] in ("Running", "Completed", "Cancelled"):
            return {"error": f"Cannot schedule job with status '{job['status']}'"}

        if isinstance(scheduled_start_at, str):
            try:
                scheduled_start_at = datetime.fromisoformat(scheduled_start_at.replace("Z", "+00:00"))
            except Exception:
                pass

        scheduled_end = None
        if scheduled_start_at and estimated_duration_min and isinstance(scheduled_start_at, datetime):
            scheduled_end = scheduled_start_at + timedelta(minutes=int(estimated_duration_min))

        db.execute(text("""
            UPDATE jobs
            SET status = 'Scheduled',
                scheduled_start_at = :start,
                scheduled_end_at = :end,
                estimated_duration_min = :dur
            WHERE id = :job_id
        """), {
            "start": scheduled_start_at,
            "end": scheduled_end,
            "dur": estimated_duration_min,
            "job_id": job_id,
        })

        db.execute(text("""
            INSERT INTO activity_logs (event, status, plant_id, timestamp)
            VALUES (:event, 'Running', :plant_id, NOW())
        """), {
            "event": f"Job '{job['title']}' scheduled on {job['machine_name']} for {scheduled_start_at}",
            "plant_id": job["plant_id"]
        })

        db.commit()
        updated_job = db.execute(text("SELECT * FROM jobs WHERE id = :job_id"), {"job_id": job_id}).mappings().first()
        return dict(updated_job) if updated_job else {"success": True}
    except Exception as e:
        db.rollback()
        return {"error": str(e)}
    finally:
        db.close()


def unschedule_job(job_id: int):
    db = SessionLocal()
    try:
        job = db.execute(text("""
            SELECT j.*, m.name as machine_name 
            FROM jobs j 
            JOIN machines m ON j.machine_id = m.id 
            WHERE j.id = :job_id
        """), {"job_id": job_id}).mappings().first()
        if not job:
            return {"error": "Job not found"}
        if job["status"] != "Scheduled":
            return {"error": f"Job is not currently scheduled (current status: '{job['status']}')"}

        db.execute(text("""
            UPDATE jobs
            SET status = 'Pending',
                scheduled_start_at = NULL,
                scheduled_end_at = NULL
            WHERE id = :job_id
        """), {"job_id": job_id})

        db.execute(text("""
            INSERT INTO activity_logs (event, status, plant_id, timestamp)
            VALUES (:event, 'Running', :plant_id, NOW())
        """), {
            "event": f"Job '{job['title']}' unscheduled on {job['machine_name']} and returned to Pending queue",
            "plant_id": job["plant_id"]
        })

        db.commit()
        updated_job = db.execute(text("SELECT * FROM jobs WHERE id = :job_id"), {"job_id": job_id}).mappings().first()
        return dict(updated_job) if updated_job else {"success": True}
    except Exception as e:
        db.rollback()
        return {"error": str(e)}
    finally:
        db.close()


def get_plant_schedule(plant_id: int):
    db = SessionLocal()
    try:
        query = text("""
            SELECT 
                j.*, 
                m.name as machine_name,
                m.status as machine_status,
                m.machine_type
            FROM jobs j
            JOIN machines m ON j.machine_id = m.id
            WHERE j.plant_id = :plant_id
              AND j.status IN ('Running', 'Scheduled', 'Pending')
            ORDER BY 
                CASE j.status
                    WHEN 'Running' THEN 1
                    WHEN 'Scheduled' THEN 2
                    WHEN 'Pending' THEN 3
                    ELSE 4
                END,
                j.scheduled_start_at ASC NULLS LAST,
                j.created_at ASC
        """)
        result = db.execute(query, {"plant_id": plant_id})
        return [dict(row) for row in result.mappings().all()]
    except Exception as e:
        return {"error": str(e)}
    finally:
        db.close()


def dispatch_due_scheduled_jobs(plant_id: Optional[int] = None):
    db = SessionLocal()
    dispatched = []
    try:
        sql = """
            SELECT j.id, j.title, j.part_name, j.scheduled_start_at, j.machine_id, j.plant_id,
                   m.name as machine_name, m.status as machine_status
            FROM jobs j
            JOIN machines m ON j.machine_id = m.id
            WHERE j.status = 'Scheduled'
              AND j.scheduled_start_at <= NOW()
        """
        params = {}
        if plant_id:
            sql += " AND j.plant_id = :plant_id"
            params["plant_id"] = plant_id

        sql += " ORDER BY j.scheduled_start_at ASC"

        due_jobs = db.execute(text(sql), params).mappings().all()

        for j in due_jobs:
            m_status = j["machine_status"]
            if m_status in ("Idle", "Stopped"):
                db.close()
                res = run_job(j["id"])
                if isinstance(res, dict) and res.get("success"):
                    dispatched.append({
                        "job_id": j["id"],
                        "title": j["title"],
                        "machine_name": j["machine_name"],
                        "status": "Dispatched"
                    })
                    print(f"[SCHEDULER] Auto-dispatched scheduled job '{j['title']}' on machine '{j['machine_name']}'")
                db = SessionLocal()
            elif m_status == "Running":
                print(f"[SCHEDULER] Due job '{j['title']}' on hold — machine '{j['machine_name']}' is currently busy")
            elif m_status == "Maintenance":
                print(f"[SCHEDULER] Due job '{j['title']}' on hold — machine '{j['machine_name']}' in maintenance")

        return dispatched
    except Exception as e:
        print(f"[SCHEDULER] Error during job dispatch check: {e}")
        return {"error": str(e)}
    finally:
        try:
            db.close()
        except Exception:
            pass
