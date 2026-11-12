import '@testing-library/jest-dom';

// Mock react-leaflet components for headless Jest testing
jest.mock('react-leaflet', () => ({
  MapContainer: ({ children }) => <div data-testid="map-container">{children}</div>,
  TileLayer: () => <div data-testid="tile-layer" />,
  Marker: ({ children }) => <div data-testid="marker">{children}</div>,
  Popup: ({ children }) => <div data-testid="popup">{children}</div>,
  Polyline: () => <div data-testid="polyline" />,
  useMap: () => ({
    flyTo: jest.fn(),
    panTo: jest.fn(),
    setView: jest.fn(),
  }),
}));

// Mock Leaflet L.divIcon
jest.mock('leaflet', () => ({
  divIcon: () => ({}),
  icon: () => ({}),
}));

