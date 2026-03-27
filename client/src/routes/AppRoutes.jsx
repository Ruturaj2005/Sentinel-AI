import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/layout/Layout';
import Loader from '../components/common/Loader';
import LandingPage from '../pages/LandingPage';

// Employee pages
import EmployeeDashboard from '../pages/employee/EmployeeDashboard';
import MyAccessHistory from '../pages/employee/MyAccessHistory';
import MyTickets from '../pages/employee/MyTickets';

// Manager pages
import ManagerDashboard from '../pages/manager/ManagerDashboard';
import TeamAlerts from '../pages/manager/TeamAlerts';
import PendingApprovals from '../pages/manager/PendingApprovals';
import TeamOverview from '../pages/manager/TeamOverview';

// Investigator pages
import InvestigatorDashboard from '../pages/investigator/InvestigatorDashboard';
import AllEmployees from '../pages/investigator/AllEmployees';
import AllAlerts from '../pages/investigator/AllAlerts';
import ReconnaissancePatterns from '../pages/investigator/ReconnaissancePatterns';
import TicketQueue from '../pages/investigator/TicketQueue';
import Reports from '../pages/investigator/Reports';
import NLPTicketScorer from '../pages/investigator/NLPTicketScorer';
import BaselineComparison from '../pages/investigator/BaselineComparison';

export default function AppRoutes() {
  const { loading, role, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader text="Loading..." />
      </div>
    );
  }

  // Default to employee role if not set
  const currentRole = role || 'employee';

  return (
    <Routes>
      {/* Landing page */}
      <Route path="/" element={<LandingPage />} />

      {/* Employee routes */}
      <Route path="/employee">
        <Route
          path="dashboard"
          element={isAuthenticated ? <Layout><EmployeeDashboard /></Layout> : <Navigate to="/" replace />}
        />
        <Route
          path="access-history"
          element={isAuthenticated ? <Layout><MyAccessHistory /></Layout> : <Navigate to="/" replace />}
        />
        <Route
          path="tickets"
          element={isAuthenticated ? <Layout><MyTickets /></Layout> : <Navigate to="/" replace />}
        />
      </Route>

      {/* Manager routes */}
      <Route path="/manager">
        <Route
          path="dashboard"
          element={isAuthenticated ? <Layout><ManagerDashboard /></Layout> : <Navigate to="/" replace />}
        />
        <Route
          path="alerts"
          element={isAuthenticated ? <Layout><TeamAlerts /></Layout> : <Navigate to="/" replace />}
        />
        <Route
          path="approvals"
          element={isAuthenticated ? <Layout><PendingApprovals /></Layout> : <Navigate to="/" replace />}
        />
        <Route
          path="team"
          element={isAuthenticated ? <Layout><TeamOverview /></Layout> : <Navigate to="/" replace />}
        />
      </Route>

      {/* Investigator routes */}
      <Route path="/investigator">
        <Route
          path="dashboard"
          element={isAuthenticated ? <Layout><InvestigatorDashboard /></Layout> : <Navigate to="/" replace />}
        />
        <Route
          path="employees"
          element={isAuthenticated ? <Layout><AllEmployees /></Layout> : <Navigate to="/" replace />}
        />
        <Route
          path="alerts"
          element={isAuthenticated ? <Layout><AllAlerts /></Layout> : <Navigate to="/" replace />}
        />
        <Route
          path="tickets"
          element={isAuthenticated ? <Layout><TicketQueue /></Layout> : <Navigate to="/" replace />}
        />
        <Route
          path="patterns"
          element={isAuthenticated ? <Layout><ReconnaissancePatterns /></Layout> : <Navigate to="/" replace />}
        />
        <Route
          path="reports"
          element={isAuthenticated ? <Layout><Reports /></Layout> : <Navigate to="/" replace />}
        />
        <Route
          path="tools/nlp-scorer"
          element={isAuthenticated ? <Layout><NLPTicketScorer /></Layout> : <Navigate to="/" replace />}
        />
        <Route
          path="tools/baseline-comparison"
          element={isAuthenticated ? <Layout><BaselineComparison /></Layout> : <Navigate to="/" replace />}
        />
      </Route>

      {/* 404 */}
      <Route path="*" element={<Navigate to={isAuthenticated ? `/${currentRole}/dashboard` : '/'} replace />} />
    </Routes>
  );
}
