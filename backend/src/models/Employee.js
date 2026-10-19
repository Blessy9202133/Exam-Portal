const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema(
  {
    employeeId: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    department: {
      type: String,
      required: true,
      trim: true,
      enum: [
        'ENGINEERING',
        'I&C',
        'IV&V',
        'PERFORMANCE ANALYSIS',
        'PRODUCTION',
        'PRODUCTION QC',
        'PROJECT ENGG',
        'PROJECT QC',
        'QC',
        'SERVICE',
      ],
    },
    level: {
      type: String,
      required: true,
      enum: ['L1', 'L2', 'L3'],
    },
    role: {
      type: String,
      enum: ['EMPLOYEE', 'ADMIN'],
      default: 'EMPLOYEE',
    },
    designation: {
      type: String,
      trim: true,
    },
    mobilePhone: {
      type: String,
      trim: true,
    },
    examAccess: {
      isLinkActive: {
        type: Boolean,
        default: false,
      },
      accessCode: {
        type: String,
        default: null,
      },
      attemptsAllowed: {
        type: Number,
        default: 0,
      },
      attemptsUsed: {
        type: Number,
        default: 0,
      },
      status: {
        type: String,
        enum: ['NOT_ASSIGNED', 'LINK_ACTIVE', 'IN_PROGRESS', 'COMPLETED', 'LOCKED'],
        default: 'NOT_ASSIGNED',
      },
      linkGeneratedAt: {
        type: Date,
        default: null,
      },
      lastAttemptAt: {
        type: Date,
        default: null,
      },
      adminRemark: {
        type: String,
        default: '',
      },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Employee', employeeSchema);
