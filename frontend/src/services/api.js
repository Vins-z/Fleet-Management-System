import axios from "axios";

// Base API configuration
const apiClient = axios.create({
  baseURL: "http://127.0.0.1:5000", // Replace with your backend URL
  headers: {
    "Content-Type": "application/json",
  },
});

// Error handling
const handleApiError = (error) => {
  if (error.response) {
    console.error(`API Error: ${error.response.data.message}`);
  } else {
    console.error(`Network Error: ${error.message}`);
  }
  throw error;
};

// Task Management APIs
export const getTasks = async () => {
  try {
    const response = await apiClient.get("/tasks");
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
};

export const createTask = async (taskData) => {
  try {
    const response = await apiClient.post("/tasks", taskData);
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
};

export const updateTaskStatus = async (taskId, status) => {
  try {
    const response = await apiClient.patch(`/tasks/${taskId}`, { status });
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
};

export const deleteTask = async (taskId) => {
  try {
    const response = await apiClient.delete(`/tasks/${taskId}`);
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
};

// Vehicle Management APIs
export const getVehicles = async () => {
  try {
    const response = await apiClient.get("/vehicles");
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
};

export const updateVehicleStatus = async (vehicleId, status) => {
  try {
    const response = await apiClient.patch(`/vehicles/${vehicleId}`, { status });
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
};

// Driver Management APIs
export const getDrivers = async () => {
  try {
    const response = await apiClient.get("/drivers");
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
};

export const assignDriver = async (driverId, vehicleId) => {
  try {
    const response = await apiClient.post("/drivers/assign", {
      driverId,
      vehicleId,
    });
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
};

// Fuel Monitoring APIs
export const getFuelConsumption = async (vehicleId) => {
  try {
    const response = await apiClient.get(`/vehicles/${vehicleId}/fuel`);
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
};

export const updateFuelConsumption = async (vehicleId, fuelData) => {
  try {
    const response = await apiClient.patch(`/vehicles/${vehicleId}/fuel`, fuelData);
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
};

// Exporting all APIs as a module
export default {
  getTasks,
  createTask,
  updateTaskStatus,
  deleteTask,
  getVehicles,
  updateVehicleStatus,
  getDrivers,
  assignDriver,
  getFuelConsumption,
  updateFuelConsumption,
};