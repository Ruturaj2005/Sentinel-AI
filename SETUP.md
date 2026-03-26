# Sentinel - Setup Guide

## Prerequisites

Before starting, ensure you have:
- **Node.js** v18+ installed
- **MongoDB** v6+ installed and running
- **npm** or **yarn** package manager

## Installation Steps

### 1. Install Dependencies

From the project root, install all dependencies:

```bash
# Install root dependencies
npm install

# Install client dependencies
cd client
npm install

# Install server dependencies
cd ../server
npm install

# Return to root
cd ..
```

### 2. Start MongoDB

Make sure MongoDB is running on your system:

```bash
# On Windows
mongod

# On macOS/Linux
sudo systemctl start mongodb
# or
brew services start mongodb-community
```

### 3. Seed the Database

Generate mock data (20 employees, 90 days of access events):

```bash
cd server
npm run seed
```

This will create:
- ✅ 20 employees (including Ramesh Kumar, Priya Sharma, Vikram Singh)
- ✅ ~100,000 access events (90 days)
- ✅ Pattern detections (reconnaissance, data exfiltration)
- ✅ Tickets with check scores
- ✅ Alerts based on risk thresholds

**Expected Output:**
```
🌱 Starting Sentinel Database Seeding...
✓ Created 20 employees
✓ Created 100,000+ access events
✓ Created pattern detections
✓ Created tickets
✓ Created alerts
```

### 4. Start the Backend Server

```bash
# From server directory
npm run dev
```

Server will start at: http://localhost:5000

### 5. Start the Frontend (New Terminal)

```bash
# From client directory
cd client
npm run dev
```

Frontend will start at: http://localhost:5173

## Quick Start (All at Once)

From the project root:

```bash
# Install everything
npm run install:all

# Seed database (from server folder)
cd server && npm run seed && cd ..

# Run both client and server concurrently
npm run dev
```

## Accessing the Application

Open your browser and navigate to: **http://localhost:5173**

The application will automatically log you in as an Employee.

### Demo Role Switching

Use the dropdown in the top-right corner to switch between:
- **Employee** - View personal risk score and access history
- **Manager** - View team alerts and approve tickets
- **CVU Investigator** - Full system access, all employees, all alerts

### Test Accounts to Check

After seeding, look for these high-risk employees:
- **Ramesh Kumar** - Risk Score 87 (Reconnaissance pattern)
- **Vikram Singh** - Risk Score 94 (Data exfiltration pattern)
- **Priya Sharma** - Risk Score 12 (Clean record - control)

## Features to Test

### As Employee:
- ✅ View personal risk score
- ✅ View access history timeline
- ✅ View active alerts
- ✅ Create tickets for flagged events

### As Manager:
- ✅ View team risk distribution
- ✅ See team alerts
- ✅ Approve/reject pending tickets
- ✅ Monitor high-risk team members

### As CVU Investigator:
- ✅ System-wide statistics
- ✅ Top 10 high-risk employees list
- ✅ All alerts with severity breakdown
- ✅ Pattern analysis
- ✅ Search and filter all employees

## Troubleshooting

### MongoDB Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:27017
```
**Solution:** Make sure MongoDB is running (`mongod`)

### Port Already in Use
```
Error: Port 5000 is already in use
```
**Solution:** Change the PORT in `server/.env` to a different port

### Cannot Find Module
```
Error: Cannot find module 'express'
```
**Solution:** Run `npm install` in the server directory

### API Connection Error (Frontend)
```
Error: Network Error
```
**Solution:** Ensure backend server is running on port 5000

## Project Structure

```
sentinel-ubi/
├── client/              # React frontend (Vite + Tailwind)
│   ├── src/
│   │   ├── components/  # Reusable components
│   │   ├── contexts/    # AuthContext
│   │   ├── pages/       # Route pages
│   │   ├── services/    # API services
│   │   └── utils/       # Constants, formatters
├── server/              # Express backend
│   ├── src/
│   │   ├── models/      # Mongoose schemas
│   │   ├── controllers/ # Route controllers
│   │   ├── routes/      # API routes
│   │   ├── seeds/       # Database seeders
│   │   └── middleware/  # Auth, error handling
└── package.json         # Workspace root
```

## API Endpoints

Base URL: `http://localhost:5000/api`

### Authentication
- `POST /auth/switch-role` - Switch user role (demo)
- `GET /auth/current-user` - Get current user info

### Employees
- `GET /employees` - List employees (role-filtered)
- `GET /employees/:id` - Get employee details
- `GET /employees/:id/risk-history` - Get risk score history
- `GET /employees/high-risk` - Get high-risk employees (≥70)

### Alerts
- `GET /alerts` - List alerts (role-filtered)
- `GET /alerts/:id` - Get alert details
- `PUT /alerts/:id/status` - Update alert status
- `GET /alerts/statistics` - Get alert statistics

### Tickets
- `GET /tickets` - List tickets (role-filtered)
- `POST /tickets` - Create new ticket
- `POST /tickets/:id/approve` - Approve ticket
- `POST /tickets/:id/reject` - Reject ticket

### Access Events
- `GET /access-events` - List access events
- `GET /access-events/employee/:id` - Events for employee

### Patterns
- `GET /patterns` - List pattern detections
- `GET /patterns/employee/:id` - Patterns for employee
- `GET /patterns/reconnaissance` - Active reconnaissance patterns

### Dashboards
- `GET /dashboard/employee` - Employee dashboard data
- `GET /dashboard/manager` - Manager dashboard data
- `GET /dashboard/investigator` - Investigator dashboard data

## Technology Stack

**Frontend:**
- React 18.3
- Vite 5.4
- Tailwind CSS 3.4
- React Router 6.26
- Axios 1.7
- date-fns 3.6

**Backend:**
- Node.js with Express 4.19
- MongoDB 8.6
- Mongoose ODM
- JWT authentication
- CORS enabled

## Design System Colors

- **Primary:** #0C2D62 (navy)
- **Accent:** #028090 (teal)
- **Danger:** #E24B4A (red)
- **Warning:** #BA7517 (amber)
- **Success:** #1D9E75 (green)
- **Background:** #F7F9FC (off-white)

## License

Proprietary - Union Bank of India
