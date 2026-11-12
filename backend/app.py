import logging
import os
from flask import Flask, jsonify, request
from flask_cors import CORS
from dotenv import load_dotenv
from werkzeug.exceptions import BadRequest

from database import init_db, get_db
from models.models import Vehicle as DBVehicle, Driver, Task, RouteLog, MaintenanceLog, FuelLog, Geofence, TelematicsEvent
from models.vehicle import Vehicle
from services.task_allocation import allocate_task
from services.route_optimizer import ai_optimize_route, optimize_route
from services.vrp_optimizer import optimize_vrp_tour
from services.geofence_service import evaluate_vehicle_geofences

# Load environment configuration
load_dotenv()

# Initialize Flask application
app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv("SECRET_KEY", "fleet-dev-secret-key-2026")
CORS(app, resources={r"/*": {"origins": "*"}})

# Logging configuration
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Initialize database schema and initial data
try:
    init_db()
    logger.info("Database initialized successfully.")
except Exception as e:
    logger.warning(f"Database initialization deferred or already created: {e}")


# ---------------------------------------------------------------------------
# Health & Diagnostic Routes
# ---------------------------------------------------------------------------
@app.route('/health', methods=['GET'])
@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy',
        'service': 'Fleet Management System API',
        'version': '2.0.0'
    }), 200


# ---------------------------------------------------------------------------
# Dashboard Analytics
# ---------------------------------------------------------------------------
@app.route('/api/dashboard/stats', methods=['GET'])
def get_dashboard_stats():
    """
    Returns high-level fleet statistics and active alerts for the dashboard.
    """
    try:
        with get_db() as session:
            total_vehicles = session.query(DBVehicle).count()
            vehicles_in_use = session.query(DBVehicle).filter(DBVehicle.status == 'Active').count()
            maintenance_due = session.query(DBVehicle).filter(DBVehicle.status == 'Maintenance Due').count()
            idle_vehicles = session.query(DBVehicle).filter(DBVehicle.status == 'Idle').count()

            # Active maintenance alerts
            overdue_logs = session.query(MaintenanceLog).filter(
                MaintenanceLog.status.in_(['Overdue', 'Scheduled'])
            ).all()
            alerts = [f"{m.vehicle.name if m.vehicle else 'Vehicle'}: {m.service_type} ({m.status})" for m in overdue_logs]

            # Average fuel efficiency from logs
            fuel_logs = session.query(FuelLog).all()
            avg_fuel = 9.5
            if fuel_logs:
                efficiencies = [f.efficiency_kml for f in fuel_logs if f.efficiency_kml]
                if efficiencies:
                    avg_fuel = round(sum(efficiencies) / len(efficiencies), 1)

            return jsonify({
                'status': 'success',
                'totalVehicles': total_vehicles,
                'vehiclesInUse': vehicles_in_use,
                'maintenanceDue': maintenance_due,
                'idleVehicles': idle_vehicles,
                'fuelConsumption': {
                    'avg': avg_fuel,
                    'unit': 'km/L'
                },
                'alerts': alerts if alerts else ['All vehicles running at optimal efficiency.']
            }), 200
    except Exception as e:
        logger.error(f"Error fetching dashboard stats: {e}")
        return jsonify({'error': 'Failed to retrieve dashboard statistics'}), 500


# ---------------------------------------------------------------------------
# Vehicle Management Routes
# ---------------------------------------------------------------------------
@app.route('/vehicles', methods=['GET'])
@app.route('/api/vehicles', methods=['GET'])
def get_vehicles():
    """
    Retrieve all vehicles with driver and status information.
    """
    try:
        with get_db() as session:
            vehicles = session.query(DBVehicle).all()
            return jsonify({
                'status': 'success',
                'vehicles': [v.to_dict() for v in vehicles]
            }), 200
    except Exception as e:
        logger.error(f"Database error in get_vehicles: {e}")
        return jsonify({'error': 'Failed to fetch vehicles'}), 500


@app.route('/vehicles/<int:vehicle_id>', methods=['GET'])
@app.route('/api/vehicles/<int:vehicle_id>', methods=['GET'])
def get_vehicle_by_id(vehicle_id):
    try:
        with get_db() as session:
            vehicle = session.query(DBVehicle).filter(DBVehicle.id == vehicle_id).first()
            if not vehicle:
                return jsonify({'error': 'Vehicle not found'}), 404
            return jsonify({'status': 'success', 'vehicle': vehicle.to_dict()}), 200
    except Exception as e:
        logger.error(f"Error fetching vehicle {vehicle_id}: {e}")
        return jsonify({'error': 'Internal Server Error'}), 500


@app.route('/vehicles', methods=['POST'])
@app.route('/api/vehicles', methods=['POST'])
def create_vehicle():
    try:
        data = request.json or {}
        if not data.get('vehicle_id') or not data.get('name'):
            return jsonify({'error': 'vehicle_id and name are required'}), 400

        with get_db() as session:
            existing = session.query(DBVehicle).filter(DBVehicle.vehicle_id == data['vehicle_id']).first()
            if existing:
                return jsonify({'error': f"Vehicle {data['vehicle_id']} already exists"}), 400

            new_v = DBVehicle(
                vehicle_id=data['vehicle_id'],
                name=data['name'],
                model=data.get('model', 'Standard Van'),
                battery_level=float(data.get('battery_level', 100)),
                fuel_level=float(data.get('fuel_level', 100)),
                latitude=float(data.get('latitude', 28.6139)),
                longitude=float(data.get('longitude', 77.2090)),
                status=data.get('status', 'Active'),
                assigned_driver_id=data.get('assigned_driver_id')
            )
            session.add(new_v)
            session.flush()
            return jsonify({'status': 'success', 'vehicle': new_v.to_dict()}), 201
    except Exception as e:
        logger.error(f"Error creating vehicle: {e}")
        return jsonify({'error': str(e)}), 400


@app.route('/vehicles/<int:vehicle_id>', methods=['PATCH'])
@app.route('/api/vehicles/<int:vehicle_id>', methods=['PATCH'])
def update_vehicle(vehicle_id):
    try:
        data = request.json or {}
        with get_db() as session:
            v = session.query(DBVehicle).filter(DBVehicle.id == vehicle_id).first()
            if not v:
                return jsonify({'error': 'Vehicle not found'}), 404

            if 'status' in data:
                v.status = data['status']
            if 'battery_level' in data:
                v.battery_level = float(data['battery_level'])
            if 'fuel_level' in data:
                v.fuel_level = float(data['fuel_level'])
            if 'latitude' in data:
                v.latitude = float(data['latitude'])
            if 'longitude' in data:
                v.longitude = float(data['longitude'])
            if 'assigned_driver_id' in data:
                v.assigned_driver_id = data['assigned_driver_id']

            return jsonify({'status': 'success', 'vehicle': v.to_dict()}), 200
    except Exception as e:
        logger.error(f"Error updating vehicle {vehicle_id}: {e}")
        return jsonify({'error': str(e)}), 400


@app.route('/vehicles/<int:vehicle_id>', methods=['DELETE'])
@app.route('/api/vehicles/<int:vehicle_id>', methods=['DELETE'])
def delete_vehicle(vehicle_id):
    try:
        with get_db() as session:
            v = session.query(DBVehicle).filter(DBVehicle.id == vehicle_id).first()
            if not v:
                return jsonify({'error': 'Vehicle not found'}), 404
            session.delete(v)
            return jsonify({'status': 'success', 'message': f'Vehicle {vehicle_id} deleted'}), 200
    except Exception as e:
        logger.error(f"Error deleting vehicle {vehicle_id}: {e}")
        return jsonify({'error': str(e)}), 500


# ---------------------------------------------------------------------------
# Driver Management Routes
# ---------------------------------------------------------------------------
@app.route('/drivers', methods=['GET'])
@app.route('/api/drivers', methods=['GET'])
def get_drivers():
    try:
        with get_db() as session:
            drivers = session.query(Driver).all()
            return jsonify({'status': 'success', 'drivers': [d.to_dict() for d in drivers]}), 200
    except Exception as e:
        logger.error(f"Error fetching drivers: {e}")
        return jsonify({'error': 'Failed to fetch drivers'}), 500


@app.route('/drivers', methods=['POST'])
@app.route('/api/drivers', methods=['POST'])
def create_driver():
    try:
        data = request.json or {}
        if not data.get('name') or not data.get('license_number'):
            return jsonify({'error': 'name and license_number are required'}), 400

        with get_db() as session:
            driver = Driver(
                name=data['name'],
                license_number=data['license_number'],
                phone=data.get('phone'),
                status=data.get('status', 'Available')
            )
            session.add(driver)
            session.flush()
            return jsonify({'status': 'success', 'driver': driver.to_dict()}), 201
    except Exception as e:
        logger.error(f"Error creating driver: {e}")
        return jsonify({'error': str(e)}), 400


@app.route('/drivers/assign', methods=['POST'])
@app.route('/api/drivers/assign', methods=['POST'])
def assign_driver():
    try:
        data = request.json or {}
        driver_id = data.get('driverId') or data.get('driver_id')
        vehicle_id = data.get('vehicleId') or data.get('vehicle_id')
        if not driver_id or not vehicle_id:
            return jsonify({'error': 'driverId and vehicleId are required'}), 400

        with get_db() as session:
            driver = session.query(Driver).filter(Driver.id == driver_id).first()
            vehicle = session.query(DBVehicle).filter(
                (DBVehicle.id == vehicle_id) | (DBVehicle.vehicle_id == str(vehicle_id))
            ).first()

            if not driver or not vehicle:
                return jsonify({'error': 'Driver or Vehicle not found'}), 404

            vehicle.assigned_driver_id = driver.id
            driver.status = 'On Duty'
            return jsonify({
                'status': 'success',
                'message': f"Assigned driver {driver.name} to vehicle {vehicle.vehicle_id}",
                'vehicle': vehicle.to_dict(),
                'driver': driver.to_dict()
            }), 200
    except Exception as e:
        logger.error(f"Error assigning driver: {e}")
        return jsonify({'error': str(e)}), 400


# ---------------------------------------------------------------------------
# Task Management Routes
# ---------------------------------------------------------------------------
@app.route('/tasks', methods=['GET'])
@app.route('/api/tasks', methods=['GET'])
def get_tasks():
    try:
        with get_db() as session:
            tasks = session.query(Task).all()
            return jsonify({'status': 'success', 'tasks': [t.to_dict() for t in tasks]}), 200
    except Exception as e:
        logger.error(f"Error fetching tasks: {e}")
        return jsonify({'error': 'Failed to fetch tasks'}), 500


@app.route('/tasks', methods=['POST'])
@app.route('/api/tasks', methods=['POST'])
def create_task():
    try:
        data = request.json or {}
        if not data.get('title'):
            return jsonify({'error': 'Task title is required'}), 400

        with get_db() as session:
            count = session.query(Task).count()
            task_code = data.get('task_code') or f"T-{1000 + count + 1}"
            task = Task(
                task_code=task_code,
                title=data['title'],
                description=data.get('description', ''),
                priority=int(data.get('priority', 1)),
                status=data.get('status', 'Pending'),
                latitude=float(data.get('latitude', 28.6139)),
                longitude=float(data.get('longitude', 77.2090)),
                assigned_to=data.get('assignedTo') or data.get('assigned_to', 'Unassigned'),
                due_date=data.get('dueDate') or data.get('due_date', '2026-11-20')
            )
            session.add(task)
            session.flush()
            return jsonify({'status': 'success', 'task': task.to_dict()}), 201
    except Exception as e:
        logger.error(f"Error creating task: {e}")
        return jsonify({'error': str(e)}), 400


@app.route('/tasks/<int:task_id>', methods=['PATCH'])
@app.route('/api/tasks/<int:task_id>', methods=['PATCH'])
def update_task(task_id):
    try:
        data = request.json or {}
        with get_db() as session:
            task = session.query(Task).filter(Task.id == task_id).first()
            if not task:
                return jsonify({'error': 'Task not found'}), 404

            if 'status' in data:
                task.status = data['status']
            if 'assigned_vehicle_id' in data:
                task.assigned_vehicle_id = data['assigned_vehicle_id']
            if 'assigned_to' in data:
                task.assigned_to = data['assigned_to']
            if 'priority' in data:
                task.priority = int(data['priority'])

            return jsonify({'status': 'success', 'task': task.to_dict()}), 200
    except Exception as e:
        logger.error(f"Error updating task {task_id}: {e}")
        return jsonify({'error': str(e)}), 400


@app.route('/tasks/<int:task_id>', methods=['DELETE'])
@app.route('/api/tasks/<int:task_id>', methods=['DELETE'])
def delete_task(task_id):
    try:
        with get_db() as session:
            task = session.query(Task).filter(Task.id == task_id).first()
            if not task:
                return jsonify({'error': 'Task not found'}), 404
            session.delete(task)
            return jsonify({'status': 'success', 'message': f'Task {task_id} deleted'}), 200
    except Exception as e:
        logger.error(f"Error deleting task {task_id}: {e}")
        return jsonify({'error': str(e)}), 500


# ---------------------------------------------------------------------------
# Task Allocation & Route Optimization APIs
# ---------------------------------------------------------------------------
@app.route('/api/allocate_task', methods=['POST'])
def allocate_task_route():
    """
    Allocate tasks to vehicles based on battery levels, proximity, and availability.
    """
    try:
        data = request.get_json(silent=True)
        if data is None:
            data = {}

        tasks = data.get('tasks')
        vehicles_data = data.get('vehicles')

        # If vehicles or tasks not supplied in payload, fetch pending tasks and active vehicles from database
        with get_db() as session:
            if not vehicles_data:
                db_vehicles = session.query(DBVehicle).all()
                vehicles_data = [v.to_dict() for v in db_vehicles]

            if not tasks:
                db_tasks = session.query(Task).filter(Task.status == 'Pending').all()
                tasks = [t.to_dict() for t in db_tasks]

            if not tasks or not vehicles_data:
                return jsonify({
                    'status': 'success',
                    'allocation': [],
                    'message': 'No pending tasks or available vehicles to allocate.'
                }), 200

            allocation = allocate_task(tasks, vehicles_data)

            # Persist assignment in DB if matching IDs exist
            for item in allocation:
                t_info = item.get('task')
                v_info = item.get('vehicle')
                if isinstance(t_info, dict) and t_info.get('id') and v_info.get('vehicle_id'):
                    task_rec = session.query(Task).filter(Task.id == t_info['id']).first()
                    veh_rec = session.query(DBVehicle).filter(
                        (DBVehicle.vehicle_id == str(v_info['vehicle_id'])) | (DBVehicle.id == v_info['vehicle_id'])
                    ).first()
                    if task_rec and veh_rec:
                        task_rec.assigned_vehicle_id = veh_rec.id
                        task_rec.status = 'In Progress'

            return jsonify({'status': 'success', 'allocation': allocation}), 200
    except BadRequest as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        logger.error(f"Unexpected error in allocate_task: {e}")
        return jsonify({'error': 'Internal Server Error', 'details': str(e)}), 500


@app.route('/api/optimize_route', methods=['POST'])
def optimize_route_route():
    """
    Optimize navigation route from current location to destination with traffic estimation.
    """
    try:
        data = request.json or {}
        current_location = data.get('current_location')
        destination = data.get('destination')
        traffic_data = data.get('traffic_data', {})

        if current_location is None or destination is None:
            raise BadRequest('current_location and destination are required.')

        # Call route optimization service
        result = optimize_route(current_location, destination, traffic_data)

        # Log route query for operational analysis
        try:
            with get_db() as session:
                start_c = current_location if isinstance(current_location, (tuple, list)) else (28.6139, 77.2090)
                end_c = destination if isinstance(destination, (tuple, list)) else (28.5355, 77.3910)
                log = RouteLog(
                    origin_lat=float(start_c[0]),
                    origin_lon=float(start_c[1]),
                    dest_lat=float(end_c[0]),
                    dest_lon=float(end_c[1]),
                    distance_km=result.get('distance_km', 10.0),
                    estimated_time_mins=float(result.get('estimated_time', '15 mins').split()[0]),
                    traffic_factor=result.get('traffic_impact', 1.0)
                )
                session.add(log)
        except Exception as log_err:
            logger.warning(f"Could not persist route log: {log_err}")

        return jsonify({'status': 'success', 'optimized_route': result}), 200
    except BadRequest as e:
        return jsonify({'error': str(e)}), 400
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        logger.error(f"Error in optimize_route: {e}")
        return jsonify({'error': 'Internal Server Error'}), 500


# ---------------------------------------------------------------------------
# Maintenance & Fuel Routes
# ---------------------------------------------------------------------------
@app.route('/api/maintenance', methods=['GET', 'POST'])
def handle_maintenance():
    try:
        with get_db() as session:
            if request.method == 'GET':
                logs = session.query(MaintenanceLog).all()
                return jsonify({'status': 'success', 'maintenance': [m.to_dict() for m in logs]}), 200

            data = request.json or {}
            vehicle_id = data.get('vehicle_id')
            if not vehicle_id or not data.get('service_type'):
                return jsonify({'error': 'vehicle_id and service_type are required'}), 400

            log = MaintenanceLog(
                vehicle_id=int(vehicle_id),
                service_type=data['service_type'],
                status=data.get('status', 'Scheduled'),
                due_date=data.get('due_date', '2026-11-25'),
                notes=data.get('notes', '')
            )
            session.add(log)
            session.flush()
            return jsonify({'status': 'success', 'maintenance': log.to_dict()}), 201
    except Exception as e:
        logger.error(f"Error in handle_maintenance: {e}")
        return jsonify({'error': str(e)}), 400


@app.route('/vehicles/<int:vehicle_id>/fuel', methods=['GET', 'POST', 'PATCH'])
@app.route('/api/vehicles/<int:vehicle_id>/fuel', methods=['GET', 'POST', 'PATCH'])
def handle_vehicle_fuel(vehicle_id):
    try:
        with get_db() as session:
            if request.method == 'GET':
                logs = session.query(FuelLog).filter(FuelLog.vehicle_id == vehicle_id).all()
                return jsonify({'status': 'success', 'fuel_logs': [f.to_dict() for f in logs]}), 200

            data = request.json or {}
            fuel_added = float(data.get('fuel_added_liters', 40.0))
            cost = float(data.get('cost', fuel_added * 1.5))
            odometer = float(data.get('odometer_km', 50000.0))
            efficiency = float(data.get('efficiency_kml', 10.0))

            log = FuelLog(
                vehicle_id=vehicle_id,
                fuel_added_liters=fuel_added,
                cost=cost,
                odometer_km=odometer,
                efficiency_kml=efficiency
            )
            session.add(log)
            return jsonify({'status': 'success', 'fuel_log': log.to_dict()}), 201
    except Exception as e:
        logger.error(f"Error handling vehicle fuel for {vehicle_id}: {e}")
        return jsonify({'error': str(e)}), 400


# ---------------------------------------------------------------------------
# Geofencing APIs
# ---------------------------------------------------------------------------
@app.route('/api/geofences', methods=['GET', 'POST'])
def handle_geofences():
    try:
        with get_db() as session:
            if request.method == 'GET':
                geofences = session.query(Geofence).all()
                return jsonify({'status': 'success', 'geofences': [g.to_dict() for g in geofences]}), 200

            data = request.json or {}
            if not data.get('name') or data.get('latitude') is None or data.get('longitude') is None:
                return jsonify({'error': 'name, latitude, and longitude are required'}), 400

            gf = Geofence(
                name=data['name'],
                zone_type=data.get('zone_type', 'Warehouse'),
                latitude=float(data['latitude']),
                longitude=float(data['longitude']),
                radius_km=float(data.get('radius_km', 2.5)),
                description=data.get('description', '')
            )
            session.add(gf)
            session.flush()
            return jsonify({'status': 'success', 'geofence': gf.to_dict()}), 201
    except Exception as e:
        logger.error(f"Error handling geofences: {e}")
        return jsonify({'error': str(e)}), 400


@app.route('/api/geofences/<int:geofence_id>', methods=['DELETE'])
def delete_geofence(geofence_id):
    try:
        with get_db() as session:
            gf = session.query(Geofence).filter(Geofence.id == geofence_id).first()
            if not gf:
                return jsonify({'error': 'Geofence not found'}), 404
            session.delete(gf)
            return jsonify({'status': 'success', 'message': f'Geofence {geofence_id} deleted'}), 200
    except Exception as e:
        logger.error(f"Error deleting geofence: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/geofences/evaluate', methods=['POST'])
def evaluate_geofences():
    """
    Evaluates vehicle locations against all active geofences and detects zone compliance.
    """
    try:
        data = request.get_json(silent=True) or {}
        location = data.get('location')

        with get_db() as session:
            geofences = session.query(Geofence).all()
            if location:
                results = evaluate_vehicle_geofences(location, geofences)
                return jsonify({'status': 'success', 'evaluations': results}), 200

            # Evaluate all active fleet vehicles against all geofences
            vehicles = session.query(DBVehicle).all()
            fleet_eval = []
            for v in vehicles:
                res = evaluate_vehicle_geofences((v.latitude, v.longitude), geofences)
                fleet_eval.append({
                    'vehicle_id': v.vehicle_id,
                    'name': v.name,
                    'location': [v.latitude, v.longitude],
                    'zones': res
                })

            return jsonify({'status': 'success', 'fleet_evaluations': fleet_eval}), 200
    except Exception as e:
        logger.error(f"Error evaluating geofences: {e}")
        return jsonify({'error': str(e)}), 400


# ---------------------------------------------------------------------------
# Telematics & Driver Scorecards APIs
# ---------------------------------------------------------------------------
@app.route('/api/telematics/events', methods=['GET', 'POST'])
def handle_telematics_events():
    try:
        with get_db() as session:
            if request.method == 'GET':
                events = session.query(TelematicsEvent).order_by(TelematicsEvent.created_at.desc()).limit(50).all()
                return jsonify({'status': 'success', 'events': [e.to_dict() for e in events]}), 200

            data = request.json or {}
            vehicle_id = data.get('vehicle_id')
            event_type = data.get('event_type')
            if not vehicle_id or not event_type:
                return jsonify({'error': 'vehicle_id and event_type are required'}), 400

            te = TelematicsEvent(
                vehicle_id=int(vehicle_id),
                event_type=event_type,
                severity=data.get('severity', 'Medium'),
                latitude=float(data.get('latitude', 28.6139)),
                longitude=float(data.get('longitude', 77.2090)),
                description=data.get('description', '')
            )
            session.add(te)
            session.flush()
            return jsonify({'status': 'success', 'event': te.to_dict()}), 201
    except Exception as e:
        logger.error(f"Error in handle_telematics_events: {e}")
        return jsonify({'error': str(e)}), 400


@app.route('/api/drivers/scorecards', methods=['GET'])
def get_driver_scorecards():
    """
    Returns safety ratings, hours-of-service compliance, and harsh incident history for each driver.
    """
    try:
        with get_db() as session:
            drivers = session.query(Driver).all()
            return jsonify({
                'status': 'success',
                'drivers': [d.to_dict() for d in drivers]
            }), 200
    except Exception as e:
        logger.error(f"Error fetching driver scorecards: {e}")
        return jsonify({'error': str(e)}), 500


# ---------------------------------------------------------------------------
# Multi-Stop VRP (Vehicle Routing Problem) Route Optimizer
# ---------------------------------------------------------------------------
@app.route('/api/routes/vrp_optimize', methods=['POST'])
def vrp_optimize_route():
    """
    Solves Multi-Stop Vehicle Routing Problem (VRP) to find the shortest delivery tour
    visiting multiple delivery customer stops.
    """
    try:
        data = request.get_json(silent=True) or {}
        start_location = data.get('start_location')
        stops = data.get('stops')

        if not start_location:
            start_location = (28.6139, 77.2090)  # default central hub

        # If no stops provided, pull all pending tasks from database
        if not stops:
            with get_db() as session:
                tasks = session.query(Task).filter(Task.status == 'Pending').all()
                stops = [t.to_dict() for t in tasks]

        result = optimize_vrp_tour(start_location, stops)
        return jsonify(result), 200
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        logger.error(f"Error in vrp_optimize_route: {e}")
        return jsonify({'error': str(e)}), 500


# ---------------------------------------------------------------------------
# Executive & ESG / Carbon Summary Report
# ---------------------------------------------------------------------------
@app.route('/api/reports/summary', methods=['GET'])
def get_executive_summary():
    """
    Returns complete enterprise audit report including fleet utilization,
    carbon footprint, fuel expenditure, and maintenance compliance.
    """
    try:
        with get_db() as session:
            vehicles = session.query(DBVehicle).all()
            tasks = session.query(Task).all()
            drivers = session.query(Driver).all()
            fuel_logs = session.query(FuelLog).all()
            maintenance_logs = session.query(MaintenanceLog).all()

            total_co2_kg = sum(v.co2_emissions_kg for v in vehicles)
            total_fuel_cost = sum(f.cost for f in fuel_logs)
            total_odometer = sum(v.odometer_km for v in vehicles)
            avg_safety = round(sum(d.safety_score for d in drivers) / len(drivers), 1) if drivers else 95.0

            return jsonify({
                'status': 'success',
                'fleet_summary': {
                    'total_assets': len(vehicles),
                    'active_assets': len([v for v in vehicles if v.status == 'Active']),
                    'idle_assets': len([v for v in vehicles if v.status == 'Idle']),
                    'maintenance_hold': len([v for v in vehicles if v.status == 'Maintenance Due']),
                    'total_fleet_km': round(total_odometer, 1),
                    'total_fuel_expenditure_usd': round(total_fuel_cost, 2),
                    'cost_per_km_usd': round(total_fuel_cost / max(1.0, total_odometer), 3),
                    'fleet_average_safety_score': avg_safety,
                    'esg_carbon_footprint_kg': round(total_co2_kg, 1),
                    'esg_ev_savings_kg': round(total_co2_kg * 0.35, 1),
                    'open_maintenance_tickets': len([m for m in maintenance_logs if m.status != 'Completed']),
                    'completed_delivery_orders': len([t for t in tasks if t.status == 'Completed']),
                    'pending_delivery_orders': len([t for t in tasks if t.status == 'Pending'])
                }
            }), 200
    except Exception as e:
        logger.error(f"Error generating executive summary: {e}")
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    port = int(os.getenv("PORT", 5000))
    app.run(host='0.0.0.0', port=port, debug=False)
