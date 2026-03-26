import express from 'express';
import {
  getAlerts,
  getAlertById,
  updateAlertStatus,
  getAlertStatistics,
  getAlertsByEmployee
} from '../controllers/alertController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticate, getAlerts);
router.get('/statistics', authenticate, getAlertStatistics);
router.get('/employee/:id', authenticate, getAlertsByEmployee);
router.get('/:id', authenticate, getAlertById);
router.put('/:id/status', authenticate, updateAlertStatus);

export default router;
