from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()

class Vehicle(Base):
    __tablename__ = 'vehicles'

    id = Column(Integer, primary_key=True, autoincrement=True)
    vehicle_id = Column(String(50), unique=True, nullable=False, index=True)
    name = Column(String(100), nullable=False)
    model = Column(String(100), nullable=True, default="Standard Fleet Vehicle")
    battery_level = Column(Float, nullable=False, default=100.0)  # Percentage 0-100
    fuel_level = Column(Float, nullable=False, default=100.0)     # Percentage 0-100
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    status = Column(String(50), nullable=False, default="Active") # Active, In Use, Maintenance Due, Idle
    assigned_driver_id = Column(Integer, ForeignKey('drivers.id'), nullable=True)

    driver = relationship("Driver", back_populates="vehicles")
    tasks = relationship("Task", back_populates="vehicle")
    maintenance_logs = relationship("MaintenanceLog", back_populates="vehicle", cascade="all, delete-orphan")
    fuel_logs = relationship("FuelLog", back_populates="vehicle", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "vehicle_id": self.vehicle_id,
            "name": self.name,
            "model": self.model,
            "battery_level": self.battery_level,
            "fuel_level": self.fuel_level,
            "latitude": self.latitude,
            "longitude": self.longitude,
            "location": (self.latitude, self.longitude),
            "status": self.status,
            "assigned_driver_id": self.assigned_driver_id,
            "driver_name": self.driver.name if self.driver else None,
        }

    def calculate_distance(self, target_location):
        from math import sqrt
        return sqrt((self.latitude - target_location[0]) ** 2 + (self.longitude - target_location[1]) ** 2)

    def is_operational(self):
        return self.battery_level > 20 and self.status != "Maintenance Due"


class Driver(Base):
    __tablename__ = 'drivers'

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    license_number = Column(String(50), unique=True, nullable=False)
    phone = Column(String(20), nullable=True)
    status = Column(String(50), nullable=False, default="Available")  # Available, On Duty, Off Duty

    vehicles = relationship("Vehicle", back_populates="driver")

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "license_number": self.license_number,
            "phone": self.phone,
            "status": self.status,
            "assigned_vehicles": [v.vehicle_id for v in self.vehicles] if self.vehicles else []
        }


class Task(Base):
    __tablename__ = 'tasks'

    id = Column(Integer, primary_key=True, autoincrement=True)
    task_code = Column(String(50), unique=True, nullable=False, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    priority = Column(Integer, nullable=False, default=1)  # 1 (Low), 2 (Medium), 3 (High)
    status = Column(String(50), nullable=False, default="Pending")  # Pending, In Progress, Completed, Cancelled
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    assigned_vehicle_id = Column(Integer, ForeignKey('vehicles.id'), nullable=True)
    assigned_to = Column(String(100), nullable=True)
    due_date = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    vehicle = relationship("Vehicle", back_populates="tasks")

    def to_dict(self):
        return {
            "id": self.id,
            "task_code": self.task_code,
            "title": self.title,
            "description": self.description,
            "priority": self.priority,
            "status": self.status,
            "latitude": self.latitude,
            "longitude": self.longitude,
            "location": (self.latitude, self.longitude),
            "assigned_vehicle_id": self.assigned_vehicle_id,
            "assigned_vehicle_code": self.vehicle.vehicle_id if self.vehicle else None,
            "assigned_to": self.assigned_to,
            "due_date": self.due_date,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }


class RouteLog(Base):
    __tablename__ = 'route_logs'

    id = Column(Integer, primary_key=True, autoincrement=True)
    origin_lat = Column(Float, nullable=False)
    origin_lon = Column(Float, nullable=False)
    dest_lat = Column(Float, nullable=False)
    dest_lon = Column(Float, nullable=False)
    distance_km = Column(Float, nullable=False)
    estimated_time_mins = Column(Float, nullable=False)
    traffic_factor = Column(Float, nullable=False, default=1.0)
    created_at = Column(DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "origin": (self.origin_lat, self.origin_lon),
            "destination": (self.dest_lat, self.dest_lon),
            "distance_km": self.distance_km,
            "estimated_time_mins": self.estimated_time_mins,
            "traffic_factor": self.traffic_factor,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }


class MaintenanceLog(Base):
    __tablename__ = 'maintenance_logs'

    id = Column(Integer, primary_key=True, autoincrement=True)
    vehicle_id = Column(Integer, ForeignKey('vehicles.id'), nullable=False)
    service_type = Column(String(100), nullable=False)  # Oil Change, Tire Rotation, Brake Inspection, etc.
    status = Column(String(50), nullable=False, default="Scheduled")  # Scheduled, Completed, Overdue
    due_date = Column(String(50), nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    vehicle = relationship("Vehicle", back_populates="maintenance_logs")

    def to_dict(self):
        return {
            "id": self.id,
            "vehicle_id": self.vehicle_id,
            "vehicle_code": self.vehicle.vehicle_id if self.vehicle else None,
            "vehicle_name": self.vehicle.name if self.vehicle else None,
            "service_type": self.service_type,
            "status": self.status,
            "due_date": self.due_date,
            "notes": self.notes,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }


class FuelLog(Base):
    __tablename__ = 'fuel_logs'

    id = Column(Integer, primary_key=True, autoincrement=True)
    vehicle_id = Column(Integer, ForeignKey('vehicles.id'), nullable=False)
    fuel_added_liters = Column(Float, nullable=False)
    cost = Column(Float, nullable=False)
    odometer_km = Column(Float, nullable=False)
    efficiency_kml = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    vehicle = relationship("Vehicle", back_populates="fuel_logs")

    def to_dict(self):
        return {
            "id": self.id,
            "vehicle_id": self.vehicle_id,
            "vehicle_code": self.vehicle.vehicle_id if self.vehicle else None,
            "fuel_added_liters": self.fuel_added_liters,
            "cost": self.cost,
            "odometer_km": self.odometer_km,
            "efficiency_kml": self.efficiency_kml,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }

