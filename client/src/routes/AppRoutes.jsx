import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/layout/Layout';
import Loader from '../components/common/Loader';

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
  const { loading, role } = useAuth();

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
      {/* Root redirect based on role */}
      <Route
        path="/"
        element={<Navigate to={`/${currentRole}/dashboard`} replace />}
      />

      {/* Employee routes */}
      <Route path="/employee">
        <Route path="dashboard" element={<Layout><EmployeeDashboard /></Layout>} />
        <Route path="access-history" element={<Layout><MyAccessHistory /></Layout>} />
        <Route path="tickets" element={<Layout><MyTickets /></Layout>} />
      </Route>

      {/* Manager routes */}
      <Route path="/manager">
        <Route path="dashboard" element={<Layout><ManagerDashboard /></Layout>} />
        <Route path="alerts" element={<Layout><TeamAlerts /></Layout>} />
        <Route path="approvals" element={<Layout><PendingApprovals /></Layout>} />
        <Route path="team" element={<Layout><TeamOverview /></Layout>} />
      </Route>

      {/* Investigator routes */}
      <Route path="/investigator">
        <Route path="dashboard" element={<Layout><InvestigatorDashboard /></Layout>} />
        <Route path="employees" element={<Layout><AllEmployees /></Layout>} />
        <Route path="alerts" element={<Layout><AllAlerts /></Layout>} />
        <Route path="tickets" element={<Layout><TicketQueue /></Layout>} />
        <Route path="patterns" element={<Layout><ReconnaissancePatterns /></Layout>} />
        <Route path="reports" element={<Layout><Reports /></Layout>} />
        <Route path="tools/nlp-scorer" element={<Layout><NLPTicketScorer /></Layout>} />
        <Route path="tools/baseline-comparison" element={<Layout><BaselineComparison /></Layout>} />
      </Route>

      {/* 404 */}
      <Route path="*" element={<Navigate to={`/${currentRole}/dashboard`} replace />} />
    </Routes>
  );
}
