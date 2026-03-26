import AccessEvent from '../models/AccessEvent.js';
import Employee from '../models/Employee.js';
import { ROLES } from '../config/constants.js';

export const getAccessEvents = async (req, res) => {
  try {
    const { role, employeeId } = req.user;
    const {
      page = 1,
      limit = 50,
      startDate,
      endDate,
      system,
      minAnomalyScore
    } = req.query;

    let query = {};

    // Role-based filtering
    if (role === ROLES.EMPLOYEE) {
      query.employeeId = employeeId;
    } else if (role === ROLES.MANAGER) {
      const teamMembers = await Employee.find({ supervisor: employeeId }).select('_id');
      const teamIds = teamMembers.map(m => m._id);
      query.employeeId = { $in: [...teamIds, employeeId] };
    }
    // Investigators see all

    // Filters
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    if (system) {
      query.system = { $in: system.split(',') };
    }

    if (minAnomalyScore) {
      query.anomalyScore = { $gte: parseInt(minAnomalyScore) };
    }

    const skip = (page - 1) * limit;

    const [events, total] = await Promise.all([
      AccessEvent.find(query)
        .populate('employeeId', 'name employeeId department')
        .sort({ timestamp: -1 })
        .limit(parseInt(limit))
        .skip(skip)
        .lean(),
      AccessEvent.countDocuments(query)
    ]);

    res.json({
      events,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get access events error:', error);
    res.status(500).json({ error: 'Failed to fetch access events' });
  }
};

export const getAccessEventById = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, employeeId } = req.user;

    const event = await AccessEvent.findById(id)
      .populate('employeeId', 'name employeeId department branch')
      .lean();

    if (!event) {
      return res.status(404).json({ error: 'Access event not found' });
    }

    // Authorization
    if (role === ROLES.EMPLOYEE && !employeeId.equals(event.employeeId._id)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(event);
  } catch (error) {
    console.error('Get access event error:', error);
    res.status(500).json({ error: 'Failed to fetch access event' });
  }
};

export const getAccessEventsByEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, employeeId } = req.user;
    const { limit = 100, startDate, endDate } = req.query;

    // Authorization
    if (role === ROLES.EMPLOYEE && id !== employeeId.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }

    let query = { employeeId: id };

    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    const events = await AccessEvent.find(query)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .lean();

    res.json(events);
  } catch (error) {
    console.error('Get employee access events error:', error);
    res.status(500).json({ error: 'Failed to fetch employee access events' });
  }
};

export const getAccessEventStatsByEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, employeeId } = req.user;

    // Authorization
    if (role === ROLES.EMPLOYEE && id !== employeeId.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const stats = await AccessEvent.aggregate([
      { $match: { employeeId: mongoose.Types.ObjectId(id) } },
      {
        $group: {
          _id: null,
          totalEvents: { $sum: 1 },
          avgAnomalyScore: { $avg: '$anomalyScore' },
          highAnomalyCount: {
            $sum: { $cond: [{ $gte: ['$anomalyScore', 70] }, 1, 0] }
          },
          systemsAccessed: { $addToSet: '$system' },
          totalVolumeAccessed: { $sum: '$volumeAccessed' }
        }
      }
    ]);

    res.json(stats[0] || {});
  } catch (error) {
    console.error('Get access event stats error:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
};
