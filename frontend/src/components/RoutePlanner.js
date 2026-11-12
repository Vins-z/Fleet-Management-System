import React, { useState } from 'react';
import { optimizeRoute } from '../services/api';

const RoutePlanner = ({ showToast }) => {
  const [origin, setOrigin] = useState('28.7041, 77.1025');
  const [destination, setDestination] = useState('28.5355, 77.3910');
  const [trafficImpact, setTrafficImpact] = useState(1.2);
  const [loading, setLoading] = useState(false);
  const [routeResult, setRouteResult] = useState(null);

  const parseCoords = (str) => {
    const parts = str.split(',').map((p) => parseFloat(p.trim()));
    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      return parts;
    }
    return str.trim();
  };

  const handleOptimize = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        current_location: parseCoords(origin),
        destination: parseCoords(destination),
        traffic_data: { impact: parseFloat(trafficImpact) },
      };

      const res = await optimizeRoute(payload);
      if (res && res.optimized_route) {
        setRouteResult(res.optimized_route);
        if (showToast) showToast('Optimal navigational corridor calculated.');
      }
    } catch (err) {
      if (showToast) showToast(`Optimization Failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getTrafficDescriptor = (val) => {
    if (val <= 1.2) return { text: 'Free Flowing', color: 'var(--apple-green)' };
    if (val <= 1.8) return { text: 'Moderate Density', color: 'var(--apple-orange)' };
    return { text: 'Heavy Congestion', color: 'var(--apple-red)' };
  };

  const trafficInfo = getTrafficDescriptor(trafficImpact);

  return (
    <div className="route-planner-view">
      <div className="view-header">
        <div>
          <h2>AI Route Studio</h2>
          <p>Navigational trajectory calculation, waypoint interpolation, and dynamic congestion impact modeling.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: '24px' }}>
        {/* Parameters Form Card */}
        <div className="apple-card" style={{ margin: 0 }}>
          <div className="apple-card-header">
            <h3>Corridor Configuration</h3>
          </div>

          <form onSubmit={handleOptimize}>
            <div className="form-group" style={{ marginBottom: '14px' }}>
              <label>Origin Coordinates / Departure Hub</label>
              <input
                type="text"
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                placeholder="28.7041, 77.1025"
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label>Destination Coordinates / Logistics Drop</label>
              <input
                type="text"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="28.5355, 77.3910"
                required
              />
            </div>

            {/* Apple Traffic Multiplier Slider */}
            <div className="form-group" style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label>Traffic Congestion Index</label>
                <span
                  style={{
                    fontSize: '0.8rem',
                    fontWeight: '600',
                    color: trafficInfo.color,
                  }}
                >
                  {trafficImpact}x · {trafficInfo.text}
                </span>
              </div>
              <input
                type="range"
                min="1.0"
                max="2.5"
                step="0.1"
                value={trafficImpact}
                onChange={(e) => setTrafficImpact(parseFloat(e.target.value))}
              />
            </div>

            {/* Apple Quick Presets */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '0.78rem', fontWeight: '600', color: 'var(--text-tertiary)', marginBottom: '8px' }}>
                PRESET CORRIDORS
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ padding: '4px 10px', fontSize: '0.8rem' }}
                  onClick={() => {
                    setOrigin('28.7041, 77.1025');
                    setDestination('28.5355, 77.3910');
                  }}
                >
                  North to East Terminal
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ padding: '4px 10px', fontSize: '0.8rem' }}
                  onClick={() => {
                    setOrigin('28.6139, 77.2090');
                    setDestination('28.4595, 77.0266');
                  }}
                >
                  Central to South Hub
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', padding: '12px' }}
              disabled={loading}
            >
              {loading ? 'Synthesizing Path...' : '🚀 Compute Optimal Route'}
            </button>
          </form>
        </div>

        {/* Route Diagnostics & Waypoint Card */}
        <div className="apple-card" style={{ margin: 0 }}>
          <div className="apple-card-header">
            <h3>Navigational Synthesis</h3>
            {routeResult && (
              <span className="badge badge-active">Optimized</span>
            )}
          </div>

          {routeResult ? (
            <div>
              {/* Metric Highlights */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px', marginBottom: '24px' }}>
                <div style={{ background: 'var(--surface-secondary)', padding: '16px', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: '600' }}>
                    Distance
                  </div>
                  <div style={{ fontSize: '1.7rem', fontWeight: '700', color: 'var(--text-primary)', marginTop: '4px' }}>
                    {routeResult.distance_km} <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>km</span>
                  </div>
                </div>

                <div style={{ background: 'var(--surface-secondary)', padding: '16px', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: '600' }}>
                    Est. Transit Time
                  </div>
                  <div style={{ fontSize: '1.7rem', fontWeight: '700', color: 'var(--apple-blue)', marginTop: '4px' }}>
                    {routeResult.estimated_time}
                  </div>
                </div>

                <div style={{ background: 'var(--surface-secondary)', padding: '16px', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: '600' }}>
                    Energy Draw
                  </div>
                  <div style={{ fontSize: '1.7rem', fontWeight: '700', color: 'var(--apple-green)', marginTop: '4px' }}>
                    ~{Math.round(routeResult.distance_km * 0.42)} <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>%</span>
                  </div>
                </div>
              </div>

              {/* Waypoint Stepper Timeline */}
              <h4 style={{ fontSize: '0.92rem', fontWeight: '600', marginBottom: '14px', color: 'var(--text-primary)' }}>
                Waypoint Trajectory
              </h4>

              <div style={{ position: 'relative', paddingLeft: '24px' }}>
                <div
                  style={{
                    position: 'absolute',
                    left: '8px',
                    top: '8px',
                    bottom: '8px',
                    width: '2px',
                    background: 'var(--border-strong)',
                  }}
                />

                {routeResult.waypoints && routeResult.waypoints.map((wp, i) => {
                  const isFirst = i === 0;
                  const isLast = i === routeResult.waypoints.length - 1;
                  const dotColor = isFirst ? 'var(--apple-green)' : isLast ? 'var(--apple-blue)' : '#cbd5e1';

                  return (
                    <div
                      key={i}
                      style={{
                        position: 'relative',
                        marginBottom: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div
                        style={{
                          position: 'absolute',
                          left: '-20px',
                          width: '10px',
                          height: '10px',
                          borderRadius: '50%',
                          background: dotColor,
                          border: '2px solid #fff',
                          boxShadow: '0 0 0 2px ' + dotColor,
                        }}
                      />
                      <div style={{ fontSize: '0.88rem', fontWeight: isFirst || isLast ? '600' : '400' }}>
                        {isFirst ? 'Departure Point' : isLast ? 'Destination Point' : `Waypoint ${i}`}
                      </div>
                      <div style={{ fontFamily: 'monospace', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                        {Array.isArray(wp) ? `${wp[0].toFixed(4)}°, ${wp[1].toFixed(4)}°` : String(wp)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#86868b' }}>
              <p>Configure origin and destination to compute optimal navigation telemetry.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RoutePlanner;
