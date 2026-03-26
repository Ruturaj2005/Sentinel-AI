import Employee from '../models/Employee.js';
import Alert from '../models/Alert.js';
import Ticket from '../models/Ticket.js';
import AccessEvent from '../models/AccessEvent.js';
import Pattern from '../models/Pattern.js';
import { ROLES, ALERT_STATUS, TICKET_STATUS } from '../config/constants.js';

export const getEmployeeDashboard = async (req, res) => {
  try {
    const { employeeId } = req.user;

    const [employee, alerts, tickets, recentEvents, patterns] = await Promise.all([
      Employee.findById(employeeId).select('name employeeId currentRiskScore riskScoreHistory department branch role').lean(),
      Alert.find({ employeeId }).sort({ createdAt: -1 }).limit(10).lean(),
      Ticket.find({ employeeId }).sort({ createdAt: -1 }).limit(10).lean(),
      AccessEvent.find({ employeeId }).sort({ timestamp: -1 }).limit(20).lean(),
      Pattern.find({ employeeId, status: 'active' }).lean()
    ]);

    const alertStats = {
      total: alerts.length,
      active: alerts.filter(a => a.status === ALERT_STATUS.ACTIVE).length,
      critical: alerts.filter(a => a.severity === 'critical').length
    };

    const ticketStats = {
      total: tickets.length,
      pending: tickets.filter(t => t.status === TICKET_STATUS.PENDING).length,
      approved: tickets.filter(t => t.status === TICKET_STATUS.APPROVED).length
    };

    res.json({
      employee,
      alertStats,
      ticketStats,
      recentAlerts: alerts.slice(0, 5),
      recentTickets: tickets.slice(0, 5),
      recentEvents: recentEvents.slice(0, 10),
      activePatterns: patterns.length
    });
  } catch (error) {
    console.error('Get employee dashboard error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
};

export const getManagerDashboard = async (req, res) => {
  try {
    const { employeeId } = req.user;

    // Get team members
    const teamMembers = await Employee.find({ supervisor: employeeId }).select('_id name currentRiskScore department').lean();
    const teamIds = teamMembers.map(m => m._id);

    const [teamAlerts, pendingTickets, highRiskTeamMembers, recentPatterns] = await Promise.all([
      Alert.find({ employeeId: { $in: teamIds } }).sort({ createdAt: -1 }).limit(20).lean(),
      Ticket.find({
        routingDecision: 'manager_review',
        status: TICKET_STATUS.PENDING
      }).populate('employeeId', 'name employeeId').limit(15).lean(),
      Employee.find({ _id: { $in: teamIds }, currentRiskScore: { $gte: 60 } }).sort({ currentRiskScore: -1 }).lean(),
      Pattern.find({ employeeId: { $in: teamIds }, status: 'active' }).populate('employeeId', 'name employeeId').lean()
    ]);

    const alertStats = {
      total: teamAlerts.length,
      active: teamAlerts.filter(a => a.status === ALERT_STATUS.ACTIVE).length,
      bySeverity: {
        critical: teamAlerts.filter(a => a.severity === 'critical').length,
        high: teamAlerts.filter(a => a.severity === 'high').length,
        medium: teamAlerts.filter(a => a.severity === 'medium').length
      }
    };

    res.json({
      teamSize: teamMembers.length,
      highRiskCount: highRiskTeamMembers.length,
      alertStats,
      pendingApprovals: pendingTickets.length,
      teamMembers: teamMembers.map(m => ({
        ...m,
        alertCount: teamAlerts.filter(a => a.employeeId.equals(m._id)).length
      })),
      recentAlerts: teamAlerts.slice(0, 10),
      pendingTickets: pendingTickets.slice(0, 10),
      activePatterns: recentPatterns
    });
  } catch (error) {
    console.error('Get manager dashboard error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
};

export const getInvestigatorDashboard = async (req, res) => {
  try {
    const [
      totalEmployees,
      highRiskEmployees,
      totalAlerts,
      activeAlerts,
      criticalAlerts,
      totalTickets,
      pendingTickets,
      totalPatterns,
      recentAlerts,
      alertsBySeverity
    ] = await Promise.all([
      Employee.countDocuments(),
      Employee.countDocuments({ currentRiskScore: { $gte: 70 } }),
      Alert.countDocuments(),
      Alert.countDocuments({ status: ALERT_STATUS.ACTIVE }),
      Alert.countDocuments({ severity: 'critical', status: ALERT_STATUS.ACTIVE }),
      Ticket.countDocuments(),
      Ticket.countDocuments({ status: TICKET_STATUS.PENDING }),
      Pattern.countDocuments({ status: 'active' }),
      Alert.find().sort({ createdAt: -1 }).limit(20).populate('employeeId', 'name employeeId department currentRiskScore').lean(),
      Alert.aggregate([
        {
          $group: {
            _id: '$severity',
            count: { $sum: 1 },
            active: {
              $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
            }
          }
        }
      ])
    ]);

    const topRiskEmployees = await Employee.find()
      .sort({ currentRiskScore: -1 })
      .limit(10)
      .select('name employeeId department currentRiskScore')
      .lean();

    // Get alert count for each top risk employee
    for (const emp of topRiskEmployees) {
      const alertCount = await Alert.countDocuments({ employeeId: emp._id, status: ALERT_STATUS.ACTIVE });
      emp.activeAlertCount = alertCount;
    }

    res.json({
      overview: {
        totalEmployees,
        highRiskEmployees,
        totalAlerts,
        activeAlerts,
        criticalAlerts,
        totalTickets,
        pendingTickets,
        activePatterns: totalPatterns
      },
      alertsBySeverity,
      topRiskEmployees,
      recentAlerts: recentAlerts.slice(0, 15)
    });
  } catch (error) {
    console.error('Get investigator dashboard error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
};
