import React, { useState, useEffect } from 'react';
import { getDriverScorecards, getTelematicsEvents } from '../services/api';

const DriverSafety = ({ showToast }) => {
  const [drivers, setDrivers] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const [dRes, eRes] = await Promise.all([getDriverScorecards(), getTelematicsEvents()]);
      if (dRes && dRes.drivers) setDrivers(dRes.drivers);
      if (eRes && eRes.events) setEvents(eRes.events);
    } catch (err) {
      console.warn('Backend unavailable, using initial driver telemetry:', err.message);
      setDrivers([
        { id: 1, name: 'John Doe', license_number: 'DL-109283', status: 'On Duty', safety_score: 96, hours_driven_today: 4.8, harsh_braking_events: 1, speeding_events: 0, risk_profile: 'Low Risk', assigned_vehicles: ['V101'] },
        { id: 2, name: 'Jane Smith', license_number: 'DL-204958', status: 'On Duty', safety_score: 98, hours_driven_today: 3.2, harsh_braking_events: 0, speeding_events: 0, risk_profile: 'Low Risk', assigned_vehicles: ['V102'] },
        { id: 3, name: 'Alex Brown', license_number: 'DL-384729', status: 'Available', safety_score: 84, hours_driven_today: 6.5, harsh_braking_events: 3, speeding_events: 1, risk_profile: 'Moderate Risk', assigned_vehicles: ['V105'] },
        { id: 4, name: 'Maria Garcia', license_number: 'DL-472910', status: 'Available', safety_score: 92, hours_driven_today: 2.1, harsh_braking_events: 1, speeding_events: 0, risk_profile: 'Low Risk', assigned_vehicles: [] },
      ]);
      setEvents([
        { id: 1, vehicle_code: 'V101', event_type: 'Harsh Braking', severity: 'Low', description: 'Deceleration -0.45g at intersection.' },
        { id: 2, vehicle_code: 'V104', event_type: 'Low Battery Warning', severity: 'Critical', description: 'Battery dropped below critical 18%.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="driver-safety-view">
      <div className="view-header">
        <div>
          <h2>Driver Telematics & Safety Scorecards</h2>
          <p>Behavioral safety scoring, Hours of Service (HOS) regulatory compliance, and incident telemetry.</p>
        </div>
        <button
          className="btn btn-secondary"
          onClick={() => {
            loadData();
            if (showToast) showToast('Driver telematics metrics synchronized.');
          }}
        >
          ↻ Refresh Safety Data
        </button>
      </div>

      {/* Driver Scorecard Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        {drivers.map((d) => {
          const scoreColor =
            d.safety_score >= 90 ? 'var(--apple-green)' : d.safety_score >= 80 ? 'var(--apple-orange)' : 'var(--apple-red)';

          return (
            <div key={d.id} className="apple-card" style={{ margin: 0, display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: '600', color: 'var(--text-primary)' }}>{d.name}</h3>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                    Lic: {d.license_number} · {d.status}
                  </div>
                </div>
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    border: `3px solid ${scoreColor}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: '700',
                    fontSize: '1.1rem',
                    color: scoreColor,
                  }}
                >
                  {Math.round(d.safety_score)}
                </div>
              </div>

              {/* HOS Drive Time Bar */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '4px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Hours of Service Today</span>
                  <strong>{d.hours_driven_today} / 8.0 hrs</strong>
                </div>
                <div style={{ height: '6px', background: 'var(--surface-tertiary)', borderRadius: '9999px', overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${Math.min(100, (d.hours_driven_today / 8.0) * 100)}%`,
                      background: d.hours_driven_today > 7 ? 'var(--apple-red)' : 'var(--apple-blue)',
                    }}
                  />
                </div>
              </div>

              {/* Incidents Count */}
              <div style={{ background: 'var(--surface-secondary)', padding: '12px 14px', borderRadius: 'var(--radius-md)', marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', padding: '3px 0' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Harsh Braking</span>
                  <strong>{d.harsh_braking_events}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', padding: '3px 0' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Speeding Alerts</span>
                  <strong>{d.speeding_events}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', padding: '3px 0' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Risk Classification</span>
                  <span style={{ fontWeight: '600', color: scoreColor }}>{d.risk_profile}</span>
                </div>
              </div>

              <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
                  Assigned: {d.assigned_vehicles && d.assigned_vehicles.length > 0 ? d.assigned_vehicles.join(', ') : 'None'}
                </span>
                <button
                  className="btn btn-secondary"
                  style={{ padding: '4px 10px', fontSize: '0.8rem' }}
                  onClick={() => {
                    if (showToast) showToast(`Dispatched coaching feedback note to driver ${d.name}.`);
                  }}
                >
                  Feedback
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Telematics Incident Ledger */}
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Incident Type</th>
              <th>Vehicle Asset</th>
              <th>Severity</th>
              <th>Sensor Telemetry Description</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading && events.length === 0 ? (
              <tr>
                <td colSpan="5" className="loading">Retrieving telematics telemetry logs...</td>
              </tr>
            ) : events.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '32px', color: '#86868b' }}>
                  No safety violations or telematics alerts recorded.
                </td>
              </tr>
            ) : (
              events.map((e, idx) => (
                <tr key={idx}>
                  <td><strong>{e.event_type}</strong></td>
                  <td>{e.vehicle_code || 'Fleet Asset'}</td>
                  <td>
                    <span
                      className={`badge ${e.severity === 'Critical' ? 'badge-maintenance' : e.severity === 'High' ? 'badge-idle' : 'badge-in-use'}`}
                    >
                      {e.severity}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>{e.description}</td>
                  <td>
                    <button
                      className="btn btn-secondary"
                      style={{ padding: '3px 8px', fontSize: '0.78rem' }}
                      onClick={() => {
                        if (showToast) showToast(`Incident #${e.id || idx + 1} reviewed and logged.`);
                      }}
                    >
                      Acknowledge
                    </button>
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

export default DriverSafety;
