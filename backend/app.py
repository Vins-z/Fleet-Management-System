import logging
from flask import Flask, jsonify, request
from services.task_allocation import allocate_task
from services.route_optimizer import ai_optimize_route
from models import Vehicle
import database
from werkzeug.exceptions import BadRequest
from flask_cors import CORS  # Add this for Cross-Origin Resource Sharing (CORS)
from dotenv import load_dotenv
import os
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

limiter = Limiter(get_remote_address, app=app)
limiter.limit("100 per minute")(allocate_task_route)
load_dotenv()

app.config['MONGO_URI'] = os.getenv("MONGO_URI")
app.config['SECRET_KEY'] = os.getenv("SECRET_KEY")
app = Flask(__name__)

# Enable CORS for frontend-backend communication
CORS(app)

# Set up basic logging
logging.basicConfig(level=logging.DEBUG)

@app.route('/api/allocate_task', methods=['POST'])
def allocate_task_route():
    """
    Allocate tasks to vehicles based on battery level and proximity.
    """
    try:
        data = request.json
        if not data or 'tasks' not in data or 'vehicles' not in data:
            raise BadRequest('Invalid input format. "tasks" and "vehicles" are required.')

        tasks = data['tasks']
        vehicles_data = data['vehicles']

        # Validate vehicle data and convert to Vehicle objects
        vehicles = []
        for vehicle_data in vehicles_data:
            try:
                vehicle = Vehicle.from_dict(vehicle_data)
                vehicles.append(vehicle)
            except KeyError as e:
                raise BadRequest(f'Missing key {str(e)} in vehicle data.')

        # Allocate tasks to vehicles
        allocation = allocate_task(tasks, vehicles)
        return jsonify({'status': 'success', 'allocation': allocation}), 200
    except BadRequest as e:
        app.logger.error(f"Bad request: {e}")
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        app.logger.error(f"Unexpected error: {e}")
        return jsonify({'error': 'Internal Server Error'}), 500


@app.route('/api/optimize_route', methods=['POST'])
def optimize_route_route():
    """
    Optimize the route from current location to destination using AI model.
    """
    try:
        data = request.json
        if not data or 'current_location' not in data or 'destination' not in data:
            raise BadRequest('Invalid input format. "current_location" and "destination" are required.')

        current_location = tuple(data['current_location'])  # Expecting a tuple (latitude, longitude)
        destination = tuple(data['destination'])  # Expecting a tuple (latitude, longitude)
        traffic_data = data.get('traffic_data', {})

        # Validate coordinates (latitude and longitude should be valid)
        if not (is_valid_coordinates(current_location) and is_valid_coordinates(destination)):
            raise BadRequest('Invalid coordinates. Latitude must be between -90 and 90, and Longitude must be between -180 and 180.')

        # Optimize route using AI-powered model
        result = ai_optimize_route(current_location, destination, traffic_data)
        return jsonify({'status': 'success', 'optimized_route': result}), 200
    except BadRequest as e:
        app.logger.error(f"Bad request: {e}")
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        app.logger.error(f"Unexpected error: {e}")
        return jsonify({'error': 'Internal Server Error'}), 500


@app.route('/api/vehicles', methods=['GET'])
def get_vehicles():
    """
    Retrieve list of all vehicles.
    """
    try:
        # Connect to your database (replace with real DB logic)
        vehicles_collection = database.get_collection('vehicles')
        vehicles = list(vehicles_collection.find({}, {'_id': 0}))  # Exclude _id field
        return jsonify({'status': 'success', 'vehicles': vehicles}), 200
    except Exception as e:
        app.logger.error(f"Database error: {e}")
        return jsonify({'error': 'Internal Server Error'}), 500


def is_valid_coordinates(coordinate):
    """
    Validate if the coordinate is a valid latitude/longitude pair.
    Latitude: -90 to 90, Longitude: -180 to 180
    """
    if not isinstance(coordinate, tuple) or len(coordinate) != 2:
        return False
    lat, lon = coordinate
    return -90 <= lat <= 90 and -180 <= lon <= 180


if __name__ == '__main__':
    app.run(debug=True)