import React, { useState } from 'react';
import './styles.css';
import Dashboard from './components/Dashboard';
import FleetMap from './components/FleetMap';
import TaskManager from './components/TaskManager';
import RoutePlanner from './components/RoutePlanner';
import MaintenanceFuel from './components/MaintenanceFuel';

const App = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="app-root">
      {/* Top Application Header */}
      <header>
        <div className="container nav-container">
          <a href="#home" className="logo" onClick={() => setActiveTab('dashboard')}>
            🚛 <span>FleetOS MicroSaaS</span>
          </a>

          <nav>
            <ul className="nav-tabs">
              <li>
                <button
                  className={activeTab === 'dashboard' ? 'active' : ''}
                  onClick={() => setActiveTab('dashboard')}
                >
                  📊 Dashboard
                </button>
              </li>
              <li>
                <button
                  className={activeTab === 'map' ? 'active' : ''}
                  onClick={() => setActiveTab('map')}
                >
                  🗺️ Fleet Map
                </button>
              </li>
              <li>
                <button
                  className={activeTab === 'tasks' ? 'active' : ''}
                  onClick={() => setActiveTab('tasks')}
                >
                  📋 Task Allocation
                </button>
              </li>
              <li>
                <button
                  className={activeTab === 'routes' ? 'active' : ''}
                  onClick={() => setActiveTab('routes')}
                >
                  🧭 Route Optimizer
                </button>
              </li>
              <li>
                <button
                  className={activeTab === 'maintenance' ? 'active' : ''}
                  onClick={() => setActiveTab('maintenance')}
                >
                  ⚙️ Maintenance & Health
                </button>
              </li>
            </ul>
          </nav>
        </div>
      </header>

      {/* Main Dynamic View */}
      <main>
        <div className="container">
          {activeTab === 'dashboard' && <Dashboard />}
          {activeTab === 'map' && <FleetMap />}
          {activeTab === 'tasks' && <TaskManager />}
          {activeTab === 'routes' && <RoutePlanner />}
          {activeTab === 'maintenance' && <MaintenanceFuel />}
        </div>
      </main>

      {/* Footer */}
      <footer>
        <div className="container">
          <p>© {new Date().getFullYear()} Fleet Management System — Enterprise Logistics & Delivery Automation.</p>
          <p style={{ marginTop: '4px', fontSize: '0.8rem' }}>
            Built with React, Flask, PostgreSQL & Docker Containerization.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;
