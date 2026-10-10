from sqlalchemy import Column, Integer, String, DateTime, Float, Boolean, ForeignKey, Table
from sqlalchemy.orm import relationship, Mapped, mapped_column
from sqlalchemy.sql import func
from typing import Optional
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    hashed_password = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    plants = relationship("Plant", secondary="user_plants", back_populates="users")

user_plants = Table(
    "user_plants",
    Base.metadata,
    Column("user_id", Integer, ForeignKey("users.id"), primary_key=True),
    Column("plant_id", Integer, ForeignKey("plants.id"), primary_key=True),
)

class Plant(Base):
    __tablename__ = "plants"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(String(255), nullable=True)
    location = Column(String(100), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    users = relationship("User", secondary="user_plants", back_populates="plants")
    machines = relationship("Machine", back_populates="plant")
    productions = relationship("Production", back_populates="plant")
    activity_logs = relationship("ActivityLog", back_populates="plant")
    alerts = relationship("Alert", back_populates="plant")


class Machine(Base):
    __tablename__ = "machines"

    id = Column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    machine_type: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    status: Mapped[Optional[str]] = mapped_column(String(50), default="Stopped")  # Running, Idle, Stopped, Down
    current_job_id = Column(Integer, ForeignKey("jobs.id", use_alter=True, name="fk_machine_current_job"), nullable=True)
    plant_id = Column(Integer, ForeignKey("plants.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    plant = relationship("Plant", back_populates="machines")
    productions = relationship("Production", back_populates="machine")
    jobs = relationship("Job", back_populates="machine", foreign_keys="Job.machine_id")
    machine_logs = relationship("MachineLog", back_populates="machine")


class Production(Base):
    __tablename__ = "productions"

    id = Column(Integer, primary_key=True, index=True)
    units_produced: Mapped[int] = mapped_column(Integer, default=0)
    target_units: Mapped[int] = mapped_column(Integer, default=0)
    rejected_qty: Mapped[int] = mapped_column(Integer, default=0)      # Parts that failed QC
    defect_qty: Mapped[int] = mapped_column(Integer, default=0)         # Subset of rejected needing rework
    oee_score: Mapped[float] = mapped_column(Float, default=0.0)        # Overall Equipment Effectiveness (0-100)
    defect_type: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)  # e.g. "Dimensional Error"
    date = Column(DateTime(timezone=True), server_default=func.now())
    plant_id = Column(Integer, ForeignKey("plants.id"), nullable=False)
    machine_id = Column(Integer, ForeignKey("machines.id"), nullable=False)

    plant = relationship("Plant", back_populates="productions")
    machine = relationship("Machine", back_populates="productions")


class ActivityLog(Base):
    __tablename__ = "activity_logs"

    id = Column(Integer, primary_key=True, index=True)
    event = Column(String(255), nullable=False)
    status: Mapped[str] = mapped_column(String(50), nullable=False)  # Running, Completed, Maintenance
    plant_id = Column(Integer, ForeignKey("plants.id"), nullable=False)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())

    plant = relationship("Plant", back_populates="activity_logs")


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    message = Column(String(255), nullable=False)
    severity = Column(String(50), default="info")  # info, warning, critical
    is_active = Column(Boolean, default=True)
    plant_id = Column(Integer, ForeignKey("plants.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    plant = relationship("Plant", back_populates="alerts")


class Job(Base):
    __tablename__ = "jobs"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(150), nullable=False)
    part_name = Column(String(150), nullable=False)
    target_qty = Column(Integer, default=0)
    priority = Column(String(20), default="Normal")  # Low, Normal, High, Urgent
    status = Column(String(30), default="Pending")   # Pending, Scheduled, Running, Completed, Cancelled
    units_produced = Column(Integer, default=0)
    machine_id = Column(Integer, ForeignKey("machines.id"), nullable=False)
    plant_id = Column(Integer, ForeignKey("plants.id"), nullable=False)
    scheduled_start_at = Column(DateTime(timezone=True), nullable=True)
    scheduled_end_at = Column(DateTime(timezone=True), nullable=True)
    estimated_duration_min = Column(Integer, nullable=True)
    started_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    machine = relationship("Machine", back_populates="jobs", foreign_keys=[machine_id])
    plant = relationship("Plant")
    machine_logs = relationship("MachineLog", back_populates="job")


class MachineLog(Base):
    __tablename__ = "machine_logs"

    id = Column(Integer, primary_key=True, index=True)
    machine_id = Column(Integer, ForeignKey("machines.id"), nullable=False)
    job_id = Column(Integer, ForeignKey("jobs.id"), nullable=True)
    status = Column(String(50), nullable=False)   # Running, Idle, Stopped, Down
    units_produced = Column(Integer, default=0)
    note = Column(String(255), nullable=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())

    machine = relationship("Machine", back_populates="machine_logs")
    job = relationship("Job", back_populates="machine_logs")