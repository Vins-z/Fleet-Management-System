from models.models import Vehicle as DBVehicle, Driver, Task, RouteLog, MaintenanceLog, FuelLog, Base

class Vehicle:
    """
    In-memory / operational vehicle representation providing helper methods and serialization.
    Compatible with SQLAlchemy DBVehicle and dictionary payloads.
    """
    def __init__(self, vehicle_id, battery_level, location, name=None, status="Active", fuel_level=100.0):
        if not isinstance(vehicle_id, (str, int)):
            raise ValueError("vehicle_id must be a string or integer.")
        self.vehicle_id = str(vehicle_id)

        if not (0 <= float(battery_level) <= 100):
            raise ValueError("battery_level must be between 0 and 100.")
        self.battery_level = float(battery_level)

        if not (isinstance(location, (tuple, list)) and len(location) == 2 and 
                all(isinstance(coord, (float, int)) for coord in location)):
            raise ValueError("location must be a tuple of two numeric values (latitude, longitude).")
        self.location = (float(location[0]), float(location[1]))
        self.name = name or f"Vehicle-{self.vehicle_id}"
        self.status = status
        self.fuel_level = float(fuel_level)

    def to_dict(self):
        return {
            "vehicle_id": self.vehicle_id,
            "name": self.name,
            "battery_level": self.battery_level,
            "fuel_level": self.fuel_level,
            "location": self.location,
            "latitude": self.location[0],
            "longitude": self.location[1],
            "status": self.status,
        }

    @staticmethod
    def from_dict(data):
        if not isinstance(data, dict):
            raise ValueError("Input data must be a dictionary.")
        location = data.get('location')
        if location is None and 'latitude' in data and 'longitude' in data:
            location = (data['latitude'], data['longitude'])
        
        return Vehicle(
            vehicle_id=data.get('vehicle_id', data.get('id', 'V000')),
            battery_level=data.get('battery_level', 100),
            location=tuple(location) if location else (0.0, 0.0),
            name=data.get('name'),
            status=data.get('status', 'Active'),
            fuel_level=data.get('fuel_level', 100.0)
        )

    def calculate_distance(self, target_location):
        from math import sqrt
        if not (isinstance(target_location, (tuple, list)) and len(target_location) == 2 and 
                all(isinstance(coord, (float, int)) for coord in target_location)):
            raise ValueError("target_location must be a tuple of two numeric values (latitude, longitude).")
        return sqrt((self.location[0] - target_location[0])**2 + (self.location[1] - target_location[1])**2)

    def is_operational(self):
        return self.battery_level > 20 and self.status != "Maintenance Due"

    def __str__(self):
        return f"Vehicle(ID: {self.vehicle_id}, Battery: {self.battery_level}%, Location: {self.location})"
