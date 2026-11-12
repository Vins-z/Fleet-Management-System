import pytest
from services.route_optimizer import optimize_route, ai_optimize_route

def test_optimize_route_basic():
    # Test with basic inputs
    result = optimize_route("A", "B", {})
    assert "route" in result, "Route should be present in the result"
    assert "estimated_time" in result, "Estimated time should be present in the result"
    assert len(result['route']) >= 2, "Route should contain at least two waypoints"

def test_optimize_route_invalid_locations():
    # Test with invalid locations
    with pytest.raises(ValueError) as excinfo:
        optimize_route("", "B", {})
    assert "Current location and destination cannot be empty." in str(excinfo.value)

    with pytest.raises(ValueError) as excinfo:
        optimize_route("A", "", {})
    assert "Current location and destination cannot be empty." in str(excinfo.value)

def test_optimize_route_with_traffic_data():
    # Test with traffic data
    traffic_data = {"impact": 1.5}  # Higher traffic impact
    result = optimize_route("A", "B", traffic_data)
    assert "route" in result, "Route should be present in the result"
    assert "estimated_time" in result, "Estimated time should be present in the result"
    assert len(result['route']) >= 2, "Route should contain at least two waypoints"
    assert float(result['estimated_time'].split()[0]) >= 10, "Estimated time should be longer with higher traffic impact"

def test_optimize_route_with_invalid_data():
    # Test with invalid traffic data
    with pytest.raises(ValueError) as excinfo:
        optimize_route("A", "B", {"invalid_key": 1})
    assert "Invalid traffic data format" in str(excinfo.value)

    # Test with missing required data (no traffic data, just locations)
    result = optimize_route("A", "B", {})
    assert "route" in result
    assert "estimated_time" in result

def test_optimize_route_coordinates():
    # Test with real coordinate tuples
    origin = (28.7041, 77.1025)
    dest = (28.5355, 77.3910)
    result = ai_optimize_route(origin, dest, {"impact": 1.2})
    assert "distance_km" in result
    assert result["distance_km"] > 0
    assert "waypoints" in result
    assert len(result["waypoints"]) >= 5

if __name__ == '__main__':
    test_optimize_route_basic()
    test_optimize_route_invalid_locations()
    test_optimize_route_with_traffic_data()
    test_optimize_route_with_invalid_data()
    test_optimize_route_coordinates()
    print("All route optimizer tests passed successfully!")
