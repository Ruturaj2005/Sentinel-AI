import Employee from '../models/Employee.js';
import Alert from '../models/Alert.js';
import { ROLES } from '../config/constants.js';

export const getEmployees = async (req, res) => {
  try {
    const { role, employeeId } = req.user;
    const { page = 1, limit = 20, sortBy = 'currentRiskScore', order = 'desc', search } = req.query;

    let query = {};

    // Role-based filtering
    if (role === ROLES.EMPLOYEE) {
      // Employees can only see themselves
      query._id = employeeId;
    } else if (role === ROLES.MANAGER) {
      // Managers see their team
      query.supervisor = employeeId;
    }
    // Investigators see all employees (no filter)

    // Search filter
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { employeeId: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { department: { $regex: search, $options: 'i' } }
      ];
    }

    const sortOrder = order === 'asc' ? 1 : -1;
    const skip = (page - 1) * limit;

    const [employees, total] = await Promise.all([
      Employee.find(query)
        .select('-__v')
        .sort({ [sortBy]: sortOrder })
        .limit(parseInt(limit))
        .skip(skip)
        .lean(),
      Employee.countDocuments(query)
    ]);

    res.json({
      employees,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get employees error:', error);
    res.status(500).json({ error: 'Failed to fetch employees' });
  }
};

export const getEmployeeById = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, employeeId } = req.user;

    const employee = await Employee.findById(id).select('-__v').lean();

    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    // Authorization check
    if (role === ROLES.EMPLOYEE && !employeeId.equals(employee._id)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (role === ROLES.MANAGER) {
      const isTeamMember = await Employee.findOne({
        _id: id,
        supervisor: employeeId
      });
      if (!isTeamMember) {
        return res.status(403).json({ error: 'Access denied - not your team member' });
      }
    }

    res.json(employee);
  } catch (error) {
    console.error('Get employee error:', error);
    res.status(500).json({ error: 'Failed to fetch employee' });
  }
};

export const getEmployeeRiskHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, employeeId } = req.user;

    // Authorization
    if (role === ROLES.EMPLOYEE && id !== employeeId.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const employee = await Employee.findById(id)
      .select('name employeeId riskScoreHistory currentRiskScore')
      .lean();

    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    res.json({
      employeeId: employee.employeeId,
      name: employee.name,
      currentRiskScore: employee.currentRiskScore,
      history: employee.riskScoreHistory
    });
  } catch (error) {
    console.error('Get risk history error:', error);
    res.status(500).json({ error: 'Failed to fetch risk history' });
  }
};

export const getHighRiskEmployees = async (req, res) => {
  try {
    const { role } = req.user;
    const threshold = parseInt(req.query.threshold) || 70;

    if (role !== ROLES.INVESTIGATOR && role !== ROLES.MANAGER) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Use aggregation pipeline
    const employees = await Employee.aggregate([
      { $match: { currentRiskScore: { $gte: threshold } } },
      {
        $lookup: {
          from: 'alerts',
          localField: '_id',
          foreignField: 'employeeId',
          as: 'alerts'
        }
      },
      {
        $project: {
          name: 1,
          employeeId: 1,
          department: 1,
          branch: 1,
          currentRiskScore: 1,
          alertCount: { $size: '$alerts' },
          activeAlerts: {
            $size: {
              $filter: {
                input: '$alerts',
                cond: { $eq: ['$$this.status', 'active'] }
              }
            }
          }
        }
      },
      { $sort: { currentRiskScore: -1 } }
    ]);

    res.json(employees);
  } catch (error) {
    console.error('Get high-risk employees error:', error);
    res.status(500).json({ error: 'Failed to fetch high-risk employees' });
  }
};
