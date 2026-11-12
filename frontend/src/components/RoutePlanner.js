import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { optimizeRoute, optimizeVrpTour } from '../services/api';
import { IconCompass, IconZap, IconClose, IconPlus, IconSearch, IconMap } from './Icons';

// Comprehensive catalog of commercial hubs and logistics distribution points
const LOGISTICS_HUBS = [
  { name: 'Central Logistics Fulfillment Hub', type: 'Fulfillment Hub', coords: [28.6139, 77.2090], address: 'Connaught Place Ring Corridor, New Delhi' },
  { name: 'Indira Gandhi Cargo Terminal (IGI T3)', type: 'Air Cargo', coords: [28.5562, 77.1000], address: 'Airport Cargo Expressway, Terminal 3, New Delhi' },
  { name: 'Okhla Industrial Area Phase-III Freight Yard', type: 'Industrial Yard', coords: [28.5300, 77.2710], address: 'Okhla Industrial Estate, South Delhi' },
  { name: 'Cyber City Corporate Hub & Logistics Dock', type: 'Commercial Center', coords: [28.4950, 77.0890], address: 'DLF Cyber City, Phase 2, Gurugram' },
  { name: 'Noida Sector 62 IT & Retail Distribution', type: 'Retail / Logistics', coords: [28.6280, 77.3649], address: 'Logix Cyber Park, Sector 62, Noida' },
  { name: 'West Delhi Regional Cross-Docking Terminal', type: 'Cross-Dock', coords: [28.6800, 77.1200], address: 'Punjabi Bagh Ring Road, West Delhi' },
  { name: 'North Logistics Intermodal Depot', type: 'Intermodal Depot', coords: [28.7041, 77.1025], address: 'GT Karnal Freight Corridor, North Delhi' },
  { name: 'South Delhi Cold-Chain & Medical Depot', type: 'Cold Storage / Medical', coords: [28.5400, 77.2400], address: 'Greater Kailash Distribution Cluster, South Delhi' },
  { name: 'Manesar Heavy Freight & Automotive Hub', type: 'Automotive / Heavy Cargo', coords: [28.3540, 76.9400], address: 'IMT Manesar Industrial Expressway, Haryana' },
  { name: 'Faridabad Industrial Manufacturing Yard', type: 'Manufacturing Logistics', coords: [28.4089, 77.3178], address: 'Mathura Road Corridor, Faridabad' },
  { name: 'Greater Noida Multi-Modal Logistics Hub', type: 'Inland Container Depot', coords: [28.4744, 77.5040], address: 'Pari Chowk Logistics Zone, Greater Noida' },
  { name: 'Sector 18 Commercial Retail Center', type: 'Retail Hub', coords: [28.5670, 77.3210], address: 'Atta Market Transit Hub, Sector 18, Noida' },
  { name: 'Udyog Vihar Logistics & Sorting Facility', type: 'Sortation Center', coords: [28.5080, 77.0820], address: 'Udyog Vihar Phase 4, Gurugram' },
  { name: 'Apollo Emergency Medical Transit Terminal', type: 'Healthcare Dispatch', coords: [28.5620, 77.2830], address: 'Mathura Road Sarita Vihar, South Delhi' },
];

const QUICK_SUGGESTIONS = [
  LOGISTICS_HUBS[1], // IGI Airport Cargo
  LOGISTICS_HUBS[2], // Okhla Industrial
  LOGISTICS_HUBS[3], // Cyber City
  LOGISTICS_HUBS[4], // Noida Sector 62
  LOGISTICS_HUBS[7], // South Delhi Cold-Chain
  LOGISTICS_HUBS[5], // West Delhi Cross-Dock
];

// Leaflet custom numbered pill marker
const createNumberedPin = (label, isDepot = false) => {
  const bg = isDepot ? '#34c759' : '#0071e3';
  const width = isDepot ? '54px' : '28px';
  const html = `
    <div style="
      background: ${bg};
      color: #ffffff;
      width: ${width};
      height: 28px;
      border-radius: 9999px;
      font-size: 11px;
      font-weight: 700;
      box-shadow: 0 3px 10px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      border: 2px solid #ffffff;
      white-space: nowrap;
    ">
      ${label}
    </div>
  `;
  return L.divIcon({
    html: html,
    className: 'custom-vrp-pin',
    iconSize: [isDepot ? 54 : 28, 28],
    iconAnchor: [isDepot ? 27 : 14, 14],
  });
};

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
  const [depotName, setDepotName] = useState('Central Logistics Fulfillment Hub');
  const [stops, setStops] = useState([
    { id: 1, title: 'West Distribution Center', latitude: 28.6800, longitude: 77.1200, priority: 2, type: 'Cross-Dock' },
    { id: 2, title: 'Corporate Hardware Office', latitude: 28.4800, longitude: 77.0800, priority: 1, type: 'Commercial Center' },
    { id: 3, title: 'North Logistics Terminal', latitude: 28.7041, longitude: 77.1025, priority: 2, type: 'Intermodal Depot' },
    { id: 4, title: 'Sector 18 Retail Hub', latitude: 28.5670, longitude: 77.3210, priority: 3, type: 'Retail Hub' },
  ]);
  const [vrpResult, setVrpResult] = useState(null);

  // Autocomplete search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchContainerRef = useRef(null);

  // Close search dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle Autocomplete Search (Local Hubs + OpenStreetMap Geocoder)
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    const q = searchQuery.toLowerCase().trim();

    // 1. Instant local matching across preloaded logistics catalog
    const localMatches = LOGISTICS_HUBS.filter(
      (hub) =>
        hub.name.toLowerCase().includes(q) ||
        hub.type.toLowerCase().includes(q) ||
        hub.address.toLowerCase().includes(q)
    ).map((hub) => ({
      title: hub.name,
      subtitle: `${hub.type} · ${hub.address}`,
      latitude: hub.coords[0],
      longitude: hub.coords[1],
      type: hub.type,
      source: 'Verified Logistics Hub',
    }));

    setSearchResults(localMatches);
    setShowDropdown(true);

    // 2. Debounced query to OpenStreetMap Nominatim for arbitrary global search
    const timer = setTimeout(async () => {
      if (q.length >= 3) {
        try {
          setIsSearching(true);
          const res = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
              searchQuery
            )}&limit=4`,
            {
              headers: { 'Accept-Language': 'en' },
            }
          );
          if (res.ok) {
            const data = await res.json();
            const remoteMatches = data.map((item) => ({
              title: item.display_name.split(',')[0],
              subtitle: item.display_name,
              latitude: Number(parseFloat(item.lat).toFixed(4)),
              longitude: Number(parseFloat(item.lon).toFixed(4)),
              type: item.type || 'Geocoded Address',
              source: 'OpenStreetMap',
            }));

            // Combine local and remote without exact coordinate duplicates
            setSearchResults((prev) => {
              const combined = [...prev];
              remoteMatches.forEach((rm) => {
                const exists = combined.some(
                  (c) =>
                    Math.abs(c.latitude - rm.latitude) < 0.005 &&
                    Math.abs(c.longitude - rm.longitude) < 0.005
                );
                if (!exists) combined.push(rm);
              });
              return combined.slice(0, 7);
            });
          }
        } catch (err) {
          console.warn('Geocoding service unavailable, relying on internal hub directory:', err.message);
        } finally {
          setIsSearching(false);
        }
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const parseCoords = (str) => {
    if (Array.isArray(str)) return str;
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
    if (stops.length === 0) {
      if (showToast) showToast('Please add at least one stop to the manifest.');
      return;
    }

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

  const addStopFromSuggestion = (suggestion) => {
    // Prevent immediate duplicate
    const alreadyExists = stops.some(
      (s) => Math.abs(s.latitude - suggestion.latitude) < 0.001 && Math.abs(s.longitude - suggestion.longitude) < 0.001
    );

    if (alreadyExists) {
      if (showToast) showToast(`"${suggestion.title}" is already in your manifest.`);
      setSearchQuery('');
      setShowDropdown(false);
      return;
    }

    const newStop = {
      id: Date.now(),
      title: suggestion.title || suggestion.name,
      latitude: suggestion.latitude || suggestion.coords[0],
      longitude: suggestion.longitude || suggestion.coords[1],
      priority: 2,
      type: suggestion.type || 'Logistics Stop',
    };

    setStops((prev) => [...prev, newStop]);
    setSearchQuery('');
    setShowDropdown(false);
    if (showToast) showToast(`Added "${newStop.title}" to manifest.`);
  };

  const removeStop = (id) => {
    setStops(stops.filter((s) => s.id !== id));
  };

  const updateStopPriority = (id, newPriority) => {
    setStops(stops.map((s) => (s.id === id ? { ...s, priority: newPriority } : s)));
  };

  const setDepotFromHub = (hub) => {
    setDepotLocation(`${hub.coords[0]}, ${hub.coords[1]}`);
    setDepotName(hub.name);
    if (showToast) showToast(`Depot set to "${hub.name}".`);
  };

  // Coordinates for the tour map visualization
  const depotCoords = parseCoords(depotLocation);
  const mapCenter = Array.isArray(depotCoords) ? depotCoords : [28.6139, 77.2090];

  const mapPathPoints = vrpResult && vrpResult.ordered_stops ? [
    mapCenter,
    ...vrpResult.ordered_stops.map((s) => [s.latitude, s.longitude]),
    mapCenter,
  ] : [];

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
        <div style={{ display: 'grid', gridTemplateColumns: '1.25fr 1.75fr', gap: '24px' }}>
          {/* Manifest Controls */}
          <div className="apple-card" style={{ margin: 0, display: 'flex', flexDirection: 'column' }}>
            <div className="apple-card-header" style={{ marginBottom: '14px' }}>
              <div>
                <h3>Delivery Manifest</h3>
                <small style={{ color: 'var(--text-secondary)' }}>{stops.length} stops staged for dispatch</small>
              </div>
              <button
                className="btn btn-secondary"
                style={{ padding: '4px 10px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '5px' }}
                onClick={() => {
                  setStops([]);
                  setVrpResult(null);
                  if (showToast) showToast('Manifest cleared.');
                }}
              >
                Clear Manifest
              </button>
            </div>

            {/* Depot Configuration with Quick Presets */}
            <div className="form-group" style={{ marginBottom: '18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <label style={{ margin: 0 }}>Depot / Vehicle Starting Location</label>
                <span style={{ fontSize: '0.76rem', color: 'var(--apple-green)', fontWeight: '600' }}>Starting Depot</span>
              </div>
              <input
                type="text"
                value={depotLocation}
                onChange={(e) => setDepotLocation(e.target.value)}
                placeholder="28.6139, 77.2090"
              />
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                Active: <strong>{depotName}</strong>
              </div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '6px', alignItems: 'center' }}>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-tertiary)' }}>Switch Depot:</span>
                {[LOGISTICS_HUBS[0], LOGISTICS_HUBS[5], LOGISTICS_HUBS[6], LOGISTICS_HUBS[8]].map((hub, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className="suggestion-chip"
                    style={{ fontSize: '0.72rem', padding: '2px 8px' }}
                    onClick={() => setDepotFromHub(hub)}
                  >
                    {hub.name.split(' ')[0]} {hub.name.split(' ')[1]}
                  </button>
                ))}
              </div>
            </div>

            {/* Search Autocomplete & Location Suggestions Bar */}
            <div style={{ marginBottom: '18px' }} ref={searchContainerRef}>
              <label style={{ fontSize: '0.82rem', fontWeight: '600', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                Search & Add Delivery Destination
              </label>

              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  placeholder="Search hub, airport, industrial yard, or address..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => {
                    if (searchResults.length > 0) setShowDropdown(true);
                  }}
                  style={{
                    width: '100%',
                    padding: '10px 14px 10px 36px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-strong)',
                    background: 'var(--surface-secondary)',
                    fontSize: '0.9rem',
                  }}
                />
                <span style={{ position: 'absolute', left: '12px', top: '11px', color: '#86868b', display: 'flex' }}>
                  <IconSearch size={16} />
                </span>
                {isSearching && (
                  <span style={{ position: 'absolute', right: '12px', top: '11px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    Searching...
                  </span>
                )}

                {/* Floating Autocomplete Dropdown */}
                {showDropdown && searchResults.length > 0 && (
                  <div className="autocomplete-dropdown">
                    {searchResults.map((item, idx) => (
                      <div
                        key={idx}
                        className="autocomplete-item"
                        onClick={() => addStopFromSuggestion(item)}
                      >
                        <div style={{ maxWidth: '80%' }}>
                          <div style={{ fontWeight: '600', fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                            {item.title}
                          </div>
                          <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                            {item.subtitle}
                          </div>
                          <div style={{ fontSize: '0.72rem', fontFamily: 'monospace', color: 'var(--apple-blue)', marginTop: '2px' }}>
                            {item.latitude}°, {item.longitude}°
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span className="badge badge-in-use" style={{ fontSize: '0.72rem', padding: '2px 7px' }}>
                            {item.type}
                          </span>
                          <div style={{ fontSize: '0.74rem', color: 'var(--apple-blue)', fontWeight: '600', marginTop: '4px' }}>
                            + Add Stop
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Quick Pick Logistics Presets Chips */}
              <div style={{ marginTop: '10px' }}>
                <span style={{ fontSize: '0.76rem', color: 'var(--text-tertiary)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Suggested Hubs:
                </span>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '6px' }}>
                  {QUICK_SUGGESTIONS.map((hub, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className="suggestion-chip"
                      onClick={() => addStopFromSuggestion({ title: hub.name, latitude: hub.coords[0], longitude: hub.coords[1], type: hub.type })}
                    >
                      <IconPlus size={11} />
                      <span>{hub.name.split(' ')[0]} {hub.name.split(' ')[1]}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Delivery Stops Manifest List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px', maxHeight: '320px', overflowY: 'auto' }}>
              {stops.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--text-secondary)', background: 'var(--surface-secondary)', borderRadius: 'var(--radius-md)' }}>
                  Manifest empty. Use the search bar or suggested hubs above to add delivery stops.
                </div>
              ) : (
                stops.map((stop, i) => (
                  <div
                    key={stop.id}
                    style={{
                      background: 'var(--surface-secondary)',
                      padding: '10px 12px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-subtle)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '10px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
                      <span
                        style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          background: 'var(--surface-tertiary)',
                          color: 'var(--text-primary)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.76rem',
                          fontWeight: '700',
                          flexShrink: 0,
                        }}
                      >
                        {i + 1}
                      </span>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: '600', fontSize: '0.86rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {stop.title}
                        </div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                          GPS: {stop.latitude}, {stop.longitude} {stop.type && `· ${stop.type}`}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                      {/* Priority Selector */}
                      <select
                        value={stop.priority}
                        onChange={(e) => updateStopPriority(stop.id, parseInt(e.target.value))}
                        style={{
                          fontSize: '0.74rem',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          border: '1px solid var(--border-subtle)',
                          background: stop.priority === 3 ? 'var(--apple-red-light)' : stop.priority === 2 ? 'var(--apple-orange-light)' : 'var(--surface-tertiary)',
                          color: stop.priority === 3 ? 'var(--apple-red)' : stop.priority === 2 ? 'var(--apple-orange)' : 'var(--text-secondary)',
                          fontWeight: '600',
                          cursor: 'pointer',
                        }}
                      >
                        <option value={3}>Critical</option>
                        <option value={2}>Medium</option>
                        <option value={1}>Standard</option>
                      </select>

                      <button
                        className="btn btn-secondary"
                        style={{ padding: '4px', borderRadius: '50%', color: 'var(--apple-red)', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '22px', height: '22px' }}
                        onClick={() => removeStop(stop.id)}
                        title="Remove stop"
                      >
                        <IconClose size={11} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <button
              className="btn btn-primary"
              style={{ width: '100%', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: 'auto' }}
              onClick={handleOptimizeVRP}
              disabled={loading || stops.length === 0}
            >
              <IconZap size={16} />
              <span>{loading ? 'Synthesizing VRP Permutation...' : 'Optimize Multi-Stop Tour'}</span>
            </button>
          </div>

          {/* VRP Tour Synthesis Output & Map Visualizer */}
          <div className="apple-card" style={{ margin: 0, display: 'flex', flexDirection: 'column' }}>
            <div className="apple-card-header">
              <div>
                <h3>VRP Tour Synthesis & Emissions Audit</h3>
                <small style={{ color: 'var(--text-secondary)' }}>2-Opt Heuristic Optimization & Carbon Telematics</small>
              </div>
              {vrpResult && <span className="badge badge-active">Optimal Permutation</span>}
            </div>

            {vrpResult ? (
              <div>
                {/* Highlights Metric Tiles */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
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
                      Tour Duration
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
                      ESG Carbon
                    </div>
                    <div style={{ fontSize: '1.6rem', fontWeight: '700', color: 'var(--apple-green)', marginTop: '4px' }}>
                      {vrpResult.co2_kg_estimate} <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>kg</span>
                    </div>
                  </div>
                </div>

                {/* Tour OpenStreetMap Visualizer */}
                <div style={{ height: '240px', borderRadius: 'var(--radius-md)', overflow: 'hidden', marginBottom: '20px', border: '1px solid var(--border-subtle)' }}>
                  <MapContainer
                    center={mapCenter}
                    zoom={10}
                    scrollWheelZoom={false}
                    style={{ height: '100%', width: '100%' }}
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      maxZoom={19}
                    />

                    {/* Depot Marker */}
                    <Marker position={mapCenter} icon={createNumberedPin('Depot', true)}>
                      <Popup>
                        <div style={{ padding: '4px' }}>
                          <strong>Starting Depot</strong>
                          <div>{depotName}</div>
                          <div style={{ fontSize: '11px', color: '#86868b' }}>{mapCenter[0]}, {mapCenter[1]}</div>
                        </div>
                      </Popup>
                    </Marker>

                    {/* Sequential Stop Markers */}
                    {vrpResult.ordered_stops && vrpResult.ordered_stops.map((stop, idx) => (
                      <Marker
                        key={idx}
                        position={[stop.latitude, stop.longitude]}
                        icon={createNumberedPin(idx + 1, false)}
                      >
                        <Popup>
                          <div style={{ padding: '4px' }}>
                            <strong>Stop #{idx + 1}</strong>
                            <div>{stop.title}</div>
                            <div style={{ fontSize: '11px', color: '#86868b' }}>{stop.latitude}, {stop.longitude}</div>
                          </div>
                        </Popup>
                      </Marker>
                    ))}

                    {/* Route Polyline */}
                    {mapPathPoints.length > 1 && (
                      <Polyline
                        positions={mapPathPoints}
                        color="#0071e3"
                        weight={4}
                        opacity={0.8}
                        dashArray="6, 6"
                      />
                    )}
                  </MapContainer>
                </div>

                {/* Ordered Tour Sequence Table */}
                <h4 style={{ fontSize: '0.94rem', fontWeight: '600', marginBottom: '10px' }}>
                  Optimal Stop Itinerary & Segment Transit Times
                </h4>

                <div className="table-container" style={{ margin: 0, maxHeight: '200px', overflowY: 'auto' }}>
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
              <div style={{ textAlign: 'center', padding: '80px 20px', color: '#86868b', margin: 'auto 0' }}>
                <IconMap size={40} color="var(--border-strong)" />
                <h4 style={{ marginTop: '14px', fontSize: '1.05rem', color: 'var(--text-primary)' }}>
                  Interactive Route Studio Ready
                </h4>
                <p style={{ maxWidth: '420px', margin: '8px auto 0', fontSize: '0.88rem' }}>
                  Add stops using the search autocomplete or click any suggested hub on the left, then click <strong>Optimize Multi-Stop Tour</strong> to synthesize the optimal itinerary.
                </p>
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
