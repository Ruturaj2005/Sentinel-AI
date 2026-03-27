# Sentinel - Insider Fraud Detection System

An AI-powered insider fraud detection system for Union Bank of India.

## Features

- **Role-Based Dashboards**: Three distinct user views (Employee, Manager, CVU Investigator)
- **Real-Time Risk Scoring**: Automated risk assessment based on access patterns
- **Pattern Detection**: Identifies reconnaissance and data exfiltration behaviors
- **Ticket Management**: Automated routing with intelligent scoring
- **Alert System**: Comprehensive alerting with severity levels

## Tech Stack

- **Frontend**: React 18 + Vite + Tailwind CSS
- **Backend**: Node.js + Express
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT-based with role switching

## Getting Started

### Prerequisites

- Node.js (v18+ recommended)
- MongoDB (v6+ recommended)
- npm or yarn

### Installation

```bash
# Install all dependencies
npm run install:all

# Or manually
npm install
cd client && npm install
cd ../server && npm install
```

### Database Setup

1. Start MongoDB:
```bash
mongod
```

2. Seed the database with mock data:
```bash
npm run seed
```

This creates:
- 20 mock employees
- 90 days of access event history
- Patterns, tickets, and alerts

### Running the Application

```bash
# Run both client and server concurrently
npm run dev

# Or run separately
npm run client  # Frontend at http://localhost:5173
npm run server  # Backend at http://localhost:5001
```

## Project Structure

```
sentinel-ubi/
├── client/          # React frontend
│   └── src/
│       ├── components/
│       ├── pages/
│       ├── contexts/
│       ├── hooks/
│       └── services/
├── server/          # Express backend
│   └── src/
│       ├── models/
│       ├── controllers/
│       ├── routes/
│       ├── services/
│       └── seeds/
└── package.json     # Workspace root
```

## User Roles

### Employee
- View personal access history
- Raise tickets for flagged activities
- Monitor own risk score

### Manager
- View team alerts
- Approve medium-risk tickets
- Team overview dashboard

### CVU Investigator
- Full system access
- View all employees and alerts
- Pattern analysis tools
- System-wide statistics

## Demo Mode

Use the role switcher in the top right corner to switch between roles instantly for demonstration purposes.

## Key Employees (Mock Data)

- **Ramesh Kumar** - Loans Officer, Risk Score: 87 (Reconnaissance pattern)
- **Priya Sharma** - Credit Manager, Risk Score: 12 (Clean record)
- **Vikram Singh** - Treasury Officer, Risk Score: 94 (Data exfiltration pattern)

## API Documentation

See `/docs/API.md` for complete API documentation.

## License

Proprietary - Union Bank of India
