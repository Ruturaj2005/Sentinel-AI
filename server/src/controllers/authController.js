import jwt from 'jsonwebtoken';
import Employee from '../models/Employee.js';
import env from '../config/env.js';
import { ROLES } from '../config/constants.js';

// For demo purposes - generate JWT with specified role
export const switchRole = async (req, res) => {
  try {
    const { role, employeeId } = req.body;

    // Validate role
    if (!Object.values(ROLES).includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    let employee;

    // If specific employeeId provided, use it
    if (employeeId) {
      employee = await Employee.findById(employeeId);
      if (!employee) {
        return res.status(404).json({ error: 'Employee not found' });
      }
    } else {
      // Otherwise, find a suitable employee with that role
      employee = await Employee.findOne({ role });

      // If requesting investigator role and none exists, create/find one
      if (!employee && role === ROLES.INVESTIGATOR) {
        employee = await Employee.findOne({ department: 'Compliance' });
      }

      // If no employee found, get any employee and override role
      if (!employee) {
        employee = await Employee.findOne().sort({ createdAt: 1 });
      }
    }

    if (!employee) {
      return res.status(404).json({ error: 'No employees found in database' });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        employeeId: employee._id,
        role: role, // Use requested role, not employee's stored role
        name: employee.name,
        email: employee.email
      },
      env.jwtSecret,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        employeeId: employee._id,
        name: employee.name,
        email: employee.email,
        role: role,
        department: employee.department,
        branch: employee.branch,
        riskScore: employee.currentRiskScore
      }
    });
  } catch (error) {
    console.error('Switch role error:', error);
    res.status(500).json({ error: 'Failed to switch role' });
  }
};

export const getCurrentUser = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const employee = await Employee.findById(req.user.employeeId)
      .select('-__v')
      .lean();

    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    res.json({
      ...employee,
      role: req.user.role // Use role from JWT
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ error: 'Failed to get user info' });
  }
};
