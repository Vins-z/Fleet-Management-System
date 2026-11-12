import React, { useState } from 'react';
import './styles.css';
import Dashboard from './components/Dashboard';
import FleetMap from './components/FleetMap';
import TaskManager from './components/TaskManager';
import RoutePlanner from './components/RoutePlanner';
import MaintenanceFuel from './components/MaintenanceFuel';

const App = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [toastMessage, setToastMessage] = useState('');
  const [liveSimulation, setLiveSimulation] = useState(true);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage('');
    }, 3500);
  };

  return (
    <div className="app-root">
      {/* Apple Dynamic Island Floating Banner */}
      {toastMessage && (
        <div className="toast-banner">
          <span className="toast-dot" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Apple Frosted Glass Top Navigation */}
      <header>
        <div className="container nav-container">
          <div className="logo-area" onClick={() => setActiveTab('dashboard')}>
            <div className="apple-badge-icon">🚛</div>
            <div className="logo-text">
              FleetOS <span className="version-tag">Pro</span>
            </div>
          </div>

          {/* Apple Segmented Control Navigation */}
          <nav>
            <ul className="segmented-control">
              <li>
                <button
                  className={activeTab === 'dashboard' ? 'active' : ''}
                  onClick={() => setActiveTab('dashboard')}
                >
                  Dashboard
                </button>
              </li>
              <li>
                <button
                  className={activeTab === 'map' ? 'active' : ''}
                  onClick={() => setActiveTab('map')}
                >
                  Fleet Map
                </button>
              </li>
              <li>
                <button
                  className={activeTab === 'tasks' ? 'active' : ''}
                  onClick={() => setActiveTab('tasks')}
                >
                  Task Dispatch
                </button>
              </li>
              <li>
                <button
                  className={activeTab === 'routes' ? 'active' : ''}
                  onClick={() => setActiveTab('routes')}
                >
                  Route Studio
                </button>
              </li>
              <li>
                <button
                  className={activeTab === 'maintenance' ? 'active' : ''}
                  onClick={() => setActiveTab('maintenance')}
                >
                  Health & Service
                </button>
              </li>
            </ul>
          </nav>

          {/* Live System Indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="system-status-pill">
              <span className="status-dot" />
              <span>{liveSimulation ? 'Live Telemetry' : 'Static Mode'}</span>
            </div>
            <button
              className="btn btn-secondary"
              style={{ padding: '6px 12px', fontSize: '0.8rem' }}
              onClick={() => {
                setLiveSimulation(!liveSimulation);
                showToast(
                  !liveSimulation
                    ? 'Satellite link online: Real-time telemetry streaming active.'
                    : 'Simulation paused: Telemetry held at latest checkpoint.'
                );
              }}
            >
              {liveSimulation ? '● Active' : '○ Paused'}
            </button>
          </div>
        </div>
      </header>

      {/* Main Dynamic Viewport */}
      <main>
        <div className="container">
          {activeTab === 'dashboard' && (
            <Dashboard showToast={showToast} setActiveTab={setActiveTab} />
          )}
          {activeTab === 'map' && (
            <FleetMap liveSimulation={liveSimulation} showToast={showToast} />
          )}
          {activeTab === 'tasks' && <TaskManager showToast={showToast} />}
          {activeTab === 'routes' && <RoutePlanner showToast={showToast} />}
          {activeTab === 'maintenance' && (
            <MaintenanceFuel showToast={showToast} />
          )}
        </div>
      </main>

      {/* Apple Styled Footer */}
      <footer>
        <div className="container">
          <p>© {new Date().getFullYear()} FleetOS MicroSaaS. Designed following Apple Human Interface Guidelines.</p>
          <p style={{ marginTop: '4px', fontSize: '0.8rem', color: '#86868b' }}>
            PostgreSQL Relational Core · Flask Application Services · Dockerized Multi-Container Pipeline
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;
