import joblib
import numpy as np
from sklearn.preprocessing import StandardScaler

# Load pre-trained AI model and scaler (use your actual model file)
model = joblib.load("services/models/route_optimizer_model.pkl")
scaler = joblib.load("services/models/scaler.pkl")  # Assuming you used a scaler during model training

def ai_optimize_route(current_location, destination, traffic_data=None):
    """
    AI-powered route optimization with feature scaling and error handling.

    :param current_location: tuple (latitude, longitude)
    :param destination: tuple (latitude, longitude)
    :param traffic_data: Optional dictionary with traffic impact factor (default is None)
    :return: dict with optimized route and estimated travel time
    """
    # Validate inputs
    if not isinstance(current_location, tuple) or len(current_location) != 2 or not all(isinstance(coord, (float, int)) for coord in current_location):
        raise ValueError("Current location must be a tuple with latitude and longitude as numeric values.")
    
    if not isinstance(destination, tuple) or len(destination) != 2 or not all(isinstance(coord, (float, int)) for coord in destination):
        raise ValueError("Destination must be a tuple with latitude and longitude as numeric values.")
    
    # Default traffic impact factor (1.0 if no data provided)
    traffic_impact = 1.0
    if traffic_data:
        if isinstance(traffic_data, dict) and "impact" in traffic_data:
            traffic_impact = traffic_data["impact"]
            if not isinstance(traffic_impact, (float, int)):
                raise ValueError("Traffic impact must be a numeric value.")
        else:
            raise ValueError("Traffic data must be a dictionary containing an 'impact' key with a numeric value.")
    
    # Feature vector for the model: [current_lat, current_lon, dest_lat, dest_lon, traffic_impact]
    features = np.array([
        current_location[0], current_location[1],
        destination[0], destination[1],
        traffic_impact
    ]).reshape(1, -1)

    # Scale features to match the model's training scale
    try:
        scaled_features = scaler.transform(features)
    except Exception as e:
        raise ValueError(f"Error scaling features: {str(e)}")

    try:
        # Predict route and estimated time
        prediction = model.predict(scaled_features)
        
        # Assume the model returns the route (waypoints as a string) and estimated time
        route = prediction[0][0]  # Route is a list of waypoints in a string format
        estimated_time = prediction[0][1]  # Estimated travel time in minutes

        # Convert route from string to list (if needed)
        route = route.split(", ") if isinstance(route, str) else route

        return {
            "route": route,
            "estimated_time": f"{estimated_time} mins",
        }
    
    except Exception as e:
        raise ValueError(f"An error occurred during route optimization: {str(e)}")