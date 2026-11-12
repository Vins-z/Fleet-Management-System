import math
from services.route_optimizer import haversine_distance, generate_waypoints

def optimize_vrp_tour(start_location, stops):
    """
    Solves Multi-Stop Vehicle Routing Problem (VRP / TSP) using Nearest Neighbor
    with 2-Opt local search heuristic to optimize multi-destination delivery sequences.

    :param start_location: (lat, lon) tuple of starting vehicle / depot position.
    :param stops: List of delivery stop dictionaries containing 'id'/'title', 'latitude', 'longitude'.
    :return: Dictionary containing optimal route sequence, total tour distance, duration, and leg breakdowns.
    """
    if not start_location or not stops:
        raise ValueError("start_location and at least one delivery stop are required.")

    if not (isinstance(start_location, (tuple, list)) and len(start_location) == 2):
        raise ValueError("start_location must be a tuple/list of two coordinates (latitude, longitude).")

    # Clean and normalize stops
    normalized_stops = []
    for idx, s in enumerate(stops):
        lat = s.get("latitude", s.get("lat"))
        lon = s.get("longitude", s.get("lon"))
        if lat is None or lon is None:
            continue
        normalized_stops.append({
            "id": s.get("id", f"STOP-{idx+1}"),
            "title": s.get("title", f"Delivery Stop #{idx+1}"),
            "latitude": float(lat),
            "longitude": float(lon),
            "priority": int(s.get("priority", 1)),
            "due_date": s.get("due_date", "Today")
        })

    if not normalized_stops:
        raise ValueError("No valid coordinates found in provided stops.")

    # 1. Nearest Neighbor Tour Construction
    unvisited = list(range(len(normalized_stops)))
    current_pos = (float(start_location[0]), float(start_location[1]))
    tour_indices = []

    while unvisited:
        nearest_idx = None
        min_dist = float('inf')
        for i in unvisited:
            stop_pos = (normalized_stops[i]["latitude"], normalized_stops[i]["longitude"])
            d = haversine_distance(current_pos, stop_pos)
            # Prioritize high-priority tasks slightly
            weighted_d = d / (1.0 + 0.15 * normalized_stops[i]["priority"])
            if weighted_d < min_dist:
                min_dist = weighted_d
                nearest_idx = i

        tour_indices.append(nearest_idx)
        current_pos = (normalized_stops[nearest_idx]["latitude"], normalized_stops[nearest_idx]["longitude"])
        unvisited.remove(nearest_idx)

    # 2. 2-Opt Heuristic Optimization (for 4+ stops)
    if len(tour_indices) >= 4:
        improved = True
        iterations = 0
        while improved and iterations < 20:
            improved = False
            iterations += 1
            for i in range(len(tour_indices) - 1):
                for j in range(i + 2, len(tour_indices)):
                    # Compute tour distance difference if reversing segment [i+1:j+1]
                    p_i = (start_location if i == 0 else (normalized_stops[tour_indices[i-1]]["latitude"], normalized_stops[tour_indices[i-1]]["longitude"]))
                    p_i1 = (normalized_stops[tour_indices[i]]["latitude"], normalized_stops[tour_indices[i]]["longitude"])
                    p_j = (normalized_stops[tour_indices[j-1]]["latitude"], normalized_stops[tour_indices[j-1]]["longitude"])
                    p_j1 = (normalized_stops[tour_indices[j]]["latitude"], normalized_stops[tour_indices[j]]["longitude"])

                    d_orig = haversine_distance(p_i, p_i1) + haversine_distance(p_j, p_j1)
                    d_new = haversine_distance(p_i, p_j) + haversine_distance(p_i1, p_j1)

                    if d_new < d_orig - 0.05:
                        tour_indices[i:j] = reversed(tour_indices[i:j])
                        improved = True

    # 3. Calculate Tour Legs and Totals
    legs = []
    total_distance_km = 0.0
    curr_point = (float(start_location[0]), float(start_location[1]))
    ordered_stops = []

    for sequence_num, stop_idx in enumerate(tour_indices, 1):
        stop_data = normalized_stops[stop_idx].copy()
        stop_data["sequence"] = sequence_num
        target_point = (stop_data["latitude"], stop_data["longitude"])

        leg_dist = haversine_distance(curr_point, target_point)
        # Average urban logistics speed 38 km/h + 8 mins delivery dwell time per stop
        leg_time_mins = round((leg_dist / 38.0) * 60.0 + 8.0, 1)

        legs.append({
            "leg_number": sequence_num,
            "from_coord": [round(curr_point[0], 4), round(curr_point[1], 4)],
            "to_coord": [round(target_point[0], 4), round(target_point[1], 4)],
            "destination_title": stop_data["title"],
            "distance_km": round(leg_dist, 2),
            "estimated_mins": leg_time_mins,
            "waypoints": generate_waypoints(curr_point, target_point, num_waypoints=3)
        })

        total_distance_km += leg_dist
        curr_point = target_point
        ordered_stops.append(stop_data)

    total_duration_mins = sum(leg["estimated_mins"] for leg in legs)
    fuel_estimate_liters = round(total_distance_km * 0.11, 2)  # ~11 L / 100 km
    co2_kg_estimate = round(fuel_estimate_liters * 2.68, 2)    # 2.68 kg CO2 per liter diesel

    return {
        "status": "success",
        "total_stops": len(ordered_stops),
        "total_distance_km": round(total_distance_km, 2),
        "total_duration_mins": round(total_duration_mins, 1),
        "fuel_estimate_liters": fuel_estimate_liters,
        "co2_kg_estimate": co2_kg_estimate,
        "ordered_stops": ordered_stops,
        "legs": legs
    }

