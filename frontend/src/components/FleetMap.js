import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import "./styles.css";

// Mock data for vehicle locations
const mockFleetData = [
  {
    id: "V123",
    name: "Truck A",
    latitude: 28.7041,
    longitude: 77.1025,
    status: "Active",
  },
  {
    id: "V124",
    name: "Van B",
    latitude: 28.5355,
    longitude: 77.391,
    status: "Maintenance Due",
  },
  {
    id: "V125",
    name: "Car C",
    latitude: 28.4595,
    longitude: 77.0266,
    status: "Idle",
  },
];

// Custom Marker Icon
const vehicleIcon = L.icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/854/854878.png", // Replace with a custom icon URL
  iconSize: [30, 30],
  iconAnchor: [15, 30],
  popupAnchor: [0, -30],
});

const FleetMap = () => {
  const [fleetData, setFleetData] = useState([]);
  const [center, setCenter] = useState([28.6139, 77.209]); // Initial center of the map

  useEffect(() => {
    // Simulate API call
    const fetchFleetData = async () => {
      // Replace with actual API call
      await new Promise((resolve) => setTimeout(resolve, 500)); // Simulated delay
      setFleetData(mockFleetData);

      // Calculate the center of the map based on fleet data
      if (mockFleetData.length > 0) {
        const latitudes = mockFleetData.map(vehicle => vehicle.latitude);
        const longitudes = mockFleetData.map(vehicle => vehicle.longitude);
        const newCenter = [
          (Math.min(...latitudes) + Math.max(...latitudes)) / 2,
          (Math.min(...longitudes) + Math.max(...longitudes)) / 2,
        ];
        setCenter(newCenter);
      }
    };
    fetchFleetData();
  }, []);

  return (
    <div className="fleet-map-container">
      <h2>Fleet Map</h2>
      {fleetData.length > 0 ? (
        <MapContainer
          center={center} // Dynamic center based on fleet data
          zoom={10}
          style={{ height: "500px", width: "100%", borderRadius: "8px" }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          {fleetData.map((vehicle) => (
            <Marker
              key={vehicle.id}
              position={[vehicle.latitude, vehicle.longitude]}
              icon={vehicleIcon}
            >
              <Popup>
                <strong>{vehicle.name}</strong>
                <br />
                Status: {vehicle.status}
                <br />
                Location: {vehicle.latitude.toFixed(4)}, {vehicle.longitude.toFixed(4)}
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      ) : (
        <div className="loading">Loading fleet data...</div>
      )}
    </div>
  );
};

export default FleetMap;