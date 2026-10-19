const mongoose = require('mongoose');

const attemptAnswerSchema = new mongoose.Schema({
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question',
    required: true,
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
  questionText: String,
  difficulty: String,
  options: [String],
  selectedOptionIndex: Number,
  selectedOptionIndices: [Number],
  selectedTextAnswer: String,
  correctOptionIndex: Number,
  correctOptions: [Number],
  correctTextAnswer: String,
  explanation: String,
  isCorrect: Boolean,
});

const examAttemptSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
    },
    employeeId: String,
    employeeName: String,
    department: String,
    level: String,
    totalQuestions: {
      type: Number,
      default: 25,
    },
    score: {
      type: Number,
      required: true,
    },
    percentage: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['PASSED', 'FAILED'],
      required: true,
    },
    breakdown: {
      easyTotal: Number,
      easyCorrect: Number,
      moderateTotal: Number,
      moderateCorrect: Number,
      toughTotal: Number,
      toughCorrect: Number,
    },
    answers: [attemptAnswerSchema],
    completedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ExamAttempt', examAttemptSchema);
