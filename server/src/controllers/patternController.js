import Pattern from '../models/Pattern.js';
import Employee from '../models/Employee.js';
import { ROLES } from '../config/constants.js';

export const getPatterns = async (req, res) => {
  try {
    const { role, employeeId } = req.user;
    const { page = 1, limit = 20, patternType, severity, status } = req.query;

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
    if (patternType) {
      query.patternType = { $in: patternType.split(',') };
    }

    if (severity) {
      query.severity = { $in: severity.split(',') };
    }

    if (status) {
      query.status = { $in: status.split(',') };
    }

    const skip = (page - 1) * limit;

    const [patterns, total] = await Promise.all([
      Pattern.find(query)
        .populate('employeeId', 'name employeeId department currentRiskScore')
        .populate('evidence.accessEventId')
        .sort({ detectedAt: -1 })
        .limit(parseInt(limit))
        .skip(skip)
        .lean(),
      Pattern.countDocuments(query)
    ]);

    res.json({
      patterns,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get patterns error:', error);
    res.status(500).json({ error: 'Failed to fetch patterns' });
  }
};

export const getPatternById = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, employeeId } = req.user;

    const pattern = await Pattern.findById(id)
      .populate('employeeId', 'name employeeId department branch currentRiskScore')
      .populate('evidence.accessEventId')
      .lean();

    if (!pattern) {
      return res.status(404).json({ error: 'Pattern not found' });
    }

    // Authorization
    if (role === ROLES.EMPLOYEE && !employeeId.equals(pattern.employeeId._id)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(pattern);
  } catch (error) {
    console.error('Get pattern error:', error);
    res.status(500).json({ error: 'Failed to fetch pattern' });
  }
};

export const getPatternsByEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, employeeId } = req.user;

    // Authorization
    if (role === ROLES.EMPLOYEE && id !== employeeId.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const patterns = await Pattern.find({ employeeId: id })
      .populate('evidence.accessEventId')
      .sort({ detectedAt: -1 })
      .lean();

    res.json(patterns);
  } catch (error) {
    console.error('Get employee patterns error:', error);
    res.status(500).json({ error: 'Failed to fetch employee patterns' });
  }
};

export const getReconnaissancePatterns = async (req, res) => {
  try {
    const { role } = req.user;

    if (role === ROLES.EMPLOYEE) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const patterns = await Pattern.find({
      patternType: 'reconnaissance',
      status: 'active'
    })
      .populate('employeeId', 'name employeeId department currentRiskScore')
      .sort({ severity: -1, detectedAt: -1 })
      .lean();

    res.json(patterns);
  } catch (error) {
    console.error('Get reconnaissance patterns error:', error);
    res.status(500).json({ error: 'Failed to fetch reconnaissance patterns' });
  }
};

export const updatePatternStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const { role } = req.user;

    if (role === ROLES.EMPLOYEE) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const pattern = await Pattern.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    ).populate('employeeId', 'name employeeId department');

    if (!pattern) {
      return res.status(404).json({ error: 'Pattern not found' });
    }

    res.json(pattern);
  } catch (error) {
    console.error('Update pattern error:', error);
    res.status(500).json({ error: 'Failed to update pattern' });
  }
};
