import { useState, useEffect } from 'react';
import { dashboardService } from '../../services';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Loader from '../../components/common/Loader';
import { formatRelativeTime } from '../../utils/formatters';
import { getRiskBadge } from '../../utils/constants';

export default function ManagerDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const dashboardData = await dashboardService.getManagerDashboard();
      setData(dashboardData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loader text="Loading dashboard..." />;
  if (error) return <div className="text-danger">Error: {error}</div>;
  if (!data) return <div>No data available</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Manager Dashboard</h1>
        <p className="text-neutral-600">Monitor your team's risk profile and pending approvals</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <h3 className="text-sm font-medium text-neutral-600 mb-2">Team Size</h3>
          <span className="text-4xl font-bold text-neutral-900">{data.teamSize}</span>
        </Card>

        <Card>
          <h3 className="text-sm font-medium text-neutral-600 mb-2">High Risk Members</h3>
          <span className="text-4xl font-bold text-warning-600">{data.highRiskCount}</span>
        </Card>

        <Card>
          <h3 className="text-sm font-medium text-neutral-600 mb-2">Active Alerts</h3>
          <span className="text-4xl font-bold text-danger-600">{data.alertStats.active}</span>
        </Card>

        <Card>
          <h3 className="text-sm font-medium text-neutral-600 mb-2">Pending Approvals</h3>
          <span className="text-4xl font-bold text-accent-600">{data.pendingApprovals}</span>
        </Card>
      </div>

      {/* Team Members */}
      <Card>
        <h2 className="text-lg font-semibold text-neutral-900 mb-4">Team Overview</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b">
                <th className="px-4 py-2 text-left text-xs font-medium text-neutral-600">Name</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-neutral-600">Department</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-neutral-600">Risk Score</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-neutral-600">Alerts</th>
              </tr>
            </thead>
            <tbody>
              {data.teamMembers.map((member) => (
                <tr key={member._id} className="border-b hover:bg-neutral-50">
                  <td className="px-4 py-3 text-sm font-medium text-neutral-900">{member.name}</td>
                  <td className="px-4 py-3 text-sm text-neutral-700">{member.department}</td>
                  <td className="px-4 py-3">
                    <Badge variant={getRiskBadge(member.currentRiskScore)}>
                      {member.currentRiskScore}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-sm text-neutral-700">{member.alertCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Pending Tickets */}
      <Card>
        <h2 className="text-lg font-semibold text-neutral-900 mb-4">Pending Ticket Approvals</h2>
        {data.pendingTickets.length === 0 ? (
          <p className="text-neutral-500 text-center py-8">No pending tickets</p>
        ) : (
          <div className="space-y-3">
            {data.pendingTickets.map((ticket) => (
              <div key={ticket._id} className="flex items-start justify-between p-3 bg-neutral-50 rounded-lg">
                <div className="flex-1">
                  <p className="text-sm font-medium text-neutral-900">{ticket.employeeId?.name}</p>
                  <p className="text-xs text-neutral-600 mt-1">{ticket.text.substring(0, 100)}...</p>
                  <p className="text-xs text-neutral-500 mt-1">Score: {ticket.overallScore}</p>
                </div>
                <Badge variant={ticket.status}>{ticket.status}</Badge>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
