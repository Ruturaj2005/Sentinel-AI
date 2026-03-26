import express from 'express';
import {
  getAccessEvents,
  getAccessEventById,
  getAccessEventsByEmployee,
  getAccessEventStatsByEmployee
} from '../controllers/accessEventController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticate, getAccessEvents);
router.get('/employee/:id', authenticate, getAccessEventsByEmployee);
router.get('/employee/:id/stats', authenticate, getAccessEventStatsByEmployee);
router.get('/:id', authenticate, getAccessEventById);

export default router;
