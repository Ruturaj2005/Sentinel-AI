import express from 'express';
import {
  getTickets,
  getTicketById,
  createTicket,
  approveTicket,
  rejectTicket,
  updateTicket
} from '../controllers/ticketController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticate, getTickets);
router.post('/', authenticate, createTicket);
router.get('/:id', authenticate, getTicketById);
router.put('/:id', authenticate, updateTicket);
router.post('/:id/approve', authenticate, approveTicket);
router.post('/:id/reject', authenticate, rejectTicket);

export default router;
