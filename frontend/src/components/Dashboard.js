import React, { useState, useEffect } from "react";
import "./styles.css";

// Mock data for demonstration
const mockData = {
  totalVehicles: 120,
  vehiclesInUse: 85,
  maintenanceDue: 15,
  fuelConsumption: {
    avg: 8.5,
    unit: "km/L",
  },
  alerts: [
    "Vehicle #23 requires oil change.",
    "Vehicle #42 is overdue for tire rotation.",
    "Vehicle #67 fuel efficiency has dropped by 10%.",
  ],
};

// Metric Card Component
const MetricCard = ({ title, value, unit, description }) => (
  <div className="metric-card">
    <h3>{title}</h3>
    <p>
      {value} {unit && <span>{unit}</span>}
    </p>
    {description && <small>{description}</small>}
  </div>
);

// Alert Component
const AlertList = ({ alerts }) => (
  <div className="alert-list">
    <h3>Alerts</h3>
    <ul>
      {alerts.length > 0 ? (
        alerts.map((alert, index) => <li key={index}>{alert}</li>)
      ) : (
        <li>No alerts at the moment.</li>
      )}
    </ul>
  </div>
);

const Dashboard = () => {
  const [data, setData] = useState(null);

  useEffect(() => {
    // Simulate API call
    const fetchData = async () => {
      // Replace with actual API call
      await new Promise((resolve) => setTimeout(resolve, 500)); // Simulated delay
      setData(mockData);
    };
    fetchData();
  }, []);

  if (!data) {
    return <div className="loading">Loading dashboard data...</div>;
  }

  return (
    <div className="dashboard-container">
      <h2>Fleet Dashboard</h2>

      {/* Metric Cards */}
      <div className="metric-cards">
        <MetricCard
          title="Total Vehicles"
          value={data.totalVehicles}
          description="Total number of vehicles in your fleet."
        />
        <MetricCard
          title="Vehicles In Use"
          value={data.vehiclesInUse}
          description="Number of vehicles currently operational."
        />
        <MetricCard
          title="Maintenance Due"
          value={data.maintenanceDue}
          description="Number of vehicles requiring maintenance."
        />
        <MetricCard
          title="Avg. Fuel Efficiency"
          value={data.fuelConsumption.avg}
          unit={data.fuelConsumption.unit}
          description="Average fuel efficiency across the fleet."
        />
      </div>

      {/* Alerts */}
      <AlertList alerts={data.alerts} />
    </div>
  );
};

export default Dashboard;