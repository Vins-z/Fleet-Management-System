import os
import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, scoped_session
from contextlib import contextmanager
from models.models import Base, Vehicle, Driver, Task, RouteLog, MaintenanceLog, FuelLog

logger = logging.getLogger(__name__)

# Configurable Database URL. Supports PostgreSQL via DATABASE_URL or defaults to local SQLite
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    db_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "fleet.db"))
    DATABASE_URL = f"sqlite:///{db_path}"

# Fix Heroku/older postgres:// URLs to postgresql://
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(
    DATABASE_URL,
    connect_args=connect_args,
    pool_pre_ping=True,
    echo=False
)

SessionLocal = scoped_session(sessionmaker(autocommit=False, autoflush=False, bind=engine))

@contextmanager
def get_db():
    """
    Context manager providing a transactional database session.
    """
    session = SessionLocal()
    try:
        yield session
        session.commit()
    except Exception as e:
        session.rollback()
        logger.error(f"Database session error: {e}")
        raise
    finally:
        session.close()

def init_db():
    """
    Create all database tables and seed sample operational data if empty.
    """
    logger.info("Initializing database schema...")
    Base.metadata.create_all(bind=engine)
    seed_demo_data()

def seed_demo_data():
    """
    Seed initial operational vehicles, drivers, tasks, and maintenance records.
    """
    with get_db() as session:
        if session.query(Vehicle).count() > 0:
            return  # Already seeded

        logger.info("Seeding initial fleet operational data...")

        # Drivers
        d1 = Driver(name="John Doe", license_number="DL-109283", phone="+1-555-0101", status="On Duty")
        d2 = Driver(name="Jane Smith", license_number="DL-204958", phone="+1-555-0102", status="On Duty")
        d3 = Driver(name="Alex Brown", license_number="DL-384729", phone="+1-555-0103", status="Available")
        d4 = Driver(name="Maria Garcia", license_number="DL-472910", phone="+1-555-0104", status="Available")
        session.add_all([d1, d2, d3, d4])
        session.flush()

        # Vehicles
        v1 = Vehicle(
            vehicle_id="V101",
            name="Delivery Truck Alpha",
            model="Freightliner M2",
            battery_level=88.0,
            fuel_level=75.0,
            latitude=28.7041,
            longitude=77.1025,
            status="Active",
            assigned_driver_id=d1.id
        )
        v2 = Vehicle(
            vehicle_id="V102",
            name="Cargo Van Beta",
            model="Ford Transit",
            battery_level=92.0,
            fuel_level=85.0,
            latitude=28.5355,
            longitude=77.3910,
            status="Active",
            assigned_driver_id=d2.id
        )
        v3 = Vehicle(
            vehicle_id="V103",
            name="Express Sprinter Gamma",
            model="Mercedes Sprinter",
            battery_level=45.0,
            fuel_level=30.0,
            latitude=28.4595,
            longitude=77.0266,
            status="Idle",
            assigned_driver_id=None
        )
        v4 = Vehicle(
            vehicle_id="V104",
            name="Heavy Hauler Delta",
            model="Volvo VNL",
            battery_level=18.0,
            fuel_level=20.0,
            latitude=28.6139,
            longitude=77.2090,
            status="Maintenance Due",
            assigned_driver_id=None
        )
        v5 = Vehicle(
            vehicle_id="V105",
            name="City Courier Epsilon",
            model="Nissan e-NV200",
            battery_level=78.0,
            fuel_level=90.0,
            latitude=28.6500,
            longitude=77.2300,
            status="Active",
            assigned_driver_id=d3.id
        )
        session.add_all([v1, v2, v3, v4, v5])
        session.flush()

        # Tasks
        t1 = Task(
            task_code="T-1001",
            title="Express Parcel Delivery to Sector 18",
            description="High priority delivery requiring refrigerated cargo container.",
            priority=3,
            status="In Progress",
            latitude=28.5670,
            longitude=77.3210,
            assigned_vehicle_id=v2.id,
            assigned_to="Jane Smith",
            due_date="2026-11-15"
        )
        t2 = Task(
            task_code="T-1002",
            title="Warehouse Bulk Restock",
            description="Transfer 4 pallets from Central Hub to West Distribution Center.",
            priority=2,
            status="Pending",
            latitude=28.6800,
            longitude=77.1200,
            assigned_vehicle_id=None,
            assigned_to="Unassigned",
            due_date="2026-11-16"
        )
        t3 = Task(
            task_code="T-1003",
            title="Customer Hardware Return Pickup",
            description="Standard pickup of returned electronics from corporate office.",
            priority=1,
            status="Pending",
            latitude=28.4800,
            longitude=77.0800,
            assigned_vehicle_id=None,
            assigned_to="Unassigned",
            due_date="2026-11-17"
        )
        session.add_all([t1, t2, t3])

        # Maintenance Records
        m1 = MaintenanceLog(
            vehicle_id=v4.id,
            service_type="Brake Pad Replacement & Battery Inspection",
            status="Overdue",
            due_date="2026-11-10",
            notes="Battery level critical (18%). Vehicle flagged as Maintenance Due."
        )
        m2 = MaintenanceLog(
            vehicle_id=v1.id,
            service_type="Scheduled 50,000 km Oil & Filter Change",
            status="Scheduled",
            due_date="2026-11-20",
            notes="Routine engine service."
        )
        session.add_all([m1, m2])

        # Fuel Logs
        f1 = FuelLog(vehicle_id=v1.id, fuel_added_liters=65.0, cost=110.50, odometer_km=48210.0, efficiency_kml=9.2)
        f2 = FuelLog(vehicle_id=v2.id, fuel_added_liters=45.0, cost=78.20, odometer_km=32150.0, efficiency_kml=12.4)
        f3 = FuelLog(vehicle_id=v3.id, fuel_added_liters=50.0, cost=85.00, odometer_km=61200.0, efficiency_kml=8.8)
        session.add_all([f1, f2, f3])

        logger.info("Demo data seeding completed successfully.")
