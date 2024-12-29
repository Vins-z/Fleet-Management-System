# Fleet-Management-System - A MicroSaaS Project

## Project Description

Welcome to the Fleet Management System, a user-friendly and scalable MicroSaaS solution designed specifically for small and medium-sized fleet operators. Our platform helps fleet managers optimize vehicle usage, keep track of maintenance schedules, monitor fuel consumption, and manage logistics effortlessly. A User can oversee and manage all aspects of your fleet operations from a single interface. This is built for one-person startups or small businesses aiming to improve and effectively manage their fleet without the need for a complex infrastructure.

## The Problem

Fleet operators often struggle with some major problems like tracking vehicle maintenance, monitoring fuel usage, and ensuring overall fleet performance. This system automates these tasks to reduce operational overheads and ensures that your fleet runs smoothly at minimum cost.

## Existing Real-World solutions deployed extensively

### Uber
Uber the ride hailing platform utilizes a sophisticated fleet management system to track their vehicles, manage drivers, and ensure timely maintenance. This ensures that minimum wait times for cuatomers and also helps reduce the cost of supply chain to uber.
### Lyft
Lyft an american ride hailing and ride sharing platform employs a similar system to monitor vehicle health, track driver performance, and schedule maintenance, ensuring a smooth and reliable service for their users.

## Key Features

- **Vehicle Tracking:** Easily track usage, mileage, and location of each and every vehicle in the fleet.
- **Maintenance Alerts:** Set up reminders for scheduled maintenance, including oil changes, tire rotations, and more.
- **Fuel Monitoring:** Track fuel consumption for each vehicle to detect inefficiencies and reduce costs.
- **Fleet Dashboard:** A central dashboard providing an overview of your entire fleet’s status, including maintenance schedules and fuel efficiency.
- **Driver Management:** Manage driver details and assignments, ensuring drivers are linked to specific vehicles and tasks.

## Features Overview

### 1. Vehicle Tracking
- **Track vehicle usage, mileage, and real-time location.**
- **Monitor the health and performance of each vehicle in your fleet.**

### 2. Maintenance Alerts
- **Set recurring maintenance tasks and get automatic reminders.**
- **Track the history of each vehicle’s maintenance and repairs.**

### 3. Fuel Monitoring
- **Monitor fuel efficiency per vehicle.**
- **Track fuel consumption over time and generate reports to identify savings opportunities.**

### 4. Fleet Dashboard
- **Overview of all vehicles, their status, maintenance due dates, and more.**
- **Easy-to-understand charts and graphs for fleet performance.**

### 5. Driver Management
- **Assign vehicles to specific drivers.**
- **Track driver behavior and performance.**

## Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js and npm** (for frontend development)
- **Python** (for backend development) or your preferred stack
- A platform to run your application (localhost, cloud server, etc.)

### Step 1: Clone the Repository

Clone the repository to your local machine:

```bash
git clone https://github.com/Vins-z/Fleet-Management-System.git
cd fleet-management
```

### Step 2: Install Dependencies

#### For Frontend (if using JavaScript/Node.js):

In the project directory, install the necessary dependencies:

```bash
npm install
```

#### For Backend (if using Python):

Ensure the virtual environment is activated and install the dependencies from `requirements.txt`:

```bash
pip install -r requirements.txt
```

#### For the website:

```
index.html
```

### Step 3: Configure API Keys & Settings

1. Configure any external APIs or services (e.g., GPS tracking, vehicle data).
2. Add necessary API keys in the configuration file, typically located in `/config/settings.js` or `/config/config.py` depending on your backend stack.


### Step 4: Run the Application

To run the application locally:

#### For Frontend (React, Vue.js, etc.):

```bash
npm start
```

#### For Backend (Python Flask, Django, etc.):

```bash
python app.py
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Directory Structure

```
FleetManagement/
├── backend/
│   ├── app.py
│   ├── database.py
│   ├── models/
│   │   ├── __init__.py
│   │   └── vehicle.py
│   ├── services/
│   │   ├── __init__.py
│   │   ├── task_allocation.py
│   │   └── route_optimizer.py
│   └── requirements.txt
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── App.js
│   │   └── index.js
│   ├── package.json
│   ├── package-lock.json
│   └── .env
├── docker-compose.yml
└── .github/
    └── workflows/
        └── deploy.yml
```

## Technical Components

| Component          | Technology                      |
|--------------------|---------------------------------|
| Backend API        | Python (Flask)                  |
| Frontend           | React.js, HTML, CSS             |
| Database           | MongoDB                         |
| Vehicle Tracking   | GPS APIs, Real-time Location    |
| Fuel Tracking      | custom logic                    |
| Deployment         | Docker, Github Actions          |

---