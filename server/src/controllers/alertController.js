import Alert from '../models/Alert.js';
import Employee from '../models/Employee.js';
import { ROLES, ALERT_STATUS } from '../config/constants.js';

export const getAlerts = async (req, res) => {
  try {
    const { role, employeeId } = req.user;
    const {
      page = 1,
      limit = 20,
      severity,
      status,
      startDate,
      endDate,
      employeeIdFilter
    } = req.query;

    let query = {};

    // Role-based filtering
    if (role === ROLES.EMPLOYEE) {
      query.employeeId = employeeId;
    } else if (role === ROLES.MANAGER) {
      // Get team member IDs
      const teamMembers = await Employee.find({ supervisor: employeeId }).select('_id');
      const teamIds = teamMembers.map(m => m._id);
      query.employeeId = { $in: [...teamIds, employeeId] };
    }
    // Investigators see all alerts

    // Additional filters
    if (severity) {
      query.severity = { $in: severity.split(',') };
    }

    if (status) {
      query.status = { $in: status.split(',') };
    }

    if (employeeIdFilter) {
      query.employeeId = employeeIdFilter;
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const skip = (page - 1) * limit;

    const [alerts, total] = await Promise.all([
      Alert.find(query)
        .populate('employeeId', 'name employeeId department branch currentRiskScore')
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip(skip)
        .lean(),
      Alert.countDocuments(query)
    ]);

    res.json({
      alerts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get alerts error:', error);
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
};

export const getAlertById = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, employeeId } = req.user;

    const alert = await Alert.findById(id)
      .populate('employeeId', 'name employeeId department branch currentRiskScore')
      .populate('metadata.patternIds')
      .populate('metadata.accessEventIds')
      .populate('metadata.ticketIds')
      .lean();

    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    // Authorization
    if (role === ROLES.EMPLOYEE && !employeeId.equals(alert.employeeId._id)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(alert);
  } catch (error) {
    console.error('Get alert error:', error);
    res.status(500).json({ error: 'Failed to fetch alert' });
  }
};

export const updateAlertStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    const { role, employeeId } = req.user;

    // Only managers and investigators can update alerts
    if (role === ROLES.EMPLOYEE) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const updateData = { status };
    if (notes) updateData.notes = notes;
    if (status === ALERT_STATUS.RESOLVED) {
      updateData.resolvedAt = new Date();
    }
    if (status === ALERT_STATUS.INVESTIGATING) {
      updateData.assignedTo = employeeId;
    }

    const alert = await Alert.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    ).populate('employeeId', 'name employeeId department');

    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    res.json(alert);
  } catch (error) {
    console.error('Update alert error:', error);
    res.status(500).json({ error: 'Failed to update alert' });
  }
};

export const getAlertStatistics = async (req, res) => {
  try {
    const { role } = req.user;

    if (role === ROLES.EMPLOYEE) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const stats = await Alert.aggregate([
      {
        $group: {
          _id: '$severity',
          total: { $sum: 1 },
          active: {
            $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
          },
          resolved: {
            $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] }
          }
        }
      }
    ]);

    const totalAlerts = await Alert.countDocuments();
    const activeAlerts = await Alert.countDocuments({ status: ALERT_STATUS.ACTIVE });

    res.json({
      totalAlerts,
      activeAlerts,
      bySeverity: stats
    });
  } catch (error) {
    console.error('Get alert statistics error:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
};

export const getAlertsByEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, employeeId } = req.user;

    // Authorization
    if (role === ROLES.EMPLOYEE && id !== employeeId.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const alerts = await Alert.find({ employeeId: id })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    res.json(alerts);
  } catch (error) {
    console.error('Get alerts by employee error:', error);
    res.status(500).json({ error: 'Failed to fetch employee alerts' });
  }
};
