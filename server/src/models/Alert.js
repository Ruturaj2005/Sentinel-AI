import mongoose from 'mongoose';
import { ALERT_SEVERITY, ALERT_STATUS } from '../config/constants.js';

const TRIGGER_TYPES = {
  RISK_SPIKE: 'risk_spike',
  PATTERN_DETECTED: 'pattern_detected',
  THRESHOLD_BREACH: 'threshold_breach',
  TICKET_FAILURE: 'ticket_failure'
};

const metadataSchema = new mongoose.Schema({
  riskScore: {
    type: Number,
    default: 0
  },
  patternIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pattern'
  }],
  accessEventIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AccessEvent'
  }],
  ticketIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ticket'
  }]
}, { _id: false });

const alertSchema = new mongoose.Schema({
  alertId: {
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
  severity: {
    type: String,
    enum: Object.values(ALERT_SEVERITY),
    required: true,
    index: true
  },
  triggerReason: {
    type: String,
    required: true
  },
  triggerType: {
    type: String,
    enum: Object.values(TRIGGER_TYPES),
    required: true
  },
  metadata: {
    type: metadataSchema,
    default: () => ({})
  },
  status: {
    type: String,
    enum: Object.values(ALERT_STATUS),
    required: true,
    default: ALERT_STATUS.ACTIVE,
    index: true
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    default: null
  },
  notes: {
    type: String,
    default: ''
  },
  resolvedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Compound index for employee alerts by time
alertSchema.index({ employeeId: 1, createdAt: -1 });

// Index for finding alerts by severity and status
alertSchema.index({ severity: 1, status: 1 });

// Index for sorting by creation date
alertSchema.index({ createdAt: -1 });

const Alert = mongoose.model('Alert', alertSchema);

export default Alert;
