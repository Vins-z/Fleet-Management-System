import { render, screen, waitFor } from '@testing-library/react';
import App from './App';

// Mock API service so tests run synchronously without real network calls
jest.mock('./services/api', () => ({
  getDashboardStats: jest.fn().mockResolvedValue({
    totalVehicles: 5,
    vehiclesInUse: 3,
    idleVehicles: 1,
    maintenanceDue: 1,
    fuelConsumption: { avg: 9.5, unit: 'km/L' },
    alerts: ['Heavy Hauler Delta: Service Due']
  }),
  getExecutiveSummaryReport: jest.fn().mockResolvedValue({
    fleet_summary: {
      total_assets: 5,
      esg_carbon_footprint_kg: 1225.0,
      esg_ev_savings_kg: 428.8,
      fleet_average_safety_score: 92.5,
      total_fleet_km: 175000,
    }
  }),
  getVehicles: jest.fn().mockResolvedValue({ vehicles: [] }),
  getTasks: jest.fn().mockResolvedValue({ tasks: [] }),
  getMaintenanceLogs: jest.fn().mockResolvedValue({ maintenance: [] }),
  getDriverScorecards: jest.fn().mockResolvedValue({ drivers: [] }),
  getTelematicsEvents: jest.fn().mockResolvedValue({ events: [] }),
  getGeofences: jest.fn().mockResolvedValue({ geofences: [] }),
}));

test('renders FleetOS Enterprise navigation tabs', () => {
  render(<App />);
  const routeTab = screen.getByText(/Route Studio \(VRP\)/i);
  expect(routeTab).toBeInTheDocument();
  const safetyTab = screen.getByText(/Driver Safety/i);
  expect(safetyTab).toBeInTheDocument();
  const geofenceTab = screen.getByText(/Geofences/i);
  expect(geofenceTab).toBeInTheDocument();
});

test('renders dashboard tab by default', async () => {
  render(<App />);
  await waitFor(() => {
    expect(screen.getByText(/Operational Command Center/i)).toBeInTheDocument();
  });
});
