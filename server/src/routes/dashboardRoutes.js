import express from 'express';
import {
  getEmployeeDashboard,
  getManagerDashboard,
  getInvestigatorDashboard
} from '../controllers/dashboardController.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/roleCheck.js';
import { ROLES } from '../config/constants.js';

const router = express.Router();

router.get('/employee', authenticate, authorize(ROLES.EMPLOYEE, ROLES.MANAGER, ROLES.INVESTIGATOR), getEmployeeDashboard);
router.get('/manager', authenticate, authorize(ROLES.MANAGER, ROLES.INVESTIGATOR), getManagerDashboard);
router.get('/investigator', authenticate, authorize(ROLES.INVESTIGATOR), getInvestigatorDashboard);

export default router;
