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
const { verifyToken, requireRole, requireAnyRole } = require('../middleware/auth');

// Configure multer memory storage for file uploads
const upload = multer({ storage: multer.memoryStorage() });

router.use(verifyToken);
router.use(requireAnyRole('ADMIN', 'SUPER_ADMIN', 'HOD'));

router.get('/stats', getStats);
router.get('/attempts', getAllAttempts);

// Template Download & Data Export Routes for Department Managers
router.get('/template/excel', getExcelTemplate);
router.get('/template/word', getWordTemplate);
router.get('/export-questions', exportQuestionsData);

// Template Upload / Re-upload Route (.xlsx or .docx)
router.post('/upload-template', upload.single('file'), uploadQuestionsFile);
router.post('/upload-word', upload.single('file'), uploadQuestionsFile);

// Employee Profile & User Management Routes (Restricted strictly to Master ADMIN)
router.get('/employees', requireRole('ADMIN'), getEmployees);
router.post('/employees', requireRole('ADMIN'), createEmployee);
router.put('/employees/:id', requireRole('ADMIN'), updateEmployee);
router.delete('/employees/:id', requireRole('ADMIN'), deleteEmployee);
router.get('/employees/template', requireRole('ADMIN'), getEmployeeExcelTemplate);
router.post('/employees/bulk-upload', requireRole('ADMIN'), upload.single('file'), uploadEmployeeExcel);

// Exam Link & Attempt Access Control Routes
router.get('/exam-access', getExamAccessList);
router.post('/exam-access/enable', enableExamLinks);
router.post('/exam-access/grant-reattempt', grantReattempt);
router.post('/exam-access/revoke', revokeExamLink);

module.exports = router;
