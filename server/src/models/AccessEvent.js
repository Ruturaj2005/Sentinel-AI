import mongoose from 'mongoose';
import { SYSTEMS, ACTIONS, RESOURCE_TYPES } from '../config/constants.js';

const accessEventSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true,
    index: true
  },
  timestamp: {
    type: Date,
    required: true,
    index: true
  },
  system: {
    type: String,
    enum: Object.values(SYSTEMS),
    required: true
  },
  action: {
    type: String,
    enum: Object.values(ACTIONS),
    required: true
  },
  resourceType: {
    type: String,
    enum: Object.values(RESOURCE_TYPES),
    required: true
  },
  resourceId: {
    type: String,
    required: true
  },
  volumeAccessed: {
    type: Number,
    required: true,
    default: 1
  },
  location: {
    type: String,
    required: true
  },
  ipAddress: {
    type: String,
    required: true
  },
  deviceId: {
    type: String,
    required: true
  },
  anomalyScore: {
    type: Number,
    required: true,
    default: 0,
    min: 0,
    max: 100
  },
  anomalyReasons: [{
    type: String
  }]
}, {
  timestamps: true
});

// Compound index for querying events by employee and time
accessEventSchema.index({ employeeId: 1, timestamp: -1 });

// Index for finding recent events
accessEventSchema.index({ timestamp: -1 });

// Index for finding high anomaly events
accessEventSchema.index({ anomalyScore: -1 });

// Index for system-based queries
accessEventSchema.index({ system: 1 });

const AccessEvent = mongoose.model('AccessEvent', accessEventSchema);

export default AccessEvent;
