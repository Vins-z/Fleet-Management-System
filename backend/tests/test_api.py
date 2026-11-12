import json
import pytest
from app import app
from database import init_db

@pytest.fixture
def client():
    app.config['TESTING'] = True
    init_db()
    with app.test_client() as client:
        yield client

def test_health_check(client):
    response = client.get('/api/health')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['status'] == 'healthy'

def test_dashboard_stats(client):
    response = client.get('/api/dashboard/stats')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert 'totalVehicles' in data
    assert 'vehiclesInUse' in data
    assert 'fuelConsumption' in data

def test_get_vehicles(client):
    response = client.get('/api/vehicles')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert 'vehicles' in data
    assert len(data['vehicles']) > 0

def test_create_and_delete_vehicle(client):
    payload = {
        'vehicle_id': 'V_TEST_999',
        'name': 'Test Truck Special',
        'battery_level': 95,
        'latitude': 28.5,
        'longitude': 77.1
    }
    res = client.post('/api/vehicles', json=payload)
    assert res.status_code == 201
    veh_data = json.loads(res.data)['vehicle']
    veh_id = veh_data['id']

    # Patch status
    patch_res = client.patch(f'/api/vehicles/{veh_id}', json={'status': 'Idle'})
    assert patch_res.status_code == 200

    # Delete
    del_res = client.delete(f'/api/vehicles/{veh_id}')
    assert del_res.status_code == 200

def test_tasks_crud(client):
    # Create task
    task_payload = {
        'title': 'Test Courier Delivery',
        'priority': 2,
        'latitude': 28.62,
        'longitude': 77.21,
        'assignedTo': 'Tester'
    }
    create_res = client.post('/api/tasks', json=task_payload)
    assert create_res.status_code == 201
    task_data = json.loads(create_res.data)['task']
    task_id = task_data['id']

    # Update task
    update_res = client.patch(f'/api/tasks/{task_id}', json={'status': 'Completed'})
    assert update_res.status_code == 200

    # Clean up
    del_res = client.delete(f'/api/tasks/{task_id}')
    assert del_res.status_code == 200

def test_allocate_task_api(client):
    payload = {
        'tasks': [{'id': 1, 'title': 'Dropoff Alpha', 'location': (28.7, 77.1), 'priority': 2}],
        'vehicles': [
            {'vehicle_id': 'V_T1', 'battery_level': 85, 'location': (28.705, 77.105), 'status': 'Active'},
            {'vehicle_id': 'V_T2', 'battery_level': 30, 'location': (28.9, 77.4), 'status': 'Active'}
        ]
    }
    res = client.post('/api/allocate_task', json=payload)
    assert res.status_code == 200
    data = json.loads(res.data)
    assert data['status'] == 'success'
    assert len(data['allocation']) == 1

def test_optimize_route_api(client):
    payload = {
        'current_location': [28.7041, 77.1025],
        'destination': [28.5355, 77.3910],
        'traffic_data': {'impact': 1.3}
    }
    res = client.post('/api/optimize_route', json=payload)
    assert res.status_code == 200
    data = json.loads(res.data)
    assert data['status'] == 'success'
    assert 'optimized_route' in data
    assert 'route' in data['optimized_route']

