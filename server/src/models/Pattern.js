import mongoose from 'mongoose';
import { PATTERN_TYPES, PATTERN_STATUS, ALERT_SEVERITY } from '../config/constants.js';

const evidenceSchema = new mongoose.Schema({
  accessEventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AccessEvent',
    required: true
  },
  reason: {
    type: String,
    required: true
  }
}, { _id: false });

const flagsSchema = new mongoose.Schema({
  multipleFailedLogins: {
    type: Boolean,
    default: false
  },
  unusualTimeAccess: {
    type: Boolean,
    default: false
  },
  crossDepartmentAccess: {
    type: Boolean,
    default: false
  },
  bulkDownloads: {
    type: Boolean,
    default: false
  },
  sensitiveDataAccess: {
    type: Boolean,
    default: false
  },
  rapidSystemSwitching: {
    type: Boolean,
    default: false
  }
}, { _id: false });

const patternSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true,
    index: true
  },
  patternType: {
    type: String,
    enum: Object.values(PATTERN_TYPES),
    required: true
  },
  flags: {
    type: flagsSchema,
    required: true
  },
  detectedAt: {
    type: Date,
    required: true,
    default: Date.now
  },
  evidence: [evidenceSchema],
  severity: {
    type: String,
    enum: Object.values(ALERT_SEVERITY),
    required: true,
    default: ALERT_SEVERITY.LOW
  },
  status: {
    type: String,
    enum: Object.values(PATTERN_STATUS),
    required: true,
    default: PATTERN_STATUS.ACTIVE
  }
}, {
  timestamps: true
});

// Index for finding patterns by employee
patternSchema.index({ employeeId: 1 });

// Index for finding patterns by type and status
patternSchema.index({ patternType: 1, status: 1 });

// Index for finding patterns by severity
patternSchema.index({ severity: 1 });

const Pattern = mongoose.model('Pattern', patternSchema);

export default Pattern;
