import React, { useState } from 'react';
import { optimizeRoute } from '../services/api';

const RoutePlanner = () => {
  const [origin, setOrigin] = useState('28.7041, 77.1025');
  const [destination, setDestination] = useState('28.5355, 77.3910');
  const [trafficImpact, setTrafficImpact] = useState(1.2);
  const [loading, setLoading] = useState(false);
  const [routeResult, setRouteResult] = useState(null);
  const [error, setError] = useState('');

  const parseCoords = (str) => {
    const parts = str.split(',').map((p) => parseFloat(p.trim()));
    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      return parts;
    }
    return str.trim(); // fallback to string landmark name
  };

  const handleOptimize = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const startCoord = parseCoords(origin);
      const destCoord = parseCoords(destination);

      const payload = {
        current_location: startCoord,
        destination: destCoord,
        traffic_data: { impact: parseFloat(trafficImpact) },
      };

      const res = await optimizeRoute(payload);
      if (res && res.optimized_route) {
        setRouteResult(res.optimized_route);
      }
    } catch (err) {
      setError(err.message || 'Route optimization failed.');
    } finally {
      setLoading(false);
    }
  };

  const setQuickRoute = (orig, dest) => {
    setOrigin(orig);
    setDestination(dest);
  };

  return (
    <div className="route-planner-view">
      <div className="view-header">
        <div>
          <h2>AI-Assisted Route Optimization</h2>
          <p>Compute optimal transit routes, predict trip duration, and adjust for traffic congestion in real time.</p>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="card-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
        {/* Form Card */}
        <div className="form-card" style={{ margin: 0 }}>
          <h3 style={{ marginBottom: '14px', color: '#0f172a' }}>Route Parameters</h3>
          <form onSubmit={handleOptimize}>
            <div className="form-group" style={{ marginBottom: '12px' }}>
              <label>Origin Coordinates (Latitude, Longitude)</label>
              <input
                type="text"
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                placeholder="28.7041, 77.1025"
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: '12px' }}>
              <label>Destination Coordinates (Latitude, Longitude)</label>
              <input
                type="text"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="28.5355, 77.3910"
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label>
                Traffic Congestion Multiplier: <strong>{trafficImpact}x</strong>
              </label>
              <input
                type="range"
                min="1.0"
                max="2.5"
                step="0.1"
                value={trafficImpact}
                onChange={(e) => setTrafficImpact(e.target.value)}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#64748b' }}>
                <span>1.0x (Clear)</span>
                <span>1.5x (Moderate)</span>
                <span>2.5x (Heavy Gridlock)</span>
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <small style={{ color: '#64748b' }}>Quick Presets: </small>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ padding: '3px 8px', fontSize: '0.8rem', marginRight: '6px' }}
                onClick={() => setQuickRoute('28.7041, 77.1025', '28.5355, 77.3910')}
              >
                North to East Hub
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ padding: '3px 8px', fontSize: '0.8rem' }}
                onClick={() => setQuickRoute('28.6139, 77.2090', '28.4595, 77.0266')}
              >
                Central to West Terminal
              </button>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
              {loading ? 'Calculating Path...' : '🚀 Calculate Optimal Route'}
            </button>
          </form>
        </div>

        {/* Results Card */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ marginBottom: '14px', color: '#0f172a' }}>Optimization Diagnostics</h3>

          {routeResult ? (
            <div>
              <div className="metric-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div className="metric-card" style={{ padding: '14px' }}>
                  <h3>Total Distance</h3>
                  <div className="metric-value" style={{ fontSize: '1.6rem' }}>
                    {routeResult.distance_km} <span className="metric-unit">km</span>
                  </div>
                </div>
                <div className="metric-card" style={{ padding: '14px' }}>
                  <h3>Estimated Transit Time</h3>
                  <div className="metric-value" style={{ fontSize: '1.6rem', color: '#2563eb' }}>
                    {routeResult.estimated_time}
                  </div>
                </div>
              </div>

              <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <h4 style={{ fontSize: '0.92rem', marginBottom: '8px', color: '#0f172a' }}>Calculated Waypoints</h4>
                <ol style={{ paddingLeft: '20px', fontSize: '0.88rem', color: '#334155' }}>
                  {routeResult.waypoints && routeResult.waypoints.map((wp, i) => (
                    <li key={i} style={{ marginBottom: '4px' }}>
                      Waypoint {i + 1}: [{Array.isArray(wp) ? `${wp[0]}, ${wp[1]}` : String(wp)}]
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8' }}>
              <p>Configure coordinates and click <strong>Calculate Optimal Route</strong> to view path telemetry.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RoutePlanner;

