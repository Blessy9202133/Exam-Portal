const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema(
  {
    department: {
      type: String,
      required: true,
      trim: true,
      index: true,
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
    difficulty: {
      type: String,
      required: true,
      enum: ['EASY', 'MODERATE', 'TOUGH'],
      index: true,
    },
    questionType: {
      type: String,
      enum: ['MCQ', 'MULTIPLE', 'FILL_BLANK'],
      default: 'MCQ',
    },
    imageUrl: {
      type: String,
      default: '',
    },
    questionText: {
      type: String,
      required: true,
    },
    options: {
      type: [String],
      default: [],
    },
    correctOptionIndex: {
      type: Number,
      default: 0,
    },
    correctOptions: {
      type: [Number],
      default: [],
    },
    correctTextAnswer: {
      type: String,
      default: '',
      trim: true,
    },
    marks: {
      type: Number,
      default: 1,
      min: 1,
    },
    explanation: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Question', questionSchema);
