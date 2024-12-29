from services.task_allocation import allocate_task

def test_allocate_task_basic():
    tasks = ['Task 1', 'Task 2']
    vehicles = [
        {'vehicle_id': 1, 'battery_level': 80, 'distance_to_task': 5},
        {'vehicle_id': 2, 'battery_level': 50, 'distance_to_task': 2}
    ]
    
    allocation = allocate_task(tasks, vehicles)
    
    # Verify basic allocation length and task assignment
    assert len(allocation) == 2, "Number of allocations should match the number of tasks"
    assert allocation[0]['task'] == 'Task 1', "Task 1 should be allocated first"
    assert allocation[1]['task'] == 'Task 2', "Task 2 should be allocated second"

    # Verify that vehicles are allocated correctly based on battery and distance
    assert allocation[0]['vehicle']['vehicle_id'] == 2, "Vehicle 2 (closer and with lower battery) should be allocated to Task 1"
    assert allocation[1]['vehicle']['vehicle_id'] == 1, "Vehicle 1 (further and with higher battery) should be allocated to Task 2"

def test_allocate_task_no_vehicles():
    tasks = ['Task 1', 'Task 2']
    vehicles = []
    try:
        allocate_task(tasks, vehicles)
    except ValueError as e:
        assert str(e) == "Tasks or vehicles list cannot be empty.", "Error message should be correct"

def test_allocate_task_no_tasks():
    tasks = []
    vehicles = [
        {'vehicle_id': 1, 'battery_level': 80, 'distance_to_task': 5},
        {'vehicle_id': 2, 'battery_level': 50, 'distance_to_task': 2}
    ]
    try:
        allocate_task(tasks, vehicles)
    except ValueError as e:
        assert str(e) == "Tasks or vehicles list cannot be empty.", "Error message should be correct"

def test_allocate_task_single_vehicle():
    tasks = ['Task 1', 'Task 2']
    vehicles = [{'vehicle_id': 1, 'battery_level': 80, 'distance_to_task': 5}]
    
    allocation = allocate_task(tasks, vehicles)
    
    # Check that all tasks are allocated to the single vehicle available
    assert len(allocation) == 2, "Two tasks should still be allocated even with one vehicle"
    assert allocation[0]['vehicle']['vehicle_id'] == 1, "The only available vehicle should be assigned both tasks"

def test_allocate_task_edge_case():
    tasks = ['Task 1']
    vehicles = [
        {'vehicle_id': 1, 'battery_level': 80, 'distance_to_task': 5},
        {'vehicle_id': 2, 'battery_level': 50, 'distance_to_task': 2}
    ]
    
    allocation = allocate_task(tasks, vehicles)
    
    # Check allocation when there is a single task
    assert len(allocation) == 1, "One task should be allocated to one vehicle"
    assert allocation[0]['task'] == 'Task 1', "The task should be Task 1"
    assert allocation[0]['vehicle']['vehicle_id'] == 2, "Vehicle 2 should be assigned to Task 1 as it's closer"

# Run the tests
test_allocate_task_basic()
test_allocate_task_no_vehicles()
test_allocate_task_no_tasks()
test_allocate_task_single_vehicle()
test_allocate_task_edge_case()

print("All tests passed successfully!")