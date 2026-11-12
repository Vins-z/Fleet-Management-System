import React, { useState, useEffect } from 'react';
import { getMaintenanceLogs, createMaintenanceLog, getVehicles } from '../services/api';

const MaintenanceFuel = () => {
  const [maintenanceLogs, setMaintenanceLogs] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

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
    if (!newLog.vehicle_id) {
      setError('Please select a vehicle.');
      return;
    }

    try {
      setError('');
      setMessage('');
      const res = await createMaintenanceLog(newLog);
      if (res && res.maintenance) {
        setMaintenanceLogs((prev) => [...prev, res.maintenance]);
        setMessage('Service appointment scheduled successfully.');
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
        setMessage('Service appointment recorded locally.');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="maintenance-fuel-view">
      <div className="view-header">
        <div>
          <h2>Preventive Maintenance & Fleet Health</h2>
          <p>Schedule proactive maintenance tasks, monitor vehicle health alerts, and track operational readiness.</p>
        </div>
        <button className="btn btn-secondary" onClick={loadData}>
          ↻ Refresh Schedules
        </button>
      </div>

      {message && <div className="success-banner">{message}</div>}
      {error && <div className="error-banner">{error}</div>}

      <div className="form-card">
        <h3 style={{ marginBottom: '14px', color: '#0f172a' }}>Schedule Vehicle Maintenance</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label>Target Vehicle *</label>
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
              <label>Service Type *</label>
              <select
                name="service_type"
                value={newLog.service_type}
                onChange={handleInputChange}
              >
                <option value="Oil Change & Filter Replacement">Oil Change & Filter Replacement</option>
                <option value="Tire Rotation & Wheel Alignment">Tire Rotation & Wheel Alignment</option>
                <option value="Brake System Inspection">Brake System Inspection</option>
                <option value="Battery Health & Electrical Diagnostic">Battery Health & Electrical Diagnostic</option>
                <option value="Transmission Fluid Flush">Transmission Fluid Flush</option>
              </select>
            </div>

            <div className="form-group">
              <label>Target Due Date *</label>
              <input
                type="date"
                name="due_date"
                value={newLog.due_date}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label>Service Instructions & Diagnostic Notes</label>
            <textarea
              name="notes"
              rows="2"
              value={newLog.notes}
              onChange={handleInputChange}
              placeholder="Technician details, parts required, symptoms reported..."
            />
          </div>

          <button type="submit" className="btn btn-primary">
            + Schedule Maintenance Work Order
          </button>
        </form>
      </div>

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
                <td colSpan="5" className="loading">Loading maintenance ledger...</td>
              </tr>
            ) : (
              maintenanceLogs.map((log) => (
                <tr key={log.id}>
                  <td><strong>{log.vehicle_name || log.vehicle_code || `Vehicle #${log.vehicle_id}`}</strong></td>
                  <td>{log.service_type}</td>
                  <td>{log.due_date}</td>
                  <td>
                    <span className={`badge badge-${log.status.toLowerCase().replace(/\s+/g, '-')}`}>
                      {log.status}
                    </span>
                  </td>
                  <td style={{ color: '#64748b' }}>{log.notes || 'Routine checkup'}</td>
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

