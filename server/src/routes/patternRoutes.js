import express from 'express';
import {
  getPatterns,
  getPatternById,
  getPatternsByEmployee,
  getReconnaissancePatterns,
  updatePatternStatus
} from '../controllers/patternController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticate, getPatterns);
router.get('/reconnaissance', authenticate, getReconnaissancePatterns);
router.get('/employee/:id', authenticate, getPatternsByEmployee);
router.get('/:id', authenticate, getPatternById);
router.put('/:id/status', authenticate, updatePatternStatus);

export default router;
