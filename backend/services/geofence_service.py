from services.route_optimizer import haversine_distance

def evaluate_vehicle_geofences(vehicle_location, geofences):
    """
    Evaluates whether a vehicle location is inside or outside defined geofence boundaries.

    :param vehicle_location: (lat, lon) tuple.
    :param geofences: List of geofence dicts or models containing 'name', 'latitude', 'longitude', 'radius_km'.
    :return: List of evaluation records with presence boolean and distance from perimeter.
    """
    if not vehicle_location or not geofences:
        return []

    v_lat, v_lon = float(vehicle_location[0]), float(vehicle_location[1])
    results = []

    for g in geofences:
        if isinstance(g, dict):
            g_lat = float(g.get("latitude", 0.0))
            g_lon = float(g.get("longitude", 0.0))
            radius = float(g.get("radius_km", 2.0))
            name = g.get("name", "Zone")
            z_type = g.get("zone_type", "Standard")
            g_id = g.get("id")
        else:
            g_lat = float(getattr(g, "latitude", 0.0))
            g_lon = float(getattr(g, "longitude", 0.0))
            radius = float(getattr(g, "radius_km", 2.0))
            name = getattr(g, "name", "Zone")
            z_type = getattr(g, "zone_type", "Standard")
            g_id = getattr(g, "id", None)

        dist_from_center = haversine_distance((v_lat, v_lon), (g_lat, g_lon))
        is_inside = dist_from_center <= radius
        distance_to_boundary = round(dist_from_center - radius, 2)

        results.append({
            "geofence_id": g_id,
            "name": name,
            "zone_type": z_type,
            "is_inside": is_inside,
            "distance_from_center_km": round(dist_from_center, 2),
            "distance_to_boundary_km": distance_to_boundary,
            "status": "Inside Zone" if is_inside else "Outside Zone"
        })

    return results
