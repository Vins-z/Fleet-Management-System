import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { getVehicles } from '../services/api';

// Create Apple Maps style pill marker
const createApplePin = (v, isSelected) => {
  let color = '#0071e3'; // Apple Blue for Active
  if (v.status === 'Maintenance Due') color = '#ff3b30'; // Apple Red
  if (v.status === 'Idle') color = '#ff9500'; // Apple Orange

  const html = `
    <div style="
      background: #ffffff;
      border: 2px solid ${color};
      color: #1d1d1f;
      padding: 4px 10px;
      border-radius: 9999px;
      font-size: 11px;
      font-weight: 600;
      box-shadow: 0 4px 14px rgba(0,0,0,0.18);
      display: flex;
      align-items: center;
      gap: 6px;
      white-space: nowrap;
      transform: ${isSelected ? 'scale(1.15)' : 'scale(1)'};
      transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    ">
      <span style="width: 8px; height: 8px; border-radius: 50%; background: ${color};"></span>
      <span>${v.vehicle_id}</span>
      <span style="color: #86868b; font-weight: 500;">${Math.round(v.battery_level)}%</span>
    </div>
  `;

  return L.divIcon({
    html: html,
    className: 'custom-apple-pin',
    iconSize: [80, 28],
    iconAnchor: [40, 14],
  });
};

const FleetMap = ({ liveSimulation, showToast }) => {
  const [vehicles, setVehicles] = useState([]);
  const [filter, setFilter] = useState('All');
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [center, setCenter] = useState([28.6139, 77.209]);

  const loadVehicles = async () => {
    try {
      setLoading(true);
      const res = await getVehicles();
      if (res && res.vehicles && res.vehicles.length > 0) {
        setVehicles(res.vehicles);
        setSelectedVehicle(res.vehicles[0]);
        const lats = res.vehicles.map((v) => v.latitude);
        const lons = res.vehicles.map((v) => v.longitude);
        setCenter([
          (Math.min(...lats) + Math.max(...lats)) / 2,
          (Math.min(...lons) + Math.max(...lons)) / 2,
        ]);
      }
    } catch (err) {
      console.warn('Backend unavailable, using default fleet coordinates:', err.message);
      const fallback = [
        { id: 1, vehicle_id: 'V101', name: 'Delivery Truck Alpha', model: 'Freightliner M2', status: 'Active', battery_level: 88, fuel_level: 75, latitude: 28.7041, longitude: 77.1025, driver_name: 'John Doe' },
        { id: 2, vehicle_id: 'V102', name: 'Cargo Van Beta', model: 'Ford Transit', status: 'Active', battery_level: 92, fuel_level: 85, latitude: 28.5355, longitude: 77.3910, driver_name: 'Jane Smith' },
        { id: 3, vehicle_id: 'V103', name: 'Express Sprinter Gamma', model: 'Mercedes Sprinter', status: 'Idle', battery_level: 45, fuel_level: 30, latitude: 28.4595, longitude: 77.0266, driver_name: 'Unassigned' },
        { id: 4, vehicle_id: 'V104', name: 'Heavy Hauler Delta', model: 'Volvo VNL', status: 'Maintenance Due', battery_level: 18, fuel_level: 20, latitude: 28.6139, longitude: 77.2090, driver_name: 'Unassigned' },
        { id: 5, vehicle_id: 'V105', name: 'City Courier Epsilon', model: 'Nissan e-NV200', status: 'Active', battery_level: 78, fuel_level: 90, latitude: 28.6500, longitude: 77.2300, driver_name: 'Alex Brown' },
      ];
      setVehicles(fallback);
      setSelectedVehicle(fallback[0]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVehicles();
  }, []);

  // Dynamic Telemetry Simulation: subtle real-time drift for vehicles when active
  useEffect(() => {
    if (!liveSimulation) return;
    const interval = setInterval(() => {
      setVehicles((prev) =>
        prev.map((v) => {
          if (v.status !== 'Active') return v;
          const latDrift = (Math.random() - 0.5) * 0.0012;
          const lonDrift = (Math.random() - 0.5) * 0.0012;
          return {
            ...v,
            latitude: Number((v.latitude + latDrift).toFixed(5)),
            longitude: Number((v.longitude + lonDrift).toFixed(5)),
          };
        })
      );
    }, 3500);

    return () => clearInterval(interval);
  }, [liveSimulation]);

  const filteredVehicles = vehicles.filter((v) => {
    if (filter === 'All') return true;
    return v.status === filter;
  });

  // Simulated delivery paths for active vehicles
  const deliveryTrails = vehicles
    .filter((v) => v.status === 'Active')
    .map((v) => [
      [v.latitude, v.longitude],
      [v.latitude + 0.04, v.longitude + 0.035],
    ]);

  return (
    <div className="fleet-map-view">
      <div className="view-header">
        <div>
          <h2>Real-Time Fleet Geotracking</h2>
          <p>Live satellite telemetry displaying geospatial positions, battery reserves, and transit corridors.</p>
        </div>

        {/* Apple Filter Pills */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {['All', 'Active', 'Idle', 'Maintenance Due'].map((category) => (
            <button
              key={category}
              className={`btn ${filter === category ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '6px 14px', fontSize: '0.84rem' }}
              onClick={() => setFilter(category)}
            >
              {category}
            </button>
          ))}
          <button
            className="btn btn-secondary"
            style={{ padding: '6px 14px', fontSize: '0.84rem' }}
            onClick={() => {
              loadVehicles();
              if (showToast) showToast('GPS coordinates updated via satellite.');
            }}
          >
            ↻ Sync
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2.5fr 1fr', gap: '20px' }}>
        {/* Leaflet Map Card */}
        <div className="fleet-map-container" style={{ height: '560px' }}>
          {loading ? (
            <div className="loading" style={{ paddingTop: '200px' }}>
              Acquiring satellite telemetry...
            </div>
          ) : (
            <MapContainer
              center={center}
              zoom={10}
              scrollWheelZoom={false}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
                url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
              />

              {/* Active Route Trails */}
              {deliveryTrails.map((coords, i) => (
                <Polyline
                  key={i}
                  positions={coords}
                  color="#0071e3"
                  weight={3}
                  opacity={0.65}
                  dashArray="6, 8"
                />
              ))}

              {filteredVehicles.map((v) => (
                <Marker
                  key={v.id || v.vehicle_id}
                  position={[v.latitude, v.longitude]}
                  icon={createApplePin(v, selectedVehicle?.vehicle_id === v.vehicle_id)}
                  eventHandlers={{
                    click: () => {
                      setSelectedVehicle(v);
                      if (showToast) showToast(`Inspecting telemetry for ${v.name}`);
                    },
                  }}
                >
                  <Popup>
                    <div style={{ padding: '4px', minWidth: '160px' }}>
                      <strong style={{ fontSize: '13px' }}>{v.name}</strong>
                      <div style={{ color: '#86868b', fontSize: '11px', marginBottom: '6px' }}>{v.model}</div>
                      <div style={{ fontSize: '12px', margin: '2px 0' }}>Driver: <strong>{v.driver_name || 'Unassigned'}</strong></div>
                      <div style={{ fontSize: '12px', margin: '2px 0' }}>Battery: <strong>{Math.round(v.battery_level)}%</strong></div>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          )}
        </div>

        {/* Apple Vehicle Telemetry Inspector Card */}
        <div className="apple-card" style={{ margin: 0, display: 'flex', flexDirection: 'column' }}>
          <div className="apple-card-header">
            <h3>Asset Telemetry</h3>
            {selectedVehicle && (
              <span className={`badge badge-${selectedVehicle.status.toLowerCase().replace(/\s+/g, '-')}`}>
                {selectedVehicle.status}
              </span>
            )}
          </div>

          {selectedVehicle ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <h4 style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                  {selectedVehicle.name}
                </h4>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  VIN / Code: <strong>{selectedVehicle.vehicle_id}</strong> · {selectedVehicle.model}
                </p>
              </div>

              {/* Battery Gauge */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '6px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Battery State of Charge</span>
                  <strong style={{ color: selectedVehicle.battery_level > 20 ? 'var(--apple-green)' : 'var(--apple-red)' }}>
                    {Math.round(selectedVehicle.battery_level)}%
                  </strong>
                </div>
                <div style={{ height: '8px', background: 'var(--surface-tertiary)', borderRadius: '9999px', overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${selectedVehicle.battery_level}%`,
                      background: selectedVehicle.battery_level > 20 ? 'var(--apple-green)' : 'var(--apple-red)',
                      transition: 'width 0.4s ease',
                    }}
                  />
                </div>
              </div>

              {/* Fuel Level */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '6px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Fuel Reserve</span>
                  <strong>{Math.round(selectedVehicle.fuel_level || 80)}%</strong>
                </div>
                <div style={{ height: '8px', background: 'var(--surface-tertiary)', borderRadius: '9999px', overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${selectedVehicle.fuel_level || 80}%`,
                      background: 'var(--apple-blue)',
                      transition: 'width 0.4s ease',
                    }}
                  />
                </div>
              </div>

              {/* Details List */}
              <div style={{ background: 'var(--surface-secondary)', padding: '14px', borderRadius: 'var(--radius-md)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.86rem', padding: '4px 0' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Assigned Driver</span>
                  <strong>{selectedVehicle.driver_name || 'Unassigned'}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.86rem', padding: '4px 0' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>GPS Latitude</span>
                  <span style={{ fontFamily: 'monospace' }}>{selectedVehicle.latitude.toFixed(4)}° N</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.86rem', padding: '4px 0' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>GPS Longitude</span>
                  <span style={{ fontFamily: 'monospace' }}>{selectedVehicle.longitude.toFixed(4)}° E</span>
                </div>
              </div>

              <button
                className="btn btn-primary"
                style={{ width: '100%', marginTop: 'auto' }}
                onClick={() => {
                  if (showToast) showToast(`Vehicle ${selectedVehicle.vehicle_id} flagged for prioritized dispatch.`);
                }}
              >
                Assign New Dispatch Order
              </button>
            </div>
          ) : (
            <p style={{ color: 'var(--text-secondary)', padding: '40px 0', textAlign: 'center' }}>
              Select a vehicle on the map to inspect live diagnostics.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default FleetMap;
