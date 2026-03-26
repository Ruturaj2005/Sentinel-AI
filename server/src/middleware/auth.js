import jwt from 'jsonwebtoken';
import env from '../config/env.js';
import Employee from '../models/Employee.js';

export const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'No authentication token provided' });
    }

    const decoded = jwt.verify(token, env.jwtSecret);

    const employee = await Employee.findById(decoded.employeeId);
    if (!employee) {
      return res.status(401).json({ error: 'Invalid authentication token' });
    }

    req.user = {
      employeeId: employee._id,
      role: decoded.role,
      name: employee.name,
      email: employee.email
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    return res.status(500).json({ error: 'Authentication failed' });
  }
};

export const optionalAuth = async (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const decoded = jwt.verify(token, env.jwtSecret);
    const employee = await Employee.findById(decoded.employeeId);

    if (employee) {
      req.user = {
        employeeId: employee._id,
        role: decoded.role,
        name: employee.name,
        email: employee.email
      };
    } else {
      req.user = null;
    }
  } catch (error) {
    req.user = null;
  }

  next();
};
