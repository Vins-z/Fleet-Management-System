from services.route_optimizer import optimize_route

def test_optimize_route_basic():
    # Test with basic inputs
    result = optimize_route("A", "B", {})
    assert "route" in result, "Route should be present in the result"
    assert "estimated_time" in result, "Estimated time should be present in the result"
    assert len(result['route']) >= 2, "Route should contain at least two waypoints"

def test_optimize_route_invalid_locations():
    # Test with invalid locations
    try:
        result = optimize_route("", "B", {})
    except ValueError as e:
        assert str(e) == "Current location and destination cannot be empty.", "Error message should be correct"

    try:
        result = optimize_route("A", "", {})
    except ValueError as e:
        assert str(e) == "Current location and destination cannot be empty.", "Error message should be correct"

def test_optimize_route_with_traffic_data():
    # Test with traffic data
    traffic_data = {"impact": 1.5}  # Higher traffic impact
    result = optimize_route("A", "B", traffic_data)
    assert "route" in result, "Route should be present in the result"
    assert "estimated_time" in result, "Estimated time should be present in the result"
    assert len(result['route']) >= 2, "Route should contain at least two waypoints"
    assert float(result['estimated_time'].split()[0]) > 10, "Estimated time should be longer with higher traffic impact"

def test_optimize_route_with_invalid_data():
    # Test with invalid traffic data
    try:
        result = optimize_route("A", "B", {"invalid_key": 1})
    except ValueError as e:
        assert str(e) == "Invalid traffic data format", "Error message should be correct"

    # Test with missing required data (no traffic data, just locations)
    result = optimize_route("A", "B", {})
    assert "route" in result
    assert "estimated_time" in result

# Run the tests
test_optimize_route_basic()
test_optimize_route_invalid_locations()
test_optimize_route_with_traffic_data()
test_optimize_route_with_invalid_data()

print("All tests passed successfully!")