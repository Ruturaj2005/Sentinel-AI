import mongoose from 'mongoose';
import { TICKET_STATUS, TICKET_ROUTING } from '../config/constants.js';

const checkScoresSchema = new mongoose.Schema({
  relevanceScore: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  coherenceScore: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  specificityScore: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  timelinessScore: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  consistencyScore: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  }
}, { _id: false });

const ticketSchema = new mongoose.Schema({
  ticketId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true,
    index: true
  },
  accessEventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AccessEvent',
    required: true
  },
  text: {
    type: String,
    required: true
  },
  checkScores: {
    type: checkScoresSchema,
    required: true
  },
  overallScore: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  responseTime: {
    type: Number,
    required: true,
    comment: 'Response time in minutes'
  },
  routingDecision: {
    type: String,
    enum: Object.values(TICKET_ROUTING),
    required: true
  },
  status: {
    type: String,
    enum: Object.values(TICKET_STATUS),
    required: true,
    default: TICKET_STATUS.PENDING,
    index: true
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    default: null
  },
  reviewNotes: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Index for finding tickets by employee
ticketSchema.index({ employeeId: 1 });

// Index for finding pending tickets
ticketSchema.index({ status: 1 });

// Index for finding tickets by routing decision
ticketSchema.index({ routingDecision: 1 });

// Index for sorting by creation date
ticketSchema.index({ createdAt: -1 });

const Ticket = mongoose.model('Ticket', ticketSchema);

export default Ticket;
