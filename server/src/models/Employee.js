import mongoose from 'mongoose';
import { ROLES } from '../config/constants.js';

const riskScoreHistorySchema = new mongoose.Schema({
  score: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  timestamp: {
    type: Date,
    required: true,
    default: Date.now
  },
  reason: {
    type: String,
    default: ''
  }
}, { _id: false });

const employeeSchema = new mongoose.Schema({
  employeeId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  role: {
    type: String,
    enum: Object.values(ROLES),
    required: true,
    index: true
  },
  branch: {
    type: String,
    required: true
  },
  department: {
    type: String,
    required: true
  },
  position: {
    type: String,
    required: true
  },
  joinDate: {
    type: Date,
    required: true
  },
  currentRiskScore: {
    type: Number,
    required: true,
    default: 0,
    min: 0,
    max: 100,
    index: true
  },
  riskScoreHistory: [riskScoreHistorySchema],
  supervisor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    default: null
  }
}, {
  timestamps: true
});

// Index for finding high-risk employees
employeeSchema.index({ currentRiskScore: -1 });

// Index for finding employees by role
employeeSchema.index({ role: 1 });

const Employee = mongoose.model('Employee', employeeSchema);

export default Employee;
