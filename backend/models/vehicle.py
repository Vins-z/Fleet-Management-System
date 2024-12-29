
class Vehicle:
    def __init__(self, vehicle_id, battery_level, location):
        """
        Initialize a Vehicle instance.

        :param vehicle_id: Unique identifier for the vehicle (str).
        :param battery_level: Current battery level as a percentage (int, 0-100).
        :param location: Current location as a tuple (latitude, longitude) (tuple of float).
        """
        if not isinstance(vehicle_id, str):
            raise ValueError("vehicle_id must be a string.")
        if not (0 <= battery_level <= 100):
            raise ValueError("battery_level must be between 0 and 100.")
        if not (isinstance(location, tuple) and len(location) == 2 and 
                all(isinstance(coord, (float, int)) for coord in location)):
            raise ValueError("location must be a tuple of two numeric values (latitude, longitude).")

        self.vehicle_id = vehicle_id
        self.battery_level = battery_level
        self.location = location

    def to_dict(self):
        """
        Convert the Vehicle instance to a dictionary.

        :return: Dictionary representation of the vehicle.
        """
        return {
            "vehicle_id": self.vehicle_id,
            "battery_level": self.battery_level,
            "location": self.location,
        }

    @staticmethod
    def from_dict(data):
        """
        Create a Vehicle instance from a dictionary.

        :param data: Dictionary containing vehicle data.
        :return: Vehicle instance.
        """
        if not isinstance(data, dict):
            raise ValueError("Input data must be a dictionary.")
        return Vehicle(
            vehicle_id=data['vehicle_id'],
            battery_level=data['battery_level'],
            location=tuple(data['location'])
        )

    def __str__(self):
        """
        String representation of the Vehicle instance.

        :return: Human-readable string representation of the vehicle.
        """
        return f"Vehicle(ID: {self.vehicle_id}, Battery: {self.battery_level}%, Location: {self.location})"

    def calculate_distance(self, target_location):
        """
        Calculate the Euclidean distance to another location.

        :param target_location: Target location as a tuple (latitude, longitude).
        :return: Distance to the target location (float).
        """
        if not (isinstance(target_location, tuple) and len(target_location) == 2 and 
                all(isinstance(coord, (float, int)) for coord in target_location)):
            raise ValueError("target_location must be a tuple of two numeric values (latitude, longitude).")
        
        from math import sqrt
        return sqrt(
            (self.location[0] - target_location[0])**2 +
            (self.location[1] - target_location[1])**2
        )

    def is_operational(self):
        """
        Check if the vehicle is operational based on its battery level.

        :return: True if the battery level is above a critical threshold, False otherwise.
        """
        return self.battery_level > 20