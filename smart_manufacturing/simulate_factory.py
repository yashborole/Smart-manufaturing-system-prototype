"""
Factory Floor Simulator
=======================
Simulates real-time machine activity:
  - units_produced  (increments each cycle for running machines)
  - rejected_qty    (QC failures, % based on machine health)
  - defect_qty      (subset of rejected needing rework)
  - oee_score       (Availability × Performance × Quality)
  - defect_type     (machine-type specific fault codes)
  - machine status changes (Running → Maintenance → Running)
  - activity logs and alerts triggered by thresholds

Run: python simulate_factory.py
"""

import sys
import os
import time
import random
from datetime import datetime, date

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal
from app.models import Machine, Production, ActivityLog, Alert

# ─────────────────────────────────────────────
# CONFIG
# ─────────────────────────────────────────────
TICK_INTERVAL_SEC = 5       # Simulator runs every N seconds
TOOL_WEAR_PER_TICK = 3.0    # % tool wears per running tick
TOOL_WEAR_THRESHOLD = 80.0  # % → raise warning alert
TOOL_WEAR_CRITICAL = 95.0   # % → force maintenance
REPAIR_TICKS = 4            # Ticks spent in maintenance before returning to Running

# Units produced per tick per machine type
UNITS_PER_TICK = {
    "CNC":       random.randint(8, 18),
    "Lathe":     random.randint(6, 14),
    "Welding":   random.randint(4, 10),
    "Drill":     random.randint(10, 20),
    "Assembly":  random.randint(3, 8),
    "Packaging": random.randint(20, 40),
    "QC":        random.randint(5, 12),
    "General":   random.randint(5, 15),
}

# Defect types per machine type
DEFECT_TYPES = {
    "CNC":       ["Dimensional Error", "Surface Finish Defect", "Overcut", "Tool Mark"],
    "Lathe":     ["Chatter Marks", "Wrong Diameter", "Rough Surface", "Taper Error"],
    "Welding":   ["Incomplete Fusion", "Porosity", "Crack", "Undercut"],
    "Drill":     ["Misaligned Hole", "Burrs", "Wrong Depth", "Drill Breakage"],
    "Assembly":  ["Missing Component", "Wrong Orientation", "Loose Fastener"],
    "Packaging": ["Seal Failure", "Wrong Label", "Under-weight Pack"],
    "QC":        ["False Reject", "Missed Defect", "Calibration Error"],
    "General":   ["Surface Defect", "Dimensional Error", "Material Fault"],
}

# ─────────────────────────────────────────────
# MACHINE STATE TRACKING (in-memory)
# ─────────────────────────────────────────────
machine_state = {}  # { machine_id: { tool_wear, repair_ticks_remaining } }


def get_defect_type(machine_type: str) -> str:
    types = DEFECT_TYPES.get(machine_type, DEFECT_TYPES["General"])
    return random.choice(types)


def get_units_this_tick(machine_type: str) -> int:
    return UNITS_PER_TICK.get(machine_type, random.randint(5, 15))


def calculate_oee(produced: int, target: int, rejected: int) -> float:
    """
    OEE = Performance × Quality
    Performance = produced / target
    Quality = good_parts / produced
    """
    if target <= 0 or produced <= 0:
        return 0.0
    performance = min(produced / target, 1.0)
    good_parts = max(produced - rejected, 0)
    quality = good_parts / produced
    oee = round(performance * quality * 100, 1)
    return oee


def get_or_create_today_production(db, machine: Machine) -> Production:
    """Get or create today's production record for this machine."""
    today_start = datetime.combine(date.today(), datetime.min.time())
    prod = db.query(Production).filter(
        Production.machine_id == machine.id,
        Production.date >= today_start
    ).first()

    if not prod:
        target = random.randint(200, 350)
        prod = Production(
            machine_id=machine.id,
            plant_id=machine.plant_id,
            units_produced=0,
            target_units=target,
            rejected_qty=0,
            defect_qty=0,
            oee_score=0.0,
            defect_type=None,
            date=datetime.now(),
        )
        db.add(prod)
        db.commit()
        db.refresh(prod)
    return prod


def log_activity(db, machine: Machine, event: str, status: str):
    log = ActivityLog(
        event=event,
        status=status,
        plant_id=machine.plant_id,
        timestamp=datetime.now(),
    )
    db.add(log)
    db.commit()


def raise_alert(db, machine: Machine, message: str, severity: str):
    # Avoid duplicate active alerts for same message
    existing = db.query(Alert).filter(
        Alert.plant_id == machine.plant_id,
        Alert.message == message,
        Alert.is_active == True
    ).first()
    if not existing:
        alert = Alert(
            message=message,
            severity=severity,
            is_active=True,
            plant_id=machine.plant_id,
            created_at=datetime.now(),
        )
        db.add(alert)
        db.commit()


def clear_machine_alerts(db, machine: Machine):
    """Resolve all active alerts that mention this machine."""
    alerts = db.query(Alert).filter(
        Alert.plant_id == machine.plant_id,
        Alert.is_active == True
    ).all()
    for alert in alerts:
        if machine.name.lower() in alert.message.lower():
            alert.is_active = False
    db.commit()


def simulate_tick():
    # ── Job Scheduler: Auto-dispatch due scheduled jobs ──────────────
    try:
        from app.db_ops.kiosk import dispatch_due_scheduled_jobs
        dispatch_due_scheduled_jobs()
    except Exception as se:
        print(f"  [SCHEDULER] Dispatch check notice: {se}")

    db = SessionLocal()
    try:
        machines = db.query(Machine).all()
        print(f"\n[{datetime.now().strftime('%H:%M:%S')}] === Simulation Tick ===")

        for machine in machines:
            mtype = machine.machine_type or "General"

            # Initialize state for new machines
            if machine.id not in machine_state:
                machine_state[machine.id] = {
                    "tool_wear": random.uniform(10.0, 40.0),
                    "repair_ticks_remaining": 0,
                }

            state = machine_state[machine.id]

            # ── MAINTENANCE state ──────────────────────────────────────────
            if machine.status == "Maintenance":
                state["repair_ticks_remaining"] -= 1
                print(f"  [{machine.name}] MAINTENANCE — {state['repair_ticks_remaining']} ticks left")

                if state["repair_ticks_remaining"] <= 0:
                    # Service complete → return to Running
                    state["tool_wear"] = random.uniform(5.0, 15.0)
                    machine.status = "Running"
                    db.commit()
                    clear_machine_alerts(db, machine)
                    log_activity(db, machine,
                        f"{machine.name} service complete — returned to production",
                        "Running")
                    print(f"  [{machine.name}] REPAIRED → Running")
                continue

            # ── STOPPED state ──────────────────────────────────────────────
            if machine.status == "Stopped":
                # Small chance to self-recover (operator restart simulation)
                if random.random() < 0.25:
                    machine.status = "Running"
                    state["tool_wear"] = random.uniform(10.0, 30.0)
                    db.commit()
                    clear_machine_alerts(db, machine)
                    log_activity(db, machine,
                        f"{machine.name} restarted by operator",
                        "Running")
                    print(f"  [{machine.name}] RESTARTED → Running")
                else:
                    print(f"  [{machine.name}] STOPPED — waiting for restart")
                continue

            # ── RUNNING state ──────────────────────────────────────────────
            prod = get_or_create_today_production(db, machine)

            # Units produced this tick
            units_this_tick = get_units_this_tick(mtype)

            # Reject rate increases as tool wears (1% base → 12% at max wear)
            base_reject_rate = 0.01 + (state["tool_wear"] / 100) * 0.12
            reject_rate = min(base_reject_rate + random.uniform(-0.01, 0.02), 0.20)

            rejected_this_tick = max(0, int(units_this_tick * reject_rate))
            # Defect qty = subset of rejected (30–70% need rework vs scrap)
            defect_this_tick = max(0, int(rejected_this_tick * random.uniform(0.3, 0.7)))

            # Determine defect type if any rejections
            defect_type_this_tick = get_defect_type(mtype) if rejected_this_tick > 0 else None

            # Update cumulative totals
            new_produced = prod.units_produced + units_this_tick
            new_rejected = (prod.rejected_qty or 0) + rejected_this_tick
            new_defects  = (prod.defect_qty or 0) + defect_this_tick

            # OEE score
            oee = calculate_oee(new_produced, prod.target_units, new_rejected)

            prod.units_produced = new_produced
            prod.rejected_qty   = new_rejected
            prod.defect_qty     = new_defects
            prod.oee_score      = oee
            if defect_type_this_tick:
                prod.defect_type = defect_type_this_tick

            # Advance tool wear
            state["tool_wear"] = min(state["tool_wear"] + TOOL_WEAR_PER_TICK, 100.0)

            # ── Alert: High reject rate ────────────────────────────────────
            if rejected_this_tick > 0 and reject_rate > 0.08:
                raise_alert(db, machine,
                    f"{machine.name} reject rate high — {rejected_this_tick} parts rejected ({defect_type_this_tick or 'Unknown defect'})",
                    "warning")

            # ── Alert: Tool wear warning ───────────────────────────────────
            if state["tool_wear"] >= TOOL_WEAR_THRESHOLD and state["tool_wear"] < TOOL_WEAR_CRITICAL:
                raise_alert(db, machine,
                    f"{machine.name} tool wear at {state['tool_wear']:.0f}% — schedule maintenance",
                    "warning")

            # ── Alert: Tool wear critical → force maintenance ──────────────
            if state["tool_wear"] >= TOOL_WEAR_CRITICAL:
                machine.status = "Maintenance"
                state["repair_ticks_remaining"] = REPAIR_TICKS
                db.commit()
                raise_alert(db, machine,
                    f"{machine.name} tool life expired — forced into maintenance",
                    "critical")
                log_activity(db, machine,
                    f"{machine.name} stopped — tool wear {state['tool_wear']:.0f}%, scheduled for service",
                    "Maintenance")
                print(f"  [{machine.name}] CRITICAL WEAR → Maintenance")
                continue

            # ── Random unplanned stop (low probability, 3%) ────────────────
            if random.random() < 0.03:
                machine.status = "Stopped"
                db.commit()
                raise_alert(db, machine,
                    f"{machine.name} stopped unexpectedly — operator intervention required",
                    "critical")
                log_activity(db, machine,
                    f"{machine.name} stopped — unplanned fault detected",
                    "Stopped")
                print(f"  [{machine.name}] UNPLANNED STOP")
                continue

            db.commit()
            print(
                f"  [{machine.name}] produced={units_this_tick} "
                f"| rejected={rejected_this_tick} | defects={defect_this_tick} "
                f"| OEE={oee}% | tool_wear={state['tool_wear']:.1f}%"
                + (f" | defect_type={defect_type_this_tick}" if defect_type_this_tick else "")
            )

    except Exception as e:
        print(f"[ERROR] Simulation tick failed: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    print("=" * 60)
    print("  Smart MES — Factory Floor Simulator")
    print(f"  Tick interval: {TICK_INTERVAL_SEC} seconds")
    print("  Press Ctrl+C to stop")
    print("=" * 60)

    try:
        while True:
            simulate_tick()
            time.sleep(TICK_INTERVAL_SEC)
    except KeyboardInterrupt:
        print("\nSimulator stopped.")
