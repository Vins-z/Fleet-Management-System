import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { getVehicles } from '../services/api';

// Create custom SVG marker pin
const createMarkerIcon = (status) => {
  let color = '#2563eb'; // Active: blue
  if (status === 'Maintenance Due') color = '#ef4444'; // Red
  if (status === 'Idle') color = '#f59e0b'; // Amber

  const svgHtml = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" width="32px" height="32px">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
    </svg>
  `;

  return L.divIcon({
    html: svgHtml,
    className: 'custom-leaflet-icon',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
};

const FleetMap = () => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [center, setCenter] = useState([28.6139, 77.209]); // Default center

  const loadVehicles = async () => {
    try {
      setLoading(true);
      const res = await getVehicles();
      if (res && res.vehicles && res.vehicles.length > 0) {
        setVehicles(res.vehicles);
        const lats = res.vehicles.map((v) => v.latitude);
        const lons = res.vehicles.map((v) => v.longitude);
        setCenter([
          (Math.min(...lats) + Math.max(...lats)) / 2,
          (Math.min(...lons) + Math.max(...lons)) / 2,
        ]);
      }
    } catch (err) {
      console.warn('Could not fetch live vehicles from API, using default fleet coordinates:', err.message);
      const fallbackVehicles = [
        { id: 1, vehicle_id: 'V101', name: 'Delivery Truck Alpha', status: 'Active', battery_level: 88, latitude: 28.7041, longitude: 77.1025, driver_name: 'John Doe' },
        { id: 2, vehicle_id: 'V102', name: 'Cargo Van Beta', status: 'Active', battery_level: 92, latitude: 28.5355, longitude: 77.3910, driver_name: 'Jane Smith' },
        { id: 3, vehicle_id: 'V103', name: 'Express Sprinter Gamma', status: 'Idle', battery_level: 45, latitude: 28.4595, longitude: 77.0266, driver_name: 'Alex Brown' },
        { id: 4, vehicle_id: 'V104', name: 'Heavy Hauler Delta', status: 'Maintenance Due', battery_level: 18, latitude: 28.6139, longitude: 77.2090, driver_name: 'Unassigned' },
      ];
      setVehicles(fallbackVehicles);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVehicles();
  }, []);

  return (
    <div className="fleet-map-view">
      <div className="view-header">
        <div>
          <h2>Real-Time Fleet Geotracking</h2>
          <p>Interactive telemetry tracking showing vehicle positions, battery levels, and operating status.</p>
        </div>
        <button className="btn btn-secondary" onClick={loadVehicles}>
          ↻ Refresh Fleet Positions
        </button>
      </div>

      <div className="card" style={{ padding: '12px' }}>
        {loading ? (
          <div className="loading">Acquiring satellite telemetry...</div>
        ) : (
          <MapContainer
            center={center}
            zoom={10}
            scrollWheelZoom={false}
            style={{ height: '520px', width: '100%', borderRadius: '8px' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {vehicles.map((v) => (
              <Marker
                key={v.id || v.vehicle_id}
                position={[v.latitude, v.longitude]}
                icon={createMarkerIcon(v.status)}
              >
                <Popup>
                  <div style={{ minWidth: '180px' }}>
                    <h4 style={{ margin: '0 0 6px 0', color: '#0f172a' }}>{v.name} ({v.vehicle_id})</h4>
                    <p style={{ margin: '2px 0' }}>
                      <strong>Status:</strong>{' '}
                      <span className={`badge badge-${v.status.toLowerCase().replace(/\s+/g, '-')}`}>
                        {v.status}
                      </span>
                    </p>
                    <p style={{ margin: '2px 0' }}>
                      <strong>Battery:</strong> {v.battery_level}%
                    </p>
                    <p style={{ margin: '2px 0' }}>
                      <strong>Driver:</strong> {v.driver_name || 'Unassigned'}
                    </p>
                    <p style={{ margin: '2px 0', fontSize: '0.8rem', color: '#64748b' }}>
                      GPS: {v.latitude.toFixed(4)}, {v.longitude.toFixed(4)}
                    </p>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        )}
      </div>
    </div>
  );
};

export default FleetMap;
