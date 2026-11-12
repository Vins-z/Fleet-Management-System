import pytest
from services.vrp_optimizer import optimize_vrp_tour

def test_vrp_optimize_basic():
    start = (28.6139, 77.2090)
    stops = [
        {"id": 1, "title": "Customer North", "latitude": 28.7041, "longitude": 77.1025, "priority": 1},
        {"id": 2, "title": "Customer East", "latitude": 28.5355, "longitude": 77.3910, "priority": 2},
        {"id": 3, "title": "Customer West", "latitude": 28.4595, "longitude": 77.0266, "priority": 3},
    ]

    result = optimize_vrp_tour(start, stops)
    assert result["status"] == "success"
    assert result["total_stops"] == 3
    assert result["total_distance_km"] > 0
    assert len(result["ordered_stops"]) == 3
    assert len(result["legs"]) == 3
    assert result["fuel_estimate_liters"] > 0
    assert result["co2_kg_estimate"] > 0

def test_vrp_empty_inputs():
    with pytest.raises(ValueError):
        optimize_vrp_tour(None, [])

    with pytest.raises(ValueError):
        optimize_vrp_tour((28.6, 77.2), [])

def test_vrp_single_stop():
    start = (28.6139, 77.2090)
    stops = [{"id": 1, "title": "Solo Stop", "latitude": 28.65, "longitude": 77.22}]
    result = optimize_vrp_tour(start, stops)
    assert result["total_stops"] == 1
    assert len(result["legs"]) == 1

