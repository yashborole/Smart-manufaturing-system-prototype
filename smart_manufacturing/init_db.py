"""
Database Initialization & Auto-Bootstrap Script
=================================================
Ensures database tables exist and seeds default admin user + demo plants
if the database is fresh. Safe to run multiple times (idempotent).
"""

import os
import sys
from dotenv import load_dotenv

# Load environment variables (from script dir or cwd)
_env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")
if os.path.exists(_env_path):
    load_dotenv(_env_path)
else:
    load_dotenv()

# Ensure current directory is in sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import engine, SessionLocal, Base
from app.models import User, Plant, Machine, Production, ActivityLog, Alert
from app.core.security import get_password_hash


def init_db():
    print("=" * 60)
    print("  Smart Manufacturing MES — Database Initializer")
    print("=" * 60)

    # 1. Create tables & migrate new columns
    print("Creating database schema if not present...")
    Base.metadata.create_all(bind=engine)

    from sqlalchemy import text
    with engine.connect() as conn:
        try:
            conn.execute(text("ALTER TABLE jobs ADD COLUMN IF NOT EXISTS scheduled_start_at TIMESTAMP WITH TIME ZONE;"))
            conn.execute(text("ALTER TABLE jobs ADD COLUMN IF NOT EXISTS scheduled_end_at TIMESTAMP WITH TIME ZONE;"))
            conn.execute(text("ALTER TABLE jobs ADD COLUMN IF NOT EXISTS estimated_duration_min INTEGER;"))
            conn.commit()
        except Exception as err:
            print(f"Column migration notice: {err}")

    print("Database tables verified.")

    db = SessionLocal()
    try:
        admin_username = os.getenv("ADMIN_USERNAME", "admin")
        admin_email = os.getenv("ADMIN_EMAIL", "admin@smartmes.com")
        admin_password = os.getenv("ADMIN_PASSWORD", "admin123")

        admin_user = None
        if admin_username and admin_password:
            admin_user = db.query(User).filter(User.name == admin_username).first()
            if not admin_user:
                print(f"Creating default admin user '{admin_username}'...")
                admin_user = User(
                    name=admin_username,
                    email=admin_email,
                    hashed_password=get_password_hash(admin_password),
                )
                db.add(admin_user)
                db.commit()
                db.refresh(admin_user)
                print(f"Admin user '{admin_username}' created successfully.")
            else:
                print(f"Admin user '{admin_username}' already exists.")
        else:
            print("Notice: ADMIN_USERNAME or ADMIN_PASSWORD not configured in environment. Skipping admin seed.")

        # 3. Check / Create Demo User (for public demo access)
        demo_user = db.query(User).filter(User.name == "demo_user").first()
        if not demo_user:
            demo_user = User(
                name="demo_user",
                email="demo@smartmes.com",
                hashed_password=get_password_hash("demo123"),
            )
            db.add(demo_user)
            db.commit()
            db.refresh(demo_user)
            print("Demo user 'demo_user' created successfully.")

        # 4. Check / Create Default Plants & Demo Machines if none exist
        plant_count = db.query(Plant).count()
        if plant_count == 0:
            print("No plants found. Seeding initial manufacturing plants...")
            p1 = Plant(name="Mumbai Plant", description="Main production facility", location="Mumbai, Maharashtra")
            p2 = Plant(name="Pune Plant", description="Secondary assembly unit", location="Pune, Maharashtra")
            db.add_all([p1, p2])
            db.commit()
            db.refresh(p1)
            db.refresh(p2)

            # Assign admin user to plants if created
            if admin_user:
                if admin_user not in p1.users:
                    p1.users.append(admin_user)
                if admin_user not in p2.users:
                    p2.users.append(admin_user)
                db.commit()

            # Ensure demo user is assigned strictly to Mumbai Plant
            if demo_user:
                p1.users.append(demo_user)
                db.commit()

            # Add demo machines to Mumbai Plant
            m1 = Machine(name="CNC Milling 01", machine_type="CNC", status="Running", plant_id=p1.id)
            m2 = Machine(name="Precision Lathe 01", machine_type="Lathe", status="Running", plant_id=p1.id)
            m3 = Machine(name="Robotic Welding 01", machine_type="Welding", status="Idle", plant_id=p1.id)
            m4 = Machine(name="Drill Press 01", machine_type="Drill Press", status="Stopped", plant_id=p1.id)
            m5 = Machine(name="Assembly Station 01", machine_type="Assembly", status="Running", plant_id=p1.id)
            m6 = Machine(name="Automated Packaging 01", machine_type="Packaging", status="Idle", plant_id=p1.id)
            m7 = Machine(name="Quality Control Station 01", machine_type="QC Station", status="Running", plant_id=p1.id)

            # Add demo machines to Pune Plant
            pune_m1 = Machine(name="CNC Machine 02", machine_type="CNC", status="Running", plant_id=p2.id)
            pune_m2 = Machine(name="Assembly Line 02", machine_type="Assembly", status="Idle", plant_id=p2.id)

            db.add_all([m1, m2, m3, m4, m5, m6, m7, pune_m1, pune_m2])
            db.commit()

            # Add initial alert & activity log
            alert = Alert(
                message="Plant initialization complete. Systems operational.",
                severity="info",
                is_active=True,
                plant_id=p1.id
            )
            act = ActivityLog(
                event="Smart Manufacturing MES plant environment initialized",
                status="Running",
                plant_id=p1.id
            )
            db.add_all([alert, act])
            db.commit()
            print("Initial plants and machines created successfully.")
        else:
            print(f"Found {plant_count} existing plant(s). Skipping demo seed.")

            # If plants already exist, ensure demo_user is linked to Mumbai Plant
            if demo_user:
                mumbai_plant = db.query(Plant).filter(Plant.name == "Mumbai Plant").first()
                if mumbai_plant and demo_user not in mumbai_plant.users:
                    mumbai_plant.users.append(demo_user)
                    db.commit()

    except Exception as e:
        db.rollback()
        print(f"Database bootstrap error: {e}")
        raise
    finally:
        db.close()

    print("Database ready for deployment.")


if __name__ == "__main__":
    init_db()
