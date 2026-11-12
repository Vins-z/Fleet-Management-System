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
  getVehicles: jest.fn().mockResolvedValue({ vehicles: [] }),
  getTasks: jest.fn().mockResolvedValue({ tasks: [] }),
  getMaintenanceLogs: jest.fn().mockResolvedValue({ maintenance: [] }),
}));

test('renders FleetOS navigation header', () => {
  render(<App />);
  const headerElement = screen.getByText(/FleetOS MicroSaaS/i);
  expect(headerElement).toBeInTheDocument();
});

test('renders dashboard tab by default', async () => {
  render(<App />);
  await waitFor(() => {
    expect(screen.getByText(/Operational Command Center/i)).toBeInTheDocument();
  });
});
