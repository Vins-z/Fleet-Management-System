import React, { useState, useEffect } from 'react';
import { getMaintenanceLogs, createMaintenanceLog, getVehicles } from '../services/api';
import { IconStethoscope, IconWrench, IconAlert, IconPlus, IconClose, IconRefresh } from './Icons';

const MaintenanceFuel = ({ showToast }) => {
  const [maintenanceLogs, setMaintenanceLogs] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showScheduleForm, setShowScheduleForm] = useState(false);

  const [newLog, setNewLog] = useState({
    vehicle_id: '',
    service_type: 'Oil Change & Filter Replacement',
    due_date: '2026-11-25',
    notes: 'Standard 20,000 km scheduled maintenance.',
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [mRes, vRes] = await Promise.all([getMaintenanceLogs(), getVehicles()]);
      if (mRes && mRes.maintenance) setMaintenanceLogs(mRes.maintenance);
      if (vRes && vRes.vehicles) {
        setVehicles(vRes.vehicles);
        if (vRes.vehicles.length > 0 && !newLog.vehicle_id) {
          setNewLog((prev) => ({ ...prev, vehicle_id: vRes.vehicles[0].id }));
        }
      }
    } catch (err) {
      console.warn('Backend unavailable, using initial maintenance records:', err.message);
      setMaintenanceLogs([
        { id: 1, vehicle_code: 'V104', vehicle_name: 'Heavy Hauler Delta', service_type: 'Brake Pad Replacement & Battery Inspection', status: 'Overdue', due_date: '2026-11-10', notes: 'Battery critical (18%). Service urgently required.' },
        { id: 2, vehicle_code: 'V101', vehicle_name: 'Delivery Truck Alpha', service_type: 'Scheduled 50,000 km Oil & Filter Change', status: 'Scheduled', due_date: '2026-11-20', notes: 'Routine checkup.' }
      ]);
      setVehicles([
        { id: 1, vehicle_id: 'V101', name: 'Delivery Truck Alpha' },
        { id: 2, vehicle_id: 'V102', name: 'Cargo Van Beta' },
        { id: 3, vehicle_id: 'V103', name: 'Express Sprinter Gamma' },
        { id: 4, vehicle_id: 'V104', name: 'Heavy Hauler Delta' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewLog((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newLog.vehicle_id) return;

    try {
      const res = await createMaintenanceLog(newLog);
      if (res && res.maintenance) {
        setMaintenanceLogs((prev) => [...prev, res.maintenance]);
        if (showToast) showToast('Preventive maintenance work order logged.');
      } else {
        const mockEntry = {
          id: Date.now(),
          vehicle_code: `V10${newLog.vehicle_id}`,
          vehicle_name: 'Fleet Vehicle',
          service_type: newLog.service_type,
          status: 'Scheduled',
          due_date: newLog.due_date,
          notes: newLog.notes,
        };
        setMaintenanceLogs((prev) => [...prev, mockEntry]);
        if (showToast) showToast('Work order recorded locally.');
      }
      setShowScheduleForm(false);
    } catch (err) {
      if (showToast) showToast(`Error: ${err.message}`);
    }
  };

  return (
    <div className="maintenance-fuel-view">
      <div className="view-header">
        <div>
          <h2>Preventive Maintenance & Diagnostic Health</h2>
          <p>Fleet reliability auditing, scheduled service intervals, and health alerts.</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            onClick={loadData}
          >
            <IconRefresh size={14} />
            <span>Sync</span>
          </button>
          <button
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            onClick={() => setShowScheduleForm(!showScheduleForm)}
          >
            {showScheduleForm ? <IconClose size={14} /> : <IconPlus size={14} />}
            <span>{showScheduleForm ? 'Close Form' : 'Schedule Service'}</span>
          </button>
        </div>
      </div>

      {/* Apple Health Metric Tiles */}
      <div className="metric-grid" style={{ marginBottom: '24px' }}>
        <div className="metric-card">
          <div className="metric-card-top">
            <h3>Reliability Score</h3>
            <div className="metric-icon-bubble" style={{ background: 'var(--apple-green-light)', color: 'var(--apple-green)' }}>
              <IconStethoscope size={18} />
            </div>
          </div>
          <div className="metric-value" style={{ color: 'var(--apple-green)' }}>96.8%</div>
          <small>Fleet uptime rating</small>
        </div>

        <div className="metric-card">
          <div className="metric-card-top">
            <h3>Pending Work Orders</h3>
            <div className="metric-icon-bubble" style={{ background: 'var(--apple-orange-light)', color: 'var(--apple-orange)' }}>
              <IconWrench size={18} />
            </div>
          </div>
          <div className="metric-value">{maintenanceLogs.length}</div>
          <small>Active work tickets</small>
        </div>

        <div className="metric-card">
          <div className="metric-card-top">
            <h3>Critical / Overdue</h3>
            <div className="metric-icon-bubble" style={{ background: 'var(--apple-red-light)', color: 'var(--apple-red)' }}>
              <IconAlert size={18} />
            </div>
          </div>
          <div className="metric-value" style={{ color: 'var(--apple-red)' }}>
            {maintenanceLogs.filter((m) => m.status === 'Overdue').length}
          </div>
          <small>Immediate inspection needed</small>
        </div>
      </div>

      {/* Schedule Work Order Form */}
      {showScheduleForm && (
        <div className="form-card" style={{ animation: 'dynamicIslandIn 0.3s ease' }}>
          <h3 style={{ marginBottom: '16px', fontSize: '1.2rem' }}>Schedule Preventive Maintenance</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label>Select Fleet Asset *</label>
                <select
                  name="vehicle_id"
                  value={newLog.vehicle_id}
                  onChange={handleInputChange}
                  required
                >
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name} ({v.vehicle_id})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Diagnostic Work Order *</label>
                <select
                  name="service_type"
                  value={newLog.service_type}
                  onChange={handleInputChange}
                >
                  <option value="Oil Change & Filter Replacement">Oil Change & Filter Replacement</option>
                  <option value="Tire Rotation & Wheel Alignment">Tire Rotation & Wheel Alignment</option>
                  <option value="Brake Pad & Rotor Inspection">Brake Pad & Rotor Inspection</option>
                  <option value="Battery Health & Electrical Diagnostic">Battery Health & Electrical Diagnostic</option>
                  <option value="Transmission Fluid Flush">Transmission Fluid Flush</option>
                </select>
              </div>

              <div className="form-group">
                <label>Target Service Date *</label>
                <input
                  type="date"
                  name="due_date"
                  value={newLog.due_date}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '18px' }}>
              <label>Service Instructions & Workshop Notes</label>
              <textarea
                name="notes"
                rows="2"
                value={newLog.notes}
                onChange={handleInputChange}
                placeholder="Diagnostic codes, technician assignment, priority parts..."
              />
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="submit" className="btn btn-primary">
                Confirm Service Ticket
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowScheduleForm(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Maintenance Table */}
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Vehicle Asset</th>
              <th>Service Required</th>
              <th>Due Date</th>
              <th>Status</th>
              <th>Diagnostic Notes</th>
            </tr>
          </thead>
          <tbody>
            {loading && maintenanceLogs.length === 0 ? (
              <tr>
                <td colSpan="5" className="loading">Retrieving maintenance records...</td>
              </tr>
            ) : maintenanceLogs.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '36px', color: '#86868b' }}>
                  All fleet assets are fully certified. No maintenance scheduled.
                </td>
              </tr>
            ) : (
              maintenanceLogs.map((log) => (
                <tr key={log.id}>
                  <td>
                    <div style={{ fontWeight: '600' }}>
                      {log.vehicle_name || log.vehicle_code || `Asset #${log.vehicle_id}`}
                    </div>
                  </td>
                  <td>{log.service_type}</td>
                  <td style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>{log.due_date}</td>
                  <td>
                    <span className={`badge badge-${log.status.toLowerCase().replace(/\s+/g, '-')}`}>
                      {log.status}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-tertiary)', fontSize: '0.86rem' }}>
                    {log.notes || 'Standard checkup'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MaintenanceFuel;
