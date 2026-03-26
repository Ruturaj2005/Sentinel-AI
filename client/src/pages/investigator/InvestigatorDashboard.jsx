import { useState, useEffect } from 'react';
import { employeeService, alertService, ticketService } from '../../services';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Loader from '../../components/common/Loader';
import Button from '../../components/common/Button';
import EmployeeProfilePanel from '../../components/investigator/EmployeeProfilePanel';
import { formatRelativeTime, formatDateTime } from '../../utils/formatters';
import { getRiskBadge } from '../../utils/constants';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function InvestigatorDashboard() {
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [stats, setStats] = useState({
    totalEmployees: 76700,
    highRiskCount: 0,
    activeAlertsToday: 0,
    pendingTickets: 0
  });
  const [riskDistribution, setRiskDistribution] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [riskFilter, setRiskFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [sortConfig, setSortConfig] = useState({ key: 'currentRiskScore', direction: 'desc' });
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      const [employeesData, alertsData, ticketsData] = await Promise.all([
        employeeService.getAll({ limit: 100, sortBy: 'currentRiskScore', order: 'desc' }),
        alertService.getAll({ limit: 100 }),
        ticketService.getAll({ limit: 100 })
      ]);

      setEmployees(employeesData.employees || []);
      setAlerts(alertsData.alerts || []);
      setTickets(ticketsData.tickets || []);

      // Calculate statistics
      const highRisk = employeesData.employees.filter(e => e.currentRiskScore >= 65).length;
      const todayAlerts = alertsData.alerts.filter(a => {
        const alertDate = new Date(a.createdAt);
        const today = new Date();
        return alertDate.toDateString() === today.toDateString() && a.status === 'active';
      }).length;
      const pending = ticketsData.tickets.filter(t => t.status === 'pending').length;

      setStats({
        totalEmployees: 76700,
        highRiskCount: highRisk,
        activeAlertsToday: todayAlerts,
        pendingTickets: pending
      });

      // Calculate risk distribution
      const distribution = [
        { range: '0-30', label: 'Low Risk', count: 0, fill: '#1D9E75' },
        { range: '30-65', label: 'Medium Risk', count: 0, fill: '#BA7517' },
        { range: '65-100', label: 'High Risk', count: 0, fill: '#E24B4A' }
      ];

      employeesData.employees.forEach(emp => {
        if (emp.currentRiskScore >= 0 && emp.currentRiskScore < 30) {
          distribution[0].count++;
        } else if (emp.currentRiskScore >= 30 && emp.currentRiskScore < 65) {
          distribution[1].count++;
        } else {
          distribution[2].count++;
        }
      });

      setRiskDistribution(distribution);
    } catch (err) {
      console.error('Error loading dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === '  asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getFilteredAndSortedEmployees = () => {
    let filtered = [...employees];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(emp =>
        emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.department.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Risk filter
    if (riskFilter !== 'all') {
      if (riskFilter === 'low') {
        filtered = filtered.filter(emp => emp.currentRiskScore < 30);
      } else if (riskFilter === 'medium') {
        filtered = filtered.filter(emp => emp.currentRiskScore >= 30 && emp.currentRiskScore < 65);
      } else if (riskFilter === 'high') {
        filtered = filtered.filter(emp => emp.currentRiskScore >= 65);
      }
    }

    // Department filter
    if (departmentFilter !== 'all') {
      filtered = filtered.filter(emp => emp.department === departmentFilter);
    }

    // Sort
    filtered.sort((a, b) => {
      let aVal = a[sortConfig.key];
      let bVal = b[sortConfig.key];

      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }

      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  };

  const uniqueDepartments = [...new Set(employees.map(e => e.department))];
  const filteredEmployees = getFilteredAndSortedEmployees();

  if (loading) return <Loader text="Loading CVU Dashboard..." />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-primary">CVU Investigator Dashboard</h1>
        <p className="text-neutral-600 mt-1">Central Vigilance Unit - Comprehensive Fraud Monitoring System</p>
      </div>

      {/* Top Row - 4 Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <h3 className="text-sm font-medium text-neutral-600 mb-2">Total Employees Monitored</h3>
          <span className="text-4xl font-bold text-neutral-900">{stats.totalEmployees.toLocaleString()}</span>
        </Card>

        <Card>
          <h3 className="text-sm font-medium text-neutral-600 mb-2">High Risk Employees</h3>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold text-danger">{stats.highRiskCount}</span>
            <Badge variant="danger">≥65</Badge>
          </div>
        </Card>

        <Card>
          <h3 className="text-sm font-medium text-neutral-600 mb-2">Active Alerts Today</h3>
          <span className="text-4xl font-bold text-warning">{stats.activeAlertsToday}</span>
        </Card>

        <Card>
          <h3 className="text-sm font-medium text-neutral-600 mb-2">Tickets Pending Review</h3>
          <span className="text-4xl font-bold text-neutral-900">{stats.pendingTickets}</span>
        </Card>
      </div>

      {/* Second Row - Risk Distribution Chart & Recent Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Risk Distribution Chart */}
        <Card>
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">Risk Distribution</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={riskDistribution}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#0C2D62" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Recent Alert Feed */}
        <Card>
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">Recent Alert Feed</h2>
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {alerts.slice(0, 10).map((alert) => (
              <div key={alert._id} className="p-3 bg-neutral-50 rounded-lg hover:bg-neutral-100 transition">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-neutral-900">
                        {alert.employeeId?.name || 'Unknown'}
                      </span>
                      <Badge variant={getRiskBadge(alert.metadata?.riskScore || 0)}>
                        {alert.metadata?.riskScore || 0}
                      </Badge>
                      <Badge variant={alert.severity}>{alert.severity}</Badge>
                    </div>
                    <p className="text-xs text-neutral-700">{alert.triggerReason}</p>
                    <p className="text-xs text-neutral-500 mt-1">{formatRelativeTime(alert.createdAt)}</p>
                  </div>
                  <Button size="sm" variant="secondary">View</Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Employee Risk Monitor Table */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-neutral-900">Employee Risk Monitor</h2>
          <div className="flex items-center gap-3">
            {/* Search */}
            <input
              type="text"
              placeholder="Search employees..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input text-sm w-64"
            />

            {/* Risk Filter */}
            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              className="input text-sm"
            >
              <option value="all">All Risk Levels</option>
              <option value="low">Low (0-30)</option>
              <option value="medium">Medium (30-65)</option>
              <option value="high">High (65-100)</option>
            </select>

            {/* Department Filter */}
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="input text-sm"
            >
              <option value="all">All Departments</option>
              {uniqueDepartments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-neutral-100">
              <tr>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-neutral-700 cursor-pointer hover:bg-neutral-200"
                  onClick={() => handleSort('employeeId')}
                >
                  Employee ID {sortConfig.key === 'employeeId' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-neutral-700 cursor-pointer hover:bg-neutral-200"
                  onClick={() => handleSort('name')}
                >
                  Name {sortConfig.key === 'name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-neutral-700 cursor-pointer hover:bg-neutral-200"
                  onClick={() => handleSort('role')}
                >
                  Role {sortConfig.key === 'role' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-neutral-700 cursor-pointer hover:bg-neutral-200"
                  onClick={() => handleSort('branch')}
                >
                  Branch {sortConfig.key === 'branch' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-neutral-700 cursor-pointer hover:bg-neutral-200"
                  onClick={() => handleSort('currentRiskScore')}
                >
                  Risk Score {sortConfig.key === 'currentRiskScore' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-neutral-700">
                  Score Trend
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-neutral-700">
                  Last Anomaly
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-neutral-700">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-neutral-200">
              {filteredEmployees.map((employee) => {
                // Calculate trend
                const history = employee.riskScoreHistory || [];
                const trend = history.length >= 2
                  ? history[history.length - 1].score - history[history.length - 2].score
                  : 0;

                return (
                  <tr
                    key={employee._id}
                    className="hover:bg-neutral-50 cursor-pointer"
                    onClick={() => setSelectedEmployee(employee)}
                  >
                    <td className="px-4 py-3 text-sm text-neutral-900 font-mono">{employee.employeeId}</td>
                    <td className="px-4 py-3 text-sm font-medium text-neutral-900">{employee.name}</td>
                    <td className="px-4 py-3 text-sm text-neutral-700 capitalize">{employee.role}</td>
                    <td className="px-4 py-3 text-sm text-neutral-700">{employee.branch}</td>
                    <td className="px-4 py-3">
                      <Badge variant={getRiskBadge(employee.currentRiskScore)}>
                        {employee.currentRiskScore}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {trend > 0 ? (
                        <span className="text-danger flex items-center gap-1">
                          ↑ {Math.abs(trend).toFixed(0)}
                        </span>
                      ) : trend < 0 ? (
                        <span className="text-success flex items-center gap-1">
                          ↓ {Math.abs(trend).toFixed(0)}
                        </span>
                      ) : (
                        <span className="text-neutral-500">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-neutral-600">
                      {history.length > 0 ? formatRelativeTime(history[history.length - 1].timestamp) : 'None'}
                    </td>
                    <td className="px-4 py-3">
                      <Button size="sm" variant="accent" onClick={(e) => {
                        e.stopPropagation();
                        setSelectedEmployee(employee);
                      }}>
                        View Profile
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filteredEmployees.length === 0 && (
            <div className="text-center py-8 text-neutral-500">
              No employees found matching your filters
            </div>
          )}
        </div>
      </Card>

      {/* Employee Profile Panel */}
      {selectedEmployee && (
        <EmployeeProfilePanel
          employee={selectedEmployee}
          onClose={() => setSelectedEmployee(null)}
        />
      )}
    </div>
  );
}
