from math import sqrt

def calculate_distance(loc1, loc2):
    """
    Calculate Euclidean distance between two (latitude, longitude) coordinate pairs.
    """
    if not (isinstance(loc1, (tuple, list)) and len(loc1) == 2 and
            isinstance(loc2, (tuple, list)) and len(loc2) == 2):
        return 0.0
    return sqrt((float(loc1[0]) - float(loc2[0])) ** 2 + (float(loc1[1]) - float(loc2[1])) ** 2)

def allocate_task(tasks, vehicles):
    """
    Allocates tasks to vehicles based on proximity, battery level, and operational availability.

    :param tasks: List of task dicts or task objects/identifiers.
    :param vehicles: List of vehicle dicts or Vehicle model instances.
    :return: List of allocation dictionaries mapping each task to the optimal vehicle.
    """
    if tasks is None or vehicles is None or len(tasks) == 0 or len(vehicles) == 0:
        raise ValueError("Tasks or vehicles list cannot be empty.")

    allocation = []
    # Copy vehicles list as mutable state to track battery drain and load
    vehicle_pool = []
    for v in vehicles:
        if isinstance(v, dict):
            vehicle_pool.append({
                "vehicle_id": v.get("vehicle_id", v.get("id")),
                "battery_level": float(v.get("battery_level", 100)),
                "location": v.get("location", (v.get("latitude", 0.0), v.get("longitude", 0.0))),
                "distance_to_task": v.get("distance_to_task"),
                "status": v.get("status", "Active"),
                "assigned_count": 0
            })
        else:
            # Object instance (e.g. Vehicle or DBVehicle)
            loc = getattr(v, "location", (getattr(v, "latitude", 0.0), getattr(v, "longitude", 0.0)))
            vehicle_pool.append({
                "vehicle_id": getattr(v, "vehicle_id", str(getattr(v, "id", "V0"))),
                "battery_level": float(getattr(v, "battery_level", 100)),
                "location": loc,
                "distance_to_task": getattr(v, "distance_to_task", None),
                "status": getattr(v, "status", "Active"),
                "assigned_count": 0
            })

    for idx, task in enumerate(tasks):
        # Normalize task representation
        if isinstance(task, dict):
            task_obj = task
            task_location = task.get("location")
            if task_location is None and "latitude" in task and "longitude" in task:
                task_location = (task["latitude"], task["longitude"])
            task_priority = float(task.get("priority", 1))
        elif isinstance(task, str):
            task_obj = {"title": task, "task_code": f"T-{idx+1}", "priority": 1}
            task_location = None
            task_priority = 1
        else:
            task_obj = {"title": str(task), "priority": 1}
            task_location = getattr(task, "location", None)
            task_priority = float(getattr(task, "priority", 1))

        # Score eligible vehicles
        scored_vehicles = []
        for v in vehicle_pool:
            # Determine distance
            if v["distance_to_task"] is not None:
                dist = float(v["distance_to_task"])
            elif task_location and v["location"]:
                dist = calculate_distance(v["location"], task_location)
            else:
                dist = 5.0  # default baseline

            battery = v["battery_level"]
            operational = battery > 20 and v["status"] != "Maintenance Due"
            
            # Distance heavily impacts cost (closer is better), higher battery reduces cost,
            # workload penalty distributes tasks among vehicles.
            cost = (dist * 10.0) - (battery * 0.1) + (v["assigned_count"] * 30.0)
            if not operational:
                cost += 1000.0  # heavy penalty for non-operational / low-battery vehicles

            scored_vehicles.append((cost, dist, v))

        # Pick candidate with lowest operational cost
        scored_vehicles.sort(key=lambda item: item[0])
        best_cost, best_dist, selected_vehicle = scored_vehicles[0]

        allocation.append({
            "task": task_obj if isinstance(task, dict) else task,
            "vehicle": {
                "vehicle_id": selected_vehicle["vehicle_id"],
                "battery_level": round(selected_vehicle["battery_level"], 1),
                "distance_to_task": round(best_dist, 2)
            }
        })

        # Update vehicle workload and battery usage simulation
        selected_vehicle["assigned_count"] += 1
        selected_vehicle["battery_level"] = max(0.0, selected_vehicle["battery_level"] - 5.0)

    return allocation
