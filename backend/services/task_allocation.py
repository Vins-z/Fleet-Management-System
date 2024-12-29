def allocate_task(tasks, vehicles):
    """
    Allocates tasks to vehicles based on battery level, proximity, and task priority.
    
    Tasks are allocated to vehicles in a way that optimizes battery usage and ensures timely task completion.
    """
    if not tasks or not vehicles:
        raise ValueError("Tasks or vehicles list cannot be empty.")
    
    allocation = []
    
    for task in tasks:
        if not isinstance(task, dict) or 'priority' not in task or 'location' not in task:
            raise ValueError("Each task must be a dictionary with 'priority' and 'location' keys.")
        
        task_priority = task.get('priority', 1)  # Default priority is 1 (low urgency)
        
        # Validate task location (must be a tuple of latitude and longitude)
        if not isinstance(task['location'], tuple) or len(task['location']) != 2:
            raise ValueError("Task location must be a tuple of (latitude, longitude).")
        
        # Score each vehicle based on battery level, proximity, and task priority
        vehicle_scores = []
        for vehicle in vehicles:
            if not isinstance(vehicle, dict) or 'battery_level' not in vehicle or 'distance_to_task' not in vehicle:
                raise ValueError("Each vehicle must be a dictionary with 'battery_level' and 'distance_to_task' keys.")
            
            score = (
                vehicle['battery_level'] * 0.5 +  # 50% weight to battery level
                vehicle['distance_to_task'] * 0.3 +  # 30% weight to proximity (distance)
                task_priority * 0.2  # 20% weight to task priority
            )
            vehicle_scores.append((vehicle, score))
        
        # Sort vehicles based on their scores (ascending score means less cost)
        vehicle_scores.sort(key=lambda x: x[1])

        # Select the best vehicle based on the score
        selected_vehicle = vehicle_scores[0][0]
        
        # Allocate the task to the selected vehicle
        allocation.append({
            'task': task,
            'vehicle': {
                'vehicle_id': selected_vehicle['vehicle_id'],
                'battery_level': selected_vehicle['battery_level'],
                'distance_to_task': selected_vehicle['distance_to_task']
            }
        })
        
        # Update the vehicle's status or mark it as allocated (if needed)
        # For example, you can update the vehicle's battery level after task allocation
        selected_vehicle['battery_level'] -= 10  # Assume a fixed battery drain per task

    return allocation