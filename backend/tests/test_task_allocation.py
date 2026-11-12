import pytest
from services.task_allocation import allocate_task

def test_allocate_task_basic():
    tasks = ['Task 1', 'Task 2']
    vehicles = [
        {'vehicle_id': 1, 'battery_level': 80, 'distance_to_task': 5},
        {'vehicle_id': 2, 'battery_level': 50, 'distance_to_task': 2}
    ]
    
    allocation = allocate_task(tasks, vehicles)
    
    assert len(allocation) == 2, "Number of allocations should match the number of tasks"
    
    task_0 = allocation[0]['task']
    title_0 = task_0['title'] if isinstance(task_0, dict) else task_0
    assert title_0 == 'Task 1'

    task_1 = allocation[1]['task']
    title_1 = task_1['title'] if isinstance(task_1, dict) else task_1
    assert title_1 == 'Task 2'

    # Vehicle 2 is closer (dist 2 vs 5)
    assert allocation[0]['vehicle']['vehicle_id'] == 2, "Vehicle 2 should be allocated first due to proximity"
    assert allocation[1]['vehicle']['vehicle_id'] == 1, "Vehicle 1 should be allocated to Task 2"

def test_allocate_task_no_vehicles():
    tasks = ['Task 1', 'Task 2']
    vehicles = []
    with pytest.raises(ValueError) as excinfo:
        allocate_task(tasks, vehicles)
    assert "Tasks or vehicles list cannot be empty." in str(excinfo.value)

def test_allocate_task_no_tasks():
    tasks = []
    vehicles = [
        {'vehicle_id': 1, 'battery_level': 80, 'distance_to_task': 5},
        {'vehicle_id': 2, 'battery_level': 50, 'distance_to_task': 2}
    ]
    with pytest.raises(ValueError) as excinfo:
        allocate_task(tasks, vehicles)
    assert "Tasks or vehicles list cannot be empty." in str(excinfo.value)

def test_allocate_task_single_vehicle():
    tasks = ['Task 1', 'Task 2']
    vehicles = [{'vehicle_id': 1, 'battery_level': 80, 'distance_to_task': 5}]
    
    allocation = allocate_task(tasks, vehicles)
    assert len(allocation) == 2
    assert allocation[0]['vehicle']['vehicle_id'] == 1
    assert allocation[1]['vehicle']['vehicle_id'] == 1

def test_allocate_task_edge_case():
    tasks = ['Task 1']
    vehicles = [
        {'vehicle_id': 1, 'battery_level': 80, 'distance_to_task': 5},
        {'vehicle_id': 2, 'battery_level': 50, 'distance_to_task': 2}
    ]
    
    allocation = allocate_task(tasks, vehicles)
    assert len(allocation) == 1
    assert allocation[0]['vehicle']['vehicle_id'] == 2

def test_allocate_task_battery_threshold():
    tasks = [{'id': 1, 'title': 'Urgent Delivery', 'location': (28.6, 77.2), 'priority': 3}]
    vehicles = [
        {'vehicle_id': 'V_DEAD', 'battery_level': 10, 'location': (28.601, 77.201), 'status': 'Active'},
        {'vehicle_id': 'V_READY', 'battery_level': 85, 'location': (28.65, 77.25), 'status': 'Active'}
    ]
    allocation = allocate_task(tasks, vehicles)
    # Even though V_DEAD is slightly closer, its battery is under threshold, so V_READY is picked
    assert allocation[0]['vehicle']['vehicle_id'] == 'V_READY'

if __name__ == '__main__':
    test_allocate_task_basic()
    test_allocate_task_no_vehicles()
    test_allocate_task_no_tasks()
    test_allocate_task_single_vehicle()
    test_allocate_task_edge_case()
    test_allocate_task_battery_threshold()
    print("All task allocation tests passed successfully!")
