import pytest
from services.geofence_service import evaluate_vehicle_geofences

def test_geofence_inside_and_outside():
    hub = {"id": 1, "name": "Central Hub", "latitude": 28.6139, "longitude": 77.2090, "radius_km": 2.0}
    geofences = [hub]

    # Location very close to hub center
    inside_loc = (28.6150, 77.2095)
    res_inside = evaluate_vehicle_geofences(inside_loc, geofences)
    assert len(res_inside) == 1
    assert res_inside[0]["is_inside"] is True
    assert res_inside[0]["status"] == "Inside Zone"

    # Location far away
    outside_loc = (28.9, 77.5)
    res_outside = evaluate_vehicle_geofences(outside_loc, geofences)
    assert len(res_outside) == 1
    assert res_outside[0]["is_inside"] is False
    assert res_outside[0]["status"] == "Outside Zone"

def test_geofence_empty():
    assert evaluate_vehicle_geofences(None, []) == []
    assert evaluate_vehicle_geofences((28.6, 77.2), []) == []
