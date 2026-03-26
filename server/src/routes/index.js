import express from 'express';
import authRoutes from './authRoutes.js';
import employeeRoutes from './employeeRoutes.js';
import alertRoutes from './alertRoutes.js';
import ticketRoutes from './ticketRoutes.js';
import accessEventRoutes from './accessEventRoutes.js';
import patternRoutes from './patternRoutes.js';
import dashboardRoutes from './dashboardRoutes.js';
import toolsRoutes from './tools.js';

const router = express.Router();

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Sentinel API is running' });
});

// API routes
router.use('/auth', authRoutes);
router.use('/employees', employeeRoutes);
router.use('/alerts', alertRoutes);
router.use('/tickets', ticketRoutes);
router.use('/access-events', accessEventRoutes);
router.use('/patterns', patternRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/tools', toolsRoutes);

export default router;
