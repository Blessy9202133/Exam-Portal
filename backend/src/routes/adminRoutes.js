const express = require('express');
const router = express.Router();
const multer = require('multer');
const {
  getAllAttempts,
  getStats,
  getExcelTemplate,
  getWordTemplate,
  exportQuestionsData,
  uploadQuestionsFile,
  getEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  getEmployeeExcelTemplate,
  uploadEmployeeExcel,
  getExamAccessList,
  enableExamLinks,
  grantReattempt,
  revokeExamLink,
} = require('../controllers/adminController');
const { verifyToken, requireRole } = require('../middleware/auth');

// Configure multer memory storage for file uploads
const upload = multer({ storage: multer.memoryStorage() });

router.use(verifyToken);
router.use(requireRole('ADMIN'));

router.get('/stats', getStats);
router.get('/attempts', getAllAttempts);

// Template Download & Data Export Routes for Department Managers
router.get('/template/excel', getExcelTemplate);
router.get('/template/word', getWordTemplate);
router.get('/export-questions', exportQuestionsData);

// Template Upload / Re-upload Route (.xlsx or .docx)
router.post('/upload-template', upload.single('file'), uploadQuestionsFile);
router.post('/upload-word', upload.single('file'), uploadQuestionsFile);

// Employee Profile & User Management Routes
router.get('/employees', getEmployees);
router.post('/employees', createEmployee);
router.put('/employees/:id', updateEmployee);
router.delete('/employees/:id', deleteEmployee);
router.get('/employees/template', getEmployeeExcelTemplate);
router.post('/employees/bulk-upload', upload.single('file'), uploadEmployeeExcel);

// Exam Link & Attempt Access Control Routes
router.get('/exam-access', getExamAccessList);
router.post('/exam-access/enable', enableExamLinks);
router.post('/exam-access/grant-reattempt', grantReattempt);
router.post('/exam-access/revoke', revokeExamLink);

module.exports = router;
