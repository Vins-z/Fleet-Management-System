import axios from 'axios';

// Base API client configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Generic error handler
const handleApiError = (error) => {
  const message = error.response?.data?.error || error.message || 'Unknown network error';
  console.error(`[API Error]: ${message}`, error);
  throw new Error(message);
};

// -------------------------------------------------------------
// Dashboard & Analytics
// -------------------------------------------------------------
export const getDashboardStats = async () => {
  try {
    const response = await apiClient.get('/api/dashboard/stats');
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
};

// -------------------------------------------------------------
// Vehicle Management
// -------------------------------------------------------------
export const getVehicles = async () => {
  try {
    const response = await apiClient.get('/api/vehicles');
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
};

export const createVehicle = async (vehicleData) => {
  try {
    const response = await apiClient.post('/api/vehicles', vehicleData);
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
};

export const updateVehicleStatus = async (vehicleId, status) => {
  try {
    const response = await apiClient.patch(`/api/vehicles/${vehicleId}`, { status });
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
};

export const deleteVehicle = async (vehicleId) => {
  try {
    const response = await apiClient.delete(`/api/vehicles/${vehicleId}`);
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
};

// -------------------------------------------------------------
// Driver Management
// -------------------------------------------------------------
export const getDrivers = async () => {
  try {
    const response = await apiClient.get('/api/drivers');
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
};

export const createDriver = async (driverData) => {
  try {
    const response = await apiClient.post('/api/drivers', driverData);
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
};

export const assignDriver = async (driverId, vehicleId) => {
  try {
    const response = await apiClient.post('/api/drivers/assign', { driverId, vehicleId });
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
};

// -------------------------------------------------------------
// Task Management & Allocation
// -------------------------------------------------------------
export const getTasks = async () => {
  try {
    const response = await apiClient.get('/api/tasks');
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
};

export const createTask = async (taskData) => {
  try {
    const response = await apiClient.post('/api/tasks', taskData);
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
};

export const updateTaskStatus = async (taskId, status) => {
  try {
    const response = await apiClient.patch(`/api/tasks/${taskId}`, { status });
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
};

export const deleteTask = async (taskId) => {
  try {
    const response = await apiClient.delete(`/api/tasks/${taskId}`);
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
};

export const allocateTasks = async (payload = {}) => {
  try {
    const response = await apiClient.post('/api/allocate_task', payload);
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
};

// -------------------------------------------------------------
// Route Optimization
// -------------------------------------------------------------
export const optimizeRoute = async (payload) => {
  try {
    const response = await apiClient.post('/api/optimize_route', payload);
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
};

// -------------------------------------------------------------
// Maintenance & Fuel Monitoring
// -------------------------------------------------------------
export const getMaintenanceLogs = async () => {
  try {
    const response = await apiClient.get('/api/maintenance');
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
};

export const createMaintenanceLog = async (logData) => {
  try {
    const response = await apiClient.post('/api/maintenance', logData);
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
};

export const getFuelLogs = async (vehicleId) => {
  try {
    const response = await apiClient.get(`/api/vehicles/${vehicleId}/fuel`);
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
};

export const createFuelLog = async (vehicleId, fuelData) => {
  try {
    const response = await apiClient.post(`/api/vehicles/${vehicleId}/fuel`, fuelData);
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
};

const api = {
  getDashboardStats,
  getVehicles,
  createVehicle,
  updateVehicleStatus,
  deleteVehicle,
  getDrivers,
  createDriver,
  assignDriver,
  getTasks,
  createTask,
  updateTaskStatus,
  deleteTask,
  allocateTasks,
  optimizeRoute,
  getMaintenanceLogs,
  createMaintenanceLog,
  getFuelLogs,
  createFuelLog,
};

export default api;
