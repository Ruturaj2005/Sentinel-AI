import express from 'express';
import { switchRole, getCurrentUser } from '../controllers/authController.js';
import { optionalAuth, authenticate } from '../middleware/auth.js';

const router = express.Router();

router.post('/switch-role', switchRole);
router.get('/current-user', authenticate, getCurrentUser);

export default router;
