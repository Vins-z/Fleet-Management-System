import React, { useState } from "react";
import "./styles.css";

const App = () => {
  const [selectedFeature, setSelectedFeature] = useState(null);

  const features = [
    {
      title: "Vehicle Tracking",
      description: "Monitor usage, mileage, and real-time location of your fleet.",
      details: "Our vehicle tracking system gives you real-time GPS data and a history of vehicle movement, ensuring you can manage your fleet efficiently."
    },
    {
      title: "Maintenance Alerts",
      description: "Set reminders for scheduled maintenance and track repair history.",
      details: "We automatically notify you of upcoming maintenance and track service history to ensure your vehicles are always in top condition."
    },
    {
      title: "Fuel Monitoring",
      description: "Track fuel efficiency and consumption to reduce costs.",
      details: "Get detailed reports on fuel usage for each vehicle, helping you optimize fuel costs and identify inefficiencies in your fleet."
    }
  ];

  const handleFeatureClick = (index) => {
    setSelectedFeature(features[index]);
  };

  return (
    <div>
      {/* Navigation Bar */}
      <header>
        <nav className="container">
          <a href="/" className="logo">
            Fleet Management System
          </a>
          <ul className="nav-links">
            <li><a href="#features">Features</a></li>
            <li><a href="#dashboard">Dashboard</a></li>
          </ul>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="hero">
        <div className="container">
          <h1>Effortless Fleet Management</h1>
          <p>
            Streamline your fleet operations with real-time tracking, fuel
            monitoring, and maintenance management all in one place.
          </p>
          <a href="#features" className="cta-button">Learn More</a>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features">
        <div className="container">
          <h2>Key Features</h2>
          <div className="feature-cards">
            {features.map((feature, index) => (
              <div 
                key={index} 
                className={`card ${selectedFeature?.title === feature.title ? 'active' : ''}`}
                onClick={() => handleFeatureClick(index)}
              >
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </div>
            ))}
          </div>
          {selectedFeature && (
            <div className="feature-details">
              <h3>Details for {selectedFeature.title}</h3>
              <p>{selectedFeature.details}</p>
            </div>
          )}
        </div>
      </section>

      {/* Dashboard Section */}
      <section id="dashboard" className="dashboard">
        <div className="container">
          <h2>Fleet Dashboard</h2>
          <div className="dashboard-container">
            <div className="dashboard-item">
              <h3>Total Vehicles</h3>
              <p>120</p>
            </div>
            <div className="dashboard-item">
              <h3>Vehicles in Use</h3>
              <p>85</p>
            </div>
            <div className="dashboard-item">
              <h3>Maintenance Due</h3>
              <p>15</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer>
        <div className="container">
          <p>&copy; {new Date().getFullYear()} Fleet Management System. All rights reserved.</p>
          <p>
            <a href="#privacy-policy">Privacy Policy</a> |{" "}
            <a href="#terms-of-service">Terms of Service</a>
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;