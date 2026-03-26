import express from 'express';
import {
  getEmployees,
  getEmployeeById,
  getEmployeeRiskHistory,
  getHighRiskEmployees
} from '../controllers/employeeController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticate, getEmployees);
router.get('/high-risk', authenticate, getHighRiskEmployees);
router.get('/:id', authenticate, getEmployeeById);
router.get('/:id/risk-history', authenticate, getEmployeeRiskHistory);

export default router;
