import React, { useState, useEffect } from 'react';
import { getGeofences, createGeofence, deleteGeofence, evaluateGeofences } from '../services/api';
import { IconPlus, IconClose, IconRadar } from './Icons';

const GeofenceManager = ({ showToast }) => {
  const [geofences, setGeofences] = useState([]);
  const [evaluations, setEvaluations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [evaluating, setEvaluating] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  const [newZone, setNewZone] = useState({
    name: '',
    zone_type: 'Warehouse',
    latitude: 28.6139,
    longitude: 77.2090,
    radius_km: 2.5,
    description: '',
  });

  const loadGeofences = async () => {
    try {
      setLoading(true);
      const res = await getGeofences();
      if (res && res.geofences) {
        setGeofences(res.geofences);
      }
    } catch (err) {
      console.warn('Backend unavailable, using initial geofences:', err.message);
      setGeofences([
        { id: 1, name: 'Central Distribution Hub', zone_type: 'Warehouse', latitude: 28.6139, longitude: 77.2090, radius_km: 3.5, description: 'Primary freight sorting terminal.' },
        { id: 2, name: 'North Cargo Terminal', zone_type: 'Depot', latitude: 28.7041, longitude: 77.1025, radius_km: 2.8, description: 'Heavy vehicle fleet depot.' },
        { id: 3, name: 'East Commercial District', zone_type: 'Customer Zone', latitude: 28.5355, longitude: 77.3910, radius_km: 4.2, description: 'Retail delivery zone.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGeofences();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewZone((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateZone = async (e) => {
    e.preventDefault();
    if (!newZone.name) return;

    try {
      const res = await createGeofence(newZone);
      if (res && res.geofence) {
        setGeofences((prev) => [...prev, res.geofence]);
        if (showToast) showToast(`Geofence boundary "${res.geofence.name}" activated.`);
      } else {
        const mockGf = { id: Date.now(), ...newZone };
        setGeofences((prev) => [...prev, mockGf]);
        if (showToast) showToast('Geofence zone added locally.');
      }
      setNewZone({
        name: '',
        zone_type: 'Warehouse',
        latitude: 28.6139,
        longitude: 77.2090,
        radius_km: 2.5,
        description: '',
      });
      setShowAddForm(false);
    } catch (err) {
      if (showToast) showToast(`Error: ${err.message}`);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteGeofence(id);
      setGeofences((prev) => prev.filter((g) => g.id !== id));
      if (showToast) showToast('Geofence boundary decommissioned.');
    } catch (err) {
      setGeofences((prev) => prev.filter((g) => g.id !== id));
    }
  };

  const handleEvaluate = async () => {
    try {
      setEvaluating(true);
      const res = await evaluateGeofences();
      if (res && res.fleet_evaluations) {
        setEvaluations(res.fleet_evaluations);
        if (showToast) showToast('Evaluated fleet compliance against all active geofences.');
      }
    } catch (err) {
      if (showToast) showToast(`Evaluation Error: ${err.message}`);
    } finally {
      setEvaluating(false);
    }
  };

  return (
    <div className="geofence-manager-view">
      <div className="view-header">
        <div>
          <h2>Geofencing & Boundary Governance</h2>
          <p>Define virtual geographic boundaries, warehouse perimeters, and monitor vehicle arrival/dwell events.</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            onClick={() => setShowAddForm(!showAddForm)}
          >
            {showAddForm ? <IconClose size={14} /> : <IconPlus size={14} />}
            <span>{showAddForm ? 'Close Form' : 'New Geofence'}</span>
          </button>
          <button
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            onClick={handleEvaluate}
            disabled={evaluating}
          >
            <IconRadar size={15} />
            <span>{evaluating ? 'Auditing Zones...' : 'Scan Fleet Compliance'}</span>
          </button>
        </div>
      </div>

      {/* Add Geofence Slide-down Form */}
      {showAddForm && (
        <div className="form-card" style={{ animation: 'dynamicIslandIn 0.3s ease' }}>
          <h3 style={{ marginBottom: '16px', fontSize: '1.2rem' }}>Define Virtual Boundary</h3>
          <form onSubmit={handleCreateZone}>
            <div className="form-grid">
              <div className="form-group">
                <label>Zone Name *</label>
                <input
                  type="text"
                  name="name"
                  placeholder="e.g. West Coast Distribution Depot"
                  value={newZone.name}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Perimeter Classification</label>
                <select name="zone_type" value={newZone.zone_type} onChange={handleInputChange}>
                  <option value="Warehouse">Warehouse Terminal</option>
                  <option value="Customer Zone">Customer Drop Cluster</option>
                  <option value="Depot">Maintenance Bay / Fleet Yard</option>
                  <option value="Restricted">Restricted Regulatory Zone</option>
                </select>
              </div>

              <div className="form-group">
                <label>Geofence Radius (km) *</label>
                <input
                  type="number"
                  step="0.1"
                  name="radius_km"
                  value={newZone.radius_km}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Center Latitude *</label>
                <input
                  type="number"
                  step="0.0001"
                  name="latitude"
                  value={newZone.latitude}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Center Longitude *</label>
                <input
                  type="number"
                  step="0.0001"
                  name="longitude"
                  value={newZone.longitude}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Operational Guidelines / Notes</label>
                <input
                  type="text"
                  name="description"
                  placeholder="Max dwell time, entry authorization..."
                  value={newZone.description}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="submit" className="btn btn-primary">
                Activate Perimeter
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowAddForm(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Geofence Registry Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '30px', color: 'var(--apple-gray-2)' }}>
          Auditing active perimeter telemetry...
        </div>
      ) : (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginBottom: '28px' }}>
        {geofences.map((gf) => {
          const typeColor =
            gf.zone_type === 'Warehouse' ? 'var(--apple-blue)' : gf.zone_type === 'Depot' ? 'var(--apple-purple)' : gf.zone_type === 'Restricted' ? 'var(--apple-red)' : 'var(--apple-green)';

          return (
            <div key={gf.id} className="apple-card" style={{ margin: 0, display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div>
                  <h3 style={{ fontSize: '1.18rem', fontWeight: '600', color: 'var(--text-primary)' }}>{gf.name}</h3>
                  <span
                    style={{
                      fontSize: '0.78rem',
                      fontWeight: '600',
                      color: typeColor,
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                    }}
                  >
                    ● {gf.zone_type}
                  </span>
                </div>
                <button
                  className="btn btn-secondary"
                  style={{ padding: '3px 6px', fontSize: '0.75rem', color: 'var(--apple-red)', display: 'flex', alignItems: 'center' }}
                  onClick={() => handleDelete(gf.id)}
                  title="Delete geofence"
                >
                  <IconClose size={12} />
                </button>
              </div>

              <div style={{ background: 'var(--surface-secondary)', padding: '12px 14px', borderRadius: 'var(--radius-md)', marginBottom: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', padding: '3px 0' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Perimeter Radius</span>
                  <strong>{gf.radius_km} km</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', padding: '3px 0' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Coordinates</span>
                  <span style={{ fontFamily: 'monospace' }}>{gf.latitude.toFixed(4)}°, {gf.longitude.toFixed(4)}°</span>
                </div>
              </div>

              {gf.description && (
                <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginTop: 'auto' }}>
                  {gf.description}
                </p>
              )}
            </div>
          );
        })}
      </div>
      )}

      {/* Fleet Zone Presence Audit */}
      {evaluations.length > 0 && (
        <div className="table-container" style={{ animation: 'dynamicIslandIn 0.3s ease' }}>
          <table>
            <thead>
              <tr>
                <th>Vehicle Asset</th>
                <th>Current GPS Location</th>
                <th>Active Geofence Status</th>
              </tr>
            </thead>
            <tbody>
              {evaluations.map((ev, i) => (
                <tr key={i}>
                  <td><strong>{ev.name} ({ev.vehicle_id})</strong></td>
                  <td style={{ fontFamily: 'monospace' }}>{ev.location[0].toFixed(4)}°, {ev.location[1].toFixed(4)}°</td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {ev.zones.map((z, j) => (
                        <span
                          key={j}
                          className={`badge ${z.is_inside ? 'badge-active' : 'badge-idle'}`}
                        >
                          {z.name}: {z.is_inside ? 'Inside Perimeter' : `${z.distance_from_center_km}km Away`}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default GeofenceManager;
