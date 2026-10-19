const express = require('express');
const router = express.Router();
const { startExam, submitExam, getMyAttempts, getAttemptDetails } = require('../controllers/examController');
const { verifyToken } = require('../middleware/auth');

router.use(verifyToken);

router.get('/start', startExam);
router.post('/submit', submitExam);
router.get('/my-attempts', getMyAttempts);
router.get('/attempts/:id', getAttemptDetails);

module.exports = router;
