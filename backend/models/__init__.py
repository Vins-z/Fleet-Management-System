from models.models import (
    Base,
    Vehicle as DBVehicle,
    Driver,
    Task,
    RouteLog,
    MaintenanceLog,
    FuelLog,
    Geofence,
    TelematicsEvent
)
from models.vehicle import Vehicle

__all__ = [
    "Base",
    "DBVehicle",
    "Driver",
    "Task",
    "RouteLog",
    "MaintenanceLog",
    "FuelLog",
    "Geofence",
    "TelematicsEvent",
    "Vehicle"
]
