const Question = require('../models/Question');
const ExamAttempt = require('../models/ExamAttempt');
const Employee = require('../models/Employee');

// Helper function to shuffle an array (Fisher-Yates)
const shuffleArray = (array) => {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

// Generate 25 questions dynamically based on Department and Level
const startExam = async (req, res) => {
  try {
    const employeeId = req.user.id;
    const employee = await Employee.findById(employeeId);

    if (!employee) {
      return res.status(404).json({ message: 'Employee profile not found' });
    }

    const { department, level } = employee;

    // Strict Admin Access Control & Single Attempt Policy for Employees
    if (employee.role !== 'ADMIN') {
      const examAccess = employee.examAccess || {
        isLinkActive: false,
        attemptsAllowed: 0,
        attemptsUsed: 0,
        status: 'NOT_ASSIGNED',
      };

      if (!examAccess.isLinkActive || (examAccess.attemptsUsed >= examAccess.attemptsAllowed)) {
        return res.status(403).json({
          message:
            'Exam access is locked or your exam link has not been activated by Admin. You are allowed 1 attempt per activation. If your exam was interrupted, failed to attempt, or faced any issue, please contact Admin to grant permission for another attempt.',
          locked: true,
          attemptsUsed: examAccess.attemptsUsed || 0,
          attemptsAllowed: examAccess.attemptsAllowed || 0,
          status: examAccess.status || 'LOCKED',
        });
      }

      // Consume one attempt immediately upon generating/starting the exam
      employee.examAccess.attemptsUsed = (employee.examAccess.attemptsUsed || 0) + 1;
      employee.examAccess.status = 'IN_PROGRESS';
      employee.examAccess.lastAttemptAt = new Date();
      // If user has consumed all allowed attempts, mark link inactive so extra attempts cannot be initiated
      if (employee.examAccess.attemptsUsed >= employee.examAccess.attemptsAllowed) {
        employee.examAccess.isLinkActive = false;
      }
      await employee.save();
    }

    // Define difficulty quota based on Level
    let quota = { easy: 10, moderate: 10, tough: 5 };
    if (level === 'L2') {
      quota = { easy: 5, moderate: 15, tough: 5 };
    } else if (level === 'L3') {
      quota = { easy: 5, moderate: 10, tough: 10 };
    }

    // Use MongoDB $sample aggregation for random question sampling
    const [easyQuestions, moderateQuestions, toughQuestions] = await Promise.all([
      Question.aggregate([
        { $match: { department, difficulty: 'EASY' } },
        { $sample: { size: quota.easy } },
      ]),
      Question.aggregate([
        { $match: { department, difficulty: 'MODERATE' } },
        { $sample: { size: quota.moderate } },
      ]),
      Question.aggregate([
        { $match: { department, difficulty: 'TOUGH' } },
        { $sample: { size: quota.tough } },
      ]),
    ]);

    // Combine all sampled questions
    let allQuestions = [...easyQuestions, ...moderateQuestions, ...toughQuestions];

    // Fallback 1: If department bank has fewer questions than quota, fill with any difficulty in department
    if (allQuestions.length < 25) {
      const existingIds = allQuestions.map((q) => q._id);
      const remainingNeeded = 25 - allQuestions.length;
      const fallbackQuestions = await Question.aggregate([
        { $match: { department, _id: { $nin: existingIds } } },
        { $sample: { size: remainingNeeded } },
      ]);
      allQuestions = [...allQuestions, ...fallbackQuestions];
    }

    // Fallback 2: If department still has fewer than 25 questions, fill with general/other department questions
    if (allQuestions.length < 25) {
      const existingIds = allQuestions.map((q) => q._id);
      const remainingNeeded = 25 - allQuestions.length;
      const globalFallbackQuestions = await Question.aggregate([
        { $match: { _id: { $nin: existingIds } } },
        { $sample: { size: remainingNeeded } },
      ]);
      allQuestions = [...allQuestions, ...globalFallbackQuestions];
    }

    // Jumble/Shuffle all 25 questions
    const shuffledQuestions = shuffleArray(allQuestions);

    // Prepare questions for frontend: Shuffle options & record mapping, strip correct answers
    const clientQuestions = shuffledQuestions.map((q, index) => {
      const qType = q.questionType || 'MCQ';
      let shuffledOptions = [];
      let optionMapping = [];

      if (qType !== 'FILL_BLANK' && q.options && q.options.length > 0) {
        const optionsWithIndices = q.options.map((optText, origIdx) => ({
          text: optText,
          origIdx: origIdx,
        }));
        const shuffled = shuffleArray(optionsWithIndices);
        shuffledOptions = shuffled.map((o) => o.text);
        optionMapping = shuffled.map((o) => o.origIdx);
      }

      return {
        questionId: q._id,
        sequence: index + 1,
        questionType: qType,
        imageUrl: q.imageUrl || '',
        questionText: q.questionText,
        difficulty: q.difficulty,
        department: q.department,
        options: shuffledOptions,
        optionMapping: optionMapping,
      };
    });

    res.json({
      department,
      level,
      totalQuestions: clientQuestions.length,
      quota,
      questions: clientQuestions,
    });
  } catch (error) {
    console.error('Error starting exam:', error);
    res.status(500).json({ message: 'Error generating exam questions' });
  }
};

// Submit Exam and Calculate Result
const submitExam = async (req, res) => {
  try {
    const employeeId = req.user.id;
    const employee = await Employee.findById(employeeId);
    const { answers } = req.body; // Array of { questionId, selectedOptionIndex, selectedOptionIndices, selectedTextAnswer, optionMapping }

    if (!answers || !Array.isArray(answers)) {
      return res.status(400).json({ message: 'Invalid submission data' });
    }

    const questionIds = answers.map((a) => a.questionId);
    const dbQuestions = await Question.find({ _id: { $in: questionIds } });
    const questionMap = new Map(dbQuestions.map((q) => [q._id.toString(), q]));

    let totalScore = 0;
    let easyTotal = 0, easyCorrect = 0;
    let moderateTotal = 0, moderateCorrect = 0;
    let toughTotal = 0, toughCorrect = 0;

    const detailedAnswers = answers.map((userAns) => {
      const dbQ = questionMap.get(userAns.questionId);
      if (!dbQ) return null;

      const qType = dbQ.questionType || 'MCQ';

      // Track difficulty counts
      if (dbQ.difficulty === 'EASY') easyTotal++;
      else if (dbQ.difficulty === 'MODERATE') moderateTotal++;
      else if (dbQ.difficulty === 'TOUGH') toughTotal++;

      let isCorrect = false;
      let originalSelectedIdx = null;
      let originalSelectedIndices = [];
      let userTextAns = '';

      if (qType === 'FILL_BLANK') {
        userTextAns = (userAns.selectedTextAnswer || '').trim();
        const targetText = (dbQ.correctTextAnswer || '').trim();
        if (userTextAns && targetText && userTextAns.toLowerCase() === targetText.toLowerCase()) {
          isCorrect = true;
        }
      } else if (qType === 'MULTIPLE') {
        if (Array.isArray(userAns.selectedOptionIndices) && userAns.optionMapping) {
          originalSelectedIndices = userAns.selectedOptionIndices
            .map((idx) => userAns.optionMapping[idx])
            .filter((val) => val !== undefined && val !== null)
            .sort((a, b) => a - b);
        } else if (userAns.selectedOptionIndex !== null && userAns.selectedOptionIndex !== undefined && userAns.optionMapping) {
          originalSelectedIndices = [userAns.optionMapping[userAns.selectedOptionIndex]];
        }

        const targetOptions = (dbQ.correctOptions && dbQ.correctOptions.length > 0)
          ? [...dbQ.correctOptions].sort((a, b) => a - b)
          : [dbQ.correctOptionIndex || 0];

        if (
          originalSelectedIndices.length === targetOptions.length &&
          originalSelectedIndices.every((val, i) => val === targetOptions[i])
        ) {
          isCorrect = true;
        }
      } else {
        // Standard MCQ
        if (
          userAns.selectedOptionIndex !== null &&
          userAns.selectedOptionIndex !== undefined &&
          userAns.optionMapping
        ) {
          originalSelectedIdx = userAns.optionMapping[userAns.selectedOptionIndex];
        }
        if (originalSelectedIdx === dbQ.correctOptionIndex) {
          isCorrect = true;
        }
      }

      if (isCorrect) {
        totalScore += (dbQ.marks || 1);
        if (dbQ.difficulty === 'EASY') easyCorrect++;
        else if (dbQ.difficulty === 'MODERATE') moderateCorrect++;
        else if (dbQ.difficulty === 'TOUGH') toughCorrect++;
      }

      return {
        questionId: dbQ._id,
        questionType: qType,
        imageUrl: dbQ.imageUrl || '',
        questionText: dbQ.questionText,
        difficulty: dbQ.difficulty,
        options: dbQ.options,
        selectedOptionIndex: originalSelectedIdx,
        selectedOptionIndices: originalSelectedIndices,
        selectedTextAnswer: userTextAns,
        correctOptionIndex: dbQ.correctOptionIndex,
        correctOptions: dbQ.correctOptions || [dbQ.correctOptionIndex || 0],
        correctTextAnswer: dbQ.correctTextAnswer || '',
        explanation: dbQ.explanation || '',
        isCorrect,
      };
    }).filter(Boolean);

    const totalQuestions = detailedAnswers.length;
    const percentage = totalQuestions > 0 ? (totalScore / totalQuestions) * 100 : 0;
    const status = percentage >= 60 ? 'PASSED' : 'FAILED';

    const examAttempt = new ExamAttempt({
      employee: employee._id,
      employeeId: employee.employeeId,
      employeeName: employee.name,
      department: employee.department,
      level: employee.level,
      totalQuestions,
      score: totalScore,
      percentage: Math.round(percentage * 100) / 100,
      status,
      breakdown: {
        easyTotal,
        easyCorrect,
        moderateTotal,
        moderateCorrect,
        toughTotal,
        toughCorrect,
      },
      answers: detailedAnswers,
    });

    await examAttempt.save();

    // Mark employee exam status as COMPLETED
    if (employee && employee.examAccess) {
      employee.examAccess.status = 'COMPLETED';
      await employee.save();
    }

    res.json({
      attemptId: examAttempt._id,
      score: totalScore,
      totalQuestions,
      percentage: examAttempt.percentage,
      status,
      breakdown: examAttempt.breakdown,
      completedAt: examAttempt.completedAt,
    });
  } catch (error) {
    console.error('Error submitting exam:', error);
    res.status(500).json({ message: 'Error submitting exam' });
  }
};

// Get Employee Exam History
const getMyAttempts = async (req, res) => {
  try {
    const attempts = await ExamAttempt.find({ employee: req.user.id })
      .select('-answers')
      .sort({ completedAt: -1 });
    res.json(attempts);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching attempts' });
  }
};

// Get Specific Attempt Details
const getAttemptDetails = async (req, res) => {
  try {
    const attempt = await ExamAttempt.findById(req.params.id);
    if (!attempt) {
      return res.status(404).json({ message: 'Attempt not found' });
    }
    // Security check: must belong to employee or admin
    if (attempt.employee.toString() !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Access denied' });
    }
    res.json(attempt);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching attempt details' });
  }
};

module.exports = { startExam, submitExam, getMyAttempts, getAttemptDetails };
