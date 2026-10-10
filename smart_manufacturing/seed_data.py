"""
Seed Script - Populates the database with dummy data for testing.
Creates: 2 Plants, Machines, Production records, Activity logs, Alerts.
Also assigns User ID 1 to both plants.

Usage: python seed_data.py
"""

import sys
import os
from datetime import datetime, timedelta
import random
from typing import Any

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal
from app.models import Plant, Machine, Production, ActivityLog, Alert, User, Job, MachineLog


def seed():
    db = SessionLocal()

    try:
        # ---- Clean up old data to ensure fresh seed ----
        print("Cleaning up old database records (alerts, logs, productions, machines, plant assignments)...")
        # Clear foreign key references on machines first
        db.query(Machine).update({"current_job_id": None})
        db.commit()

        db.query(MachineLog).delete()
        db.query(Job).delete()
        db.query(Alert).delete()
        db.query(ActivityLog).delete()
        db.query(Production).delete()
        db.query(Machine).delete()
        
        # Clear plant assignments from all users
        for user in db.query(User).all():
            user.plants = []
        db.commit()
            
        db.query(Plant).delete()
        db.commit()
        print("Database cleaned.")

        # ---- 1. Create Plants ----
        plant1 = Plant(name="Mumbai Plant", description="Main production facility", location="Mumbai, Maharashtra")
        plant2 = Plant(name="Pune Plant", description="Secondary assembly unit", location="Pune, Maharashtra")
        db.add_all([plant1, plant2])
        db.commit()
        db.refresh(plant1)
        db.refresh(plant2)
        print(f"Created plants: {plant1.name} (id={plant1.id}), {plant2.name} (id={plant2.id})")

        # ---- 2. Assign User ID 1 to both plants ----
        user = db.query(User).filter(User.id == 1).first()
        if user:
            user.plants.append(plant1)
            user.plants.append(plant2)
            db.commit()
            print(f"Assigned '{user.name}' to both plants")
        else:
            print("No user with ID 1 found. Skipping user-plant assignment.")

        machines_data = [
            # Mumbai Plant machines
            {"name": "CNC Machine 1", "machine_type": "CNC", "status": "Running", "plant_id": plant1.id},
            {"name": "CNC Machine 2", "machine_type": "CNC", "status": "Running", "plant_id": plant1.id},
            {"name": "Lathe Machine 1", "machine_type": "Lathe", "status": "Running", "plant_id": plant1.id},
            {"name": "Drill Press 1", "machine_type": "Drill", "status": "Stopped", "plant_id": plant1.id},
            {"name": "Welding Unit 1", "machine_type": "Welding", "status": "Maintenance", "plant_id": plant1.id},
            {"name": "Assembly Line 1", "machine_type": "Assembly", "status": "Running", "plant_id": plant1.id},
            # Pune Plant machines
            {"name": "CNC Machine A", "machine_type": "CNC", "status": "Running", "plant_id": plant2.id},
            {"name": "Lathe Machine A", "machine_type": "Lathe", "status": "Running", "plant_id": plant2.id},
            {"name": "Packaging Unit 1", "machine_type": "Packaging", "status": "Running", "plant_id": plant2.id},
            {"name": "Drill Press A", "machine_type": "Drill", "status": "Maintenance", "plant_id": plant2.id},
            {"name": "Quality Check Station", "machine_type": "QC", "status": "Stopped", "plant_id": plant2.id},
        ]

        machines = []
        for m in machines_data:
            machine = Machine(**m)
            machines.append(machine)
            db.add(machine)
        db.commit()
        for m in machines:
            db.refresh(m)
        print(f"Created {len(machines)} machines")

    
        now = datetime.now()
        production_count = 0
        for machine in machines:
            for day_offset in range(7):
                date = now - timedelta(days=day_offset)
                units = random.randint(50, 300) if machine.status != "Stopped" else random.randint(0, 20)
                target = random.randint(200, 350)
                prod = Production(
                    units_produced=units,
                    target_units=target,
                    date=date,
                    plant_id=machine.plant_id,
                    machine_id=machine.id,
                )
                db.add(prod)
                production_count += 1
        db.commit()
        print(f"Created {production_count} production records")

        activities_mumbai = [
            {"event": "CNC Machine 1 started", "status": "Running", "plant_id": plant1.id},
            {"event": "Production batch #127 completed", "status": "Completed", "plant_id": plant1.id},
            {"event": "Welding Unit 1 scheduled maintenance", "status": "Maintenance", "plant_id": plant1.id},
            {"event": "Shift handover - Morning to Afternoon", "status": "Completed", "plant_id": plant1.id},
            {"event": "Drill Press 1 stopped - coolant refill", "status": "Stopped", "plant_id": plant1.id},
            {"event": "Quality check passed - Batch #126", "status": "Completed", "plant_id": plant1.id},
            {"event": "Assembly Line 1 started", "status": "Running", "plant_id": plant1.id},
            {"event": "CNC Machine 2 calibration done", "status": "Completed", "plant_id": plant1.id},
        ]

        activities_pune = [
            {"event": "CNC Machine A started", "status": "Running", "plant_id": plant2.id},
            {"event": "Packaging Unit 1 running", "status": "Running", "plant_id": plant2.id},
            {"event": "Drill Press A under maintenance", "status": "Maintenance", "plant_id": plant2.id},
            {"event": "Production batch #45 completed", "status": "Completed", "plant_id": plant2.id},
            {"event": "Quality check failed - Batch #44", "status": "Stopped", "plant_id": plant2.id},
            {"event": "Lathe Machine A started", "status": "Running", "plant_id": plant2.id},
        ]

        all_activities: list[dict] = activities_mumbai + activities_pune
        for i, act in enumerate(all_activities):
            act["timestamp"] = now - timedelta(minutes=i * 30)
            db.add(ActivityLog(**act))
        db.commit()
        print(f"Created {len(all_activities)} activity logs")

        # ---- 6. Create Alerts ----
        alerts_data = [
            {"message": "Welding Unit 1 temperature exceeding threshold", "severity": "critical", "is_active": True, "plant_id": plant1.id},
            {"message": "Drill Press 1 coolant level low", "severity": "warning", "is_active": True, "plant_id": plant1.id},
            {"message": "CNC Machine 2 vibration sensor alert", "severity": "info", "is_active": True, "plant_id": plant1.id},
            {"message": "Drill Press A bearing wear detected", "severity": "warning", "is_active": True, "plant_id": plant2.id},
            {"message": "Quality Check Station calibration overdue", "severity": "critical", "is_active": True, "plant_id": plant2.id},
        ]

        for alert in alerts_data:
            db.add(Alert(**alert))
        db.commit()
        print(f"Created {len(alerts_data)} alerts")

        print("\nSeed data complete!")
        print(f"   Mumbai Plant: 6 machines, activities, 3 alerts")
        print(f"   Pune Plant: 5 machines, activities, 2 alerts")

    except Exception as e:
        db.rollback()
        print(f"Error: {e}")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
