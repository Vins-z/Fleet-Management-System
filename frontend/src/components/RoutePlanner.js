import React, { useState } from 'react';
import { optimizeRoute, optimizeVrpTour } from '../services/api';
import { IconCompass, IconZap, IconClose, IconPlus } from './Icons';

const RoutePlanner = ({ showToast }) => {
  const [plannerMode, setPlannerMode] = useState('vrp'); // 'vrp' or 'p2p'

  // Point to point state
  const [origin, setOrigin] = useState('28.7041, 77.1025');
  const [destination, setDestination] = useState('28.5355, 77.3910');
  const [trafficImpact, setTrafficImpact] = useState(1.2);
  const [loading, setLoading] = useState(false);
  const [routeResult, setRouteResult] = useState(null);

  // Multi-stop VRP tour state
  const [depotLocation, setDepotLocation] = useState('28.6139, 77.2090');
  const [stops, setStops] = useState([
    { id: 1, title: 'Sector 18 Retail Hub', latitude: 28.5670, longitude: 77.3210, priority: 3 },
    { id: 2, title: 'West Distribution Center', latitude: 28.6800, longitude: 77.1200, priority: 2 },
    { id: 3, title: 'Corporate Hardware Office', latitude: 28.4800, longitude: 77.0800, priority: 1 },
    { id: 4, title: 'North Logistics Terminal', latitude: 28.7041, longitude: 77.1025, priority: 2 },
  ]);
  const [vrpResult, setVrpResult] = useState(null);

  const parseCoords = (str) => {
    const parts = str.split(',').map((p) => parseFloat(p.trim()));
    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      return parts;
    }
    return str.trim();
  };

  const handleOptimizeP2P = async (e) => {
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
        if (showToast) showToast('Optimal corridor calculated.');
      }
    } catch (err) {
      if (showToast) showToast(`Optimization Failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleOptimizeVRP = async () => {
    setLoading(true);
    try {
      const depot = parseCoords(depotLocation);
      const res = await optimizeVrpTour({
        start_location: depot,
        stops: stops,
      });
      if (res && res.status === 'success') {
        setVrpResult(res);
        if (showToast) {
          showToast(`Multi-stop tour optimized (${res.total_distance_km} km across ${res.total_stops} delivery stops).`);
        }
      }
    } catch (err) {
      if (showToast) showToast(`VRP Optimizer Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const addStop = () => {
    const newStop = {
      id: stops.length + 1,
      title: `Dropoff Point #${stops.length + 1}`,
      latitude: Number((28.5 + Math.random() * 0.2).toFixed(4)),
      longitude: Number((77.1 + Math.random() * 0.25).toFixed(4)),
      priority: 2,
    };
    setStops([...stops, newStop]);
  };

  const removeStop = (id) => {
    setStops(stops.filter((s) => s.id !== id));
  };

  return (
    <div className="route-planner-view">
      <div className="view-header">
        <div>
          <h2>AI Route Studio & Multi-Stop Dispatch</h2>
          <p>Heuristic Vehicle Routing Problem (VRP) sequencing, turn-by-turn waypoints, and carbon modeling.</p>
        </div>

        {/* Mode Selector */}
        <div className="segmented-control">
          <button
            className={plannerMode === 'vrp' ? 'active' : ''}
            onClick={() => setPlannerMode('vrp')}
          >
            Multi-Stop VRP Tour
          </button>
          <button
            className={plannerMode === 'p2p' ? 'active' : ''}
            onClick={() => setPlannerMode('p2p')}
          >
            Corridor Simulator (P2P)
          </button>
        </div>
      </div>

      {plannerMode === 'vrp' ? (
        /* Multi-Stop VRP Optimizer Mode */
        <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1.9fr', gap: '24px' }}>
          {/* Manifest Controls */}
          <div className="apple-card" style={{ margin: 0 }}>
            <div className="apple-card-header">
              <h3>Delivery Manifest (Stops)</h3>
              <button
                className="btn btn-secondary"
                style={{ padding: '4px 10px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '5px' }}
                onClick={addStop}
              >
                <IconPlus size={13} />
                <span>Add Stop</span>
              </button>
            </div>

            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label>Depot / Vehicle Starting Location</label>
              <input
                type="text"
                value={depotLocation}
                onChange={(e) => setDepotLocation(e.target.value)}
                placeholder="28.6139, 77.2090"
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px', maxHeight: '340px', overflowY: 'auto' }}>
              {stops.map((stop, i) => (
                <div
                  key={stop.id}
                  style={{
                    background: 'var(--surface-secondary)',
                    padding: '12px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: '600', fontSize: '0.88rem' }}>{stop.title}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                      GPS: {stop.latitude}, {stop.longitude} · Priority: {stop.priority}
                    </div>
                  </div>
                  {stops.length > 1 && (
                    <button
                      className="btn btn-secondary"
                      style={{ padding: '2px 6px', fontSize: '0.75rem', color: 'var(--apple-red)', display: 'flex', alignItems: 'center' }}
                      onClick={() => removeStop(stop.id)}
                      title="Remove stop"
                    >
                      <IconClose size={12} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <button
              className="btn btn-primary"
              style={{ width: '100%', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              onClick={handleOptimizeVRP}
              disabled={loading}
            >
              <IconZap size={16} />
              <span>{loading ? 'Synthesizing VRP Permutation...' : 'Optimize Multi-Stop Tour'}</span>
            </button>
          </div>

          {/* VRP Tour Synthesis Output */}
          <div className="apple-card" style={{ margin: 0 }}>
            <div className="apple-card-header">
              <h3>VRP Tour Synthesis & Emissions Audit</h3>
              {vrpResult && <span className="badge badge-active">Optimal Sequence</span>}
            </div>

            {vrpResult ? (
              <div>
                {/* Highlights */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '24px' }}>
                  <div style={{ background: 'var(--surface-secondary)', padding: '14px', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: '600' }}>
                      Total Distance
                    </div>
                    <div style={{ fontSize: '1.6rem', fontWeight: '700', color: 'var(--text-primary)', marginTop: '4px' }}>
                      {vrpResult.total_distance_km} <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>km</span>
                    </div>
                  </div>

                  <div style={{ background: 'var(--surface-secondary)', padding: '14px', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: '600' }}>
                      Total Tour Duration
                    </div>
                    <div style={{ fontSize: '1.6rem', fontWeight: '700', color: 'var(--apple-blue)', marginTop: '4px' }}>
                      {vrpResult.total_duration_mins} <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>mins</span>
                    </div>
                  </div>

                  <div style={{ background: 'var(--surface-secondary)', padding: '14px', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: '600' }}>
                      Fuel Burn
                    </div>
                    <div style={{ fontSize: '1.6rem', fontWeight: '700', color: 'var(--apple-orange)', marginTop: '4px' }}>
                      {vrpResult.fuel_estimate_liters} <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>L</span>
                    </div>
                  </div>

                  <div style={{ background: 'var(--surface-secondary)', padding: '14px', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: '600' }}>
                      ESG Carbon Output
                    </div>
                    <div style={{ fontSize: '1.6rem', fontWeight: '700', color: 'var(--apple-green)', marginTop: '4px' }}>
                      {vrpResult.co2_kg_estimate} <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>kg</span>
                    </div>
                  </div>
                </div>

                {/* Ordered Tour Sequence */}
                <h4 style={{ fontSize: '0.94rem', fontWeight: '600', marginBottom: '12px' }}>
                  Tour Delivery Legs (Optimal Stop Order)
                </h4>

                <div className="table-container" style={{ margin: 0 }}>
                  <table>
                    <thead>
                      <tr>
                        <th>Sequence</th>
                        <th>Destination Stop</th>
                        <th>Leg Distance</th>
                        <th>Est. Transit Time</th>
                        <th>Coordinates</th>
                      </tr>
                    </thead>
                    <tbody>
                      {vrpResult.legs.map((leg) => (
                        <tr key={leg.leg_number}>
                          <td>
                            <span className="badge badge-in-use">Stop #{leg.leg_number}</span>
                          </td>
                          <td><strong>{leg.destination_title}</strong></td>
                          <td>{leg.distance_km} km</td>
                          <td>{leg.estimated_mins} mins</td>
                          <td style={{ fontFamily: 'monospace', fontSize: '0.82rem' }}>
                            {leg.to_coord[0]}°, {leg.to_coord[1]}°
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '80px 20px', color: '#86868b' }}>
                <p>Add stops to the manifest and click <strong>Optimize Multi-Stop Tour</strong> to run the Vehicle Routing Problem (VRP) engine.</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Point to Point Corridor Mode */
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: '24px' }}>
          <div className="apple-card" style={{ margin: 0 }}>
            <div className="apple-card-header">
              <h3>Point-to-Point Corridor</h3>
            </div>
            <form onSubmit={handleOptimizeP2P}>
              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label>Origin Coordinates</label>
                <input
                  type="text"
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  placeholder="28.7041, 77.1025"
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label>Destination Coordinates</label>
                <input
                  type="text"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="28.5355, 77.3910"
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label>Traffic Congestion Multiplier: <strong>{trafficImpact}x</strong></label>
                <input
                  type="range"
                  min="1.0"
                  max="2.5"
                  step="0.1"
                  value={trafficImpact}
                  onChange={(e) => setTrafficImpact(parseFloat(e.target.value))}
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                disabled={loading}
              >
                <IconCompass size={16} />
                <span>{loading ? 'Synthesizing Path...' : 'Compute Corridor'}</span>
              </button>
            </form>
          </div>

          <div className="apple-card" style={{ margin: 0 }}>
            <div className="apple-card-header">
              <h3>Corridor Telemetry</h3>
            </div>
            {routeResult ? (
              <div>
                <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
                  <div>Distance: <strong>{routeResult.distance_km} km</strong></div>
                  <div>ETA: <strong style={{ color: 'var(--apple-blue)' }}>{routeResult.estimated_time}</strong></div>
                </div>
                <ol style={{ paddingLeft: '20px', fontSize: '0.88rem' }}>
                  {routeResult.waypoints && routeResult.waypoints.map((wp, i) => (
                    <li key={i} style={{ marginBottom: '4px' }}>
                      Waypoint {i + 1}: [{Array.isArray(wp) ? `${wp[0]}, ${wp[1]}` : String(wp)}]
                    </li>
                  ))}
                </ol>
              </div>
            ) : (
              <p style={{ color: '#86868b', padding: '60px 0', textAlign: 'center' }}>
                Configure endpoints to calculate single-corridor navigation.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default RoutePlanner;
