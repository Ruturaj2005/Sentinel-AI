import { ROLES } from '../config/constants.js';

export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Access denied',
        message: `This resource requires one of the following roles: ${allowedRoles.join(', ')}`
      });
    }

    next();
  };
};

export const authorizeOwnerOrRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const resourceEmployeeId = req.params.id || req.params.employeeId;

    // Allow if user has privileged role
    if (allowedRoles.includes(req.user.role)) {
      return next();
    }

    // Allow if user is accessing their own resource
    if (resourceEmployeeId && resourceEmployeeId === req.user.employeeId.toString()) {
      return next();
    }

    return res.status(403).json({
      error: 'Access denied',
      message: 'You can only access your own resources or must have elevated privileges'
    });
  };
};
