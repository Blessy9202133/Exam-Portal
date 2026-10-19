const Employee = require('../models/Employee');
const Question = require('../models/Question');
const ExamAttempt = require('../models/ExamAttempt');
const { parseWordDocument } = require('../utils/wordParser');
const { parseExcelDocument, parseEmployeeExcelDocument } = require('../utils/excelParser');
const {
  generateExcelTemplate,
  generateWordTemplate,
  exportExistingQuestionsExcel,
  generateEmployeeExcelTemplate,
} = require('../utils/templateGenerator');
const bcrypt = require('bcryptjs');

// Get all exam attempts across employees
const getAllAttempts = async (req, res) => {
  try {
    const attempts = await ExamAttempt.find()
      .select('-answers')
      .sort({ completedAt: -1 });
    res.json(attempts);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching attempts' });
  }
};

// Get stats summary for Admin Dashboard
const getStats = async (req, res) => {
  try {
    const OFFICIAL_DEPARTMENTS = [
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
    ];

    const empDepts = await Employee.distinct('department');
    const qDepts = await Question.distinct('department');
    const combined = [...new Set([...OFFICIAL_DEPARTMENTS, ...empDepts, ...qDepts])];
    const departments = combined.filter(d => OFFICIAL_DEPARTMENTS.includes(d)).sort();

    const [totalEmployees, totalQuestions, totalAttempts] = await Promise.all([
      Employee.countDocuments({ role: 'EMPLOYEE' }),
      Question.countDocuments(),
      ExamAttempt.countDocuments(),
    ]);

    // Aggregate uploaded question statistics per department
    const deptStats = await Promise.all(
      departments.map(async (dept) => {
        const questionCount = await Question.countDocuments({ department: dept });
        const employeeCount = await Employee.countDocuments({ department: dept, role: 'EMPLOYEE' });
        const lastQ = await Question.findOne({ department: dept }).sort({ createdAt: -1 });
        return {
          department: dept,
          questionCount,
          employeeCount,
          lastUploadedAt: lastQ ? lastQ.createdAt : null,
          status: questionCount > 0 ? 'ACTIVE' : 'NO_QUESTIONS',
        };
      })
    );

    const recentAttempts = await ExamAttempt.find()
      .select('employeeName department level score percentage status completedAt')
      .sort({ completedAt: -1 })
      .limit(10);

    res.json({
      totalEmployees,
      totalQuestions,
      totalAttempts,
      deptStats,
      recentAttempts,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching stats' });
  }
};

// Download Department-specific Excel Template for Managers
const getExcelTemplate = async (req, res) => {
  try {
    const department = req.query.department || 'I&C';
    const buffer = await generateExcelTemplate(department);
    const safeDept = department.replace(/[^a-zA-Z0-9]/g, '_');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${safeDept}_Question_Template.xlsx"`);
    res.send(buffer);
  } catch (error) {
    console.error('Error generating Excel template:', error);
    res.status(500).json({ message: 'Failed to generate Excel template' });
  }
};

// Download Department-specific Word Template for Managers
const getWordTemplate = async (req, res) => {
  try {
    const department = req.query.department || 'I&C';
    const buffer = await generateWordTemplate(department);
    const safeDept = department.replace(/[^a-zA-Z0-9]/g, '_');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="${safeDept}_Question_Template.docx"`);
    res.send(buffer);
  } catch (error) {
    console.error('Error generating Word template:', error);
    res.status(500).json({ message: 'Failed to generate Word template' });
  }
};

// Bulk Upload/Re-upload Questions for a Department
const uploadQuestionsFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No template file (.docx or .xlsx) provided' });
    }

    const targetDepartment = req.body.department || 'I&C';
    const mode = req.body.mode || 'REPLACE';
    const fileName = req.file.originalname.toLowerCase();
    let parsedQuestions = [];

    if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
      parsedQuestions = await parseExcelDocument(req.file.buffer, targetDepartment);
    } else if (fileName.endsWith('.docx')) {
      parsedQuestions = await parseWordDocument(req.file.buffer, targetDepartment);
    } else {
      return res.status(400).json({ message: 'Unsupported file type. Please upload a Word (.docx) or Excel (.xlsx) file.' });
    }

    if (parsedQuestions.length === 0) {
      return res.status(400).json({
        message: 'No valid questions could be parsed from the file. Please check the template format.',
      });
    }

    parsedQuestions.forEach(q => q.department = targetDepartment);

    if (mode === 'REPLACE') {
      await Question.deleteMany({ department: targetDepartment });
    }

    const inserted = await Question.insertMany(parsedQuestions);

    res.json({
      message: `Successfully uploaded ${inserted.length} questions for ${targetDepartment} department!`,
      importedCount: inserted.length,
      department: targetDepartment,
    });
  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({ message: 'Failed to process template file', error: error.message });
  }
};

// Get all employees
const getEmployees = async (req, res) => {
  try {
    const employees = await Employee.find().select('-password').sort({ createdAt: -1 });
    res.json(employees);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching employees' });
  }
};

// Create / Register New Employee User
const createEmployee = async (req, res) => {
  try {
    const { employeeId, name, email, password, department, level, role } = req.body;

    if (!employeeId || !name || !email || !department || !level) {
      return res.status(400).json({ message: 'Employee ID, Name, Email, Department, and Level are required.' });
    }

    const existingEmp = await Employee.findOne({
      $or: [{ employeeId: employeeId.toUpperCase() }, { email: email.toLowerCase() }]
    });

    if (existingEmp) {
      return res.status(400).json({ message: 'An employee with this ID or Email already exists.' });
    }

    const empPassword = (password && password.trim().length > 0) ? password.trim() : employeeId.trim().toUpperCase();
    const hashedPassword = await bcrypt.hash(empPassword, 10);

    const newEmp = new Employee({
      employeeId: employeeId.toUpperCase(),
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      department,
      level,
      role: role || 'EMPLOYEE',
    });

    await newEmp.save();

    res.status(201).json({
      message: `Employee ${name} (${employeeId.toUpperCase()}) registered successfully!`,
      employee: {
        id: newEmp._id,
        employeeId: newEmp.employeeId,
        name: newEmp.name,
        email: newEmp.email,
        department: newEmp.department,
        level: newEmp.level,
        role: newEmp.role,
      }
    });
  } catch (error) {
    console.error('Error creating employee:', error);
    res.status(500).json({ message: 'Failed to create employee user' });
  }
};

// Delete Employee User
const deleteEmployee = async (req, res) => {
  try {
    const empId = req.params.id;
    const emp = await Employee.findById(empId);

    if (!emp) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    if (emp.role === 'ADMIN' && (emp.employeeId === '123456' || emp.employeeId === 'ADMIN101')) {
      return res.status(400).json({ message: 'Primary System Administrator account cannot be deleted.' });
    }

    await Employee.findByIdAndDelete(empId);
    res.json({ message: `Employee ${emp.name} deleted successfully.` });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete employee' });
  }
};

// Update / Edit Employee User Profile
const updateEmployee = async (req, res) => {
  try {
    const empId = req.params.id;
    const { name, email, department, level, designation, mobilePhone, role, password } = req.body;

    const emp = await Employee.findById(empId);
    if (!emp) {
      return res.status(404).json({ message: 'Employee not found.' });
    }

    // Check email uniqueness if changed
    if (email && email.toLowerCase() !== emp.email.toLowerCase()) {
      const emailExists = await Employee.findOne({
        email: email.toLowerCase(),
        _id: { $ne: empId },
      });
      if (emailExists) {
        return res.status(400).json({ message: 'This email is already in use by another user.' });
      }
      emp.email = email.toLowerCase().trim();
    }

    if (name) emp.name = name.trim();
    if (department) emp.department = department.trim();
    if (level) emp.level = level;
    if (designation !== undefined) emp.designation = designation ? designation.trim() : '';
    if (mobilePhone !== undefined) emp.mobilePhone = mobilePhone ? mobilePhone.trim() : '';

    // Guard Primary Admin 123456 from being demoted from ADMIN
    if (emp.employeeId === '123456' && role && role !== 'ADMIN') {
      return res.status(400).json({ message: 'Cannot demote Primary System Administrator from ADMIN role.' });
    }
    if (role) emp.role = role;

    // Optional password reset
    if (password && password.trim().length > 0) {
      emp.password = await bcrypt.hash(password.trim(), 10);
    }

    await emp.save();

    res.json({
      message: `Employee ${emp.name} (${emp.employeeId}) profile updated successfully!`,
      employee: {
        id: emp._id,
        _id: emp._id,
        employeeId: emp.employeeId,
        name: emp.name,
        email: emp.email,
        department: emp.department,
        level: emp.level,
        role: emp.role,
        designation: emp.designation,
        mobilePhone: emp.mobilePhone,
      },
    });
  } catch (error) {
    console.error('Error updating employee:', error);
    res.status(500).json({ message: 'Failed to update employee profile', error: error.message });
  }
};

// Export Existing Active Database Questions for a Department
const exportQuestionsData = async (req, res) => {
  try {
    const department = req.query.department || 'I&C';
    const buffer = await exportExistingQuestionsExcel(department);
    const safeDept = department.replace(/[^a-zA-Z0-9]/g, '_');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${safeDept}_Active_Questions.xlsx"`);
    res.send(buffer);
  } catch (error) {
    console.error('Error exporting question data:', error);
    res.status(500).json({ message: 'Failed to export questions data' });
  }
};

// Download Blank Excel Template for Bulk Employee Account Creation
const getEmployeeExcelTemplate = async (req, res) => {
  try {
    const buffer = await generateEmployeeExcelTemplate();
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="Employee_Import_Template.xlsx"');
    res.send(buffer);
  } catch (error) {
    console.error('Error generating Employee Excel template:', error);
    res.status(500).json({ message: 'Failed to generate Employee template' });
  }
};

// Bulk Upload Employee Accounts from Excel (.xlsx)
const uploadEmployeeExcel = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No Excel file provided' });
    }

    const parsedEmployees = await parseEmployeeExcelDocument(req.file.buffer);

    if (parsedEmployees.length === 0) {
      return res.status(400).json({ message: 'No valid employee rows could be parsed from the file. Please check column headers.' });
    }

    let createdCount = 0;
    let updatedCount = 0;

    for (const empData of parsedEmployees) {
      const existing = await Employee.findOne({ employeeId: empData.employeeId });
      if (existing) {
        existing.name = empData.name || existing.name;
        existing.email = empData.email || existing.email;
        existing.department = empData.department || existing.department;
        existing.level = empData.level || existing.level;
        if (empData.designation) existing.designation = empData.designation;
        if (empData.mobilePhone) existing.mobilePhone = empData.mobilePhone;
        await existing.save();
        updatedCount++;
      } else {
        const passwordHash = await bcrypt.hash(empData.employeeId, 10);
        const newEmp = new Employee({
          ...empData,
          password: passwordHash,
        });
        await newEmp.save();
        createdCount++;
      }
    }

    res.json({
      message: `Successfully processed ${parsedEmployees.length} employee records (${createdCount} new registered, ${updatedCount} updated)! Initial password set to each employee's Employee ID.`,
      createdCount,
      updatedCount,
      totalCount: parsedEmployees.length,
    });
  } catch (error) {
    console.error('Error importing employee Excel:', error);
    res.status(500).json({ message: 'Failed to import employee Excel file', error: error.message });
  }
};

// Get Exam Access Directory for Admin
const getExamAccessList = async (req, res) => {
  try {
    const { department, status, search } = req.query;
    let query = { role: 'EMPLOYEE' };

    if (department && department.trim()) {
      query.department = department.trim();
    }

    if (search && search.trim()) {
      const term = search.trim();
      query.$or = [
        { employeeId: { $regex: term, $options: 'i' } },
        { name: { $regex: term, $options: 'i' } },
        { email: { $regex: term, $options: 'i' } },
      ];
    }

    const employees = await Employee.find(query)
      .select('-password')
      .sort({ createdAt: -1 });

    const formatted = employees.map((emp) => {
      const access = emp.examAccess || {
        isLinkActive: false,
        accessCode: null,
        attemptsAllowed: 0,
        attemptsUsed: 0,
        status: 'NOT_ASSIGNED',
        linkGeneratedAt: null,
        lastAttemptAt: null,
        adminRemark: '',
      };

      let computedStatus = access.status || 'NOT_ASSIGNED';
      if (!access.isLinkActive) {
        if (access.attemptsUsed > 0 && access.attemptsUsed >= access.attemptsAllowed) {
          computedStatus = 'LOCKED';
        } else if (access.attemptsAllowed === 0) {
          computedStatus = 'NOT_ASSIGNED';
        } else {
          computedStatus = 'LOCKED';
        }
      } else {
        if (computedStatus === 'NOT_ASSIGNED' || computedStatus === 'LOCKED') {
          computedStatus = 'LINK_ACTIVE';
        }
      }

      return {
        _id: emp._id,
        employeeId: emp.employeeId,
        name: emp.name,
        email: emp.email,
        department: emp.department,
        level: emp.level,
        role: emp.role,
        designation: emp.designation,
        examAccess: {
          isLinkActive: !!access.isLinkActive,
          accessCode: access.accessCode || null,
          attemptsAllowed: access.attemptsAllowed || 0,
          attemptsUsed: access.attemptsUsed || 0,
          status: access.status || 'NOT_ASSIGNED',
          computedStatus,
          linkGeneratedAt: access.linkGeneratedAt || null,
          lastAttemptAt: access.lastAttemptAt || null,
          adminRemark: access.adminRemark || '',
        },
      };
    });

    let results = formatted;
    if (status && status !== 'ALL') {
      results = results.filter((r) => r.examAccess.computedStatus === status);
    }

    res.json(results);
  } catch (error) {
    console.error('Error fetching exam access list:', error);
    res.status(500).json({ message: 'Error fetching exam access roster' });
  }
};

const mongoose = require('mongoose');

// Helper to safely query employees by Mongo _id or Employee ID string
const buildEmployeeIdQuery = (ids) => {
  const rawIds = ids.map((id) => String(id).trim().toUpperCase());
  const validObjectIds = ids.filter((id) => mongoose.Types.ObjectId.isValid(id));
  const orConditions = [{ employeeId: { $in: rawIds } }];
  if (validObjectIds.length > 0) {
    orConditions.push({ _id: { $in: validObjectIds } });
  }
  return { $or: orConditions, role: 'EMPLOYEE' };
};

// Enable Exam Link & Grant 1 Attempt for Selected Employees
const enableExamLinks = async (req, res) => {
  try {
    const { employeeIds, remark } = req.body;
    if (!employeeIds || !Array.isArray(employeeIds) || employeeIds.length === 0) {
      return res.status(400).json({ message: 'Please select at least one employee.' });
    }

    const crypto = require('crypto');
    const employees = await Employee.find(buildEmployeeIdQuery(employeeIds));

    if (employees.length === 0) {
      return res.status(404).json({ message: 'No matching employee accounts found.' });
    }

    let updatedCount = 0;
    for (const emp of employees) {
      if (!emp.examAccess) {
        emp.examAccess = {};
      }
      emp.examAccess.isLinkActive = true;
      if (!emp.examAccess.attemptsAllowed || emp.examAccess.attemptsAllowed === 0) {
        emp.examAccess.attemptsAllowed = 1;
        emp.examAccess.attemptsUsed = 0;
      } else if (emp.examAccess.attemptsUsed >= emp.examAccess.attemptsAllowed) {
        emp.examAccess.attemptsAllowed = emp.examAccess.attemptsUsed + 1;
      }
      emp.examAccess.status = 'LINK_ACTIVE';
      emp.examAccess.linkGeneratedAt = new Date();
      emp.examAccess.accessCode = crypto.randomBytes(4).toString('hex').toUpperCase();
      emp.examAccess.adminRemark = remark || 'Exam link enabled by Admin (1 attempt)';
      await emp.save();
      updatedCount++;
    }

    res.json({
      message: `Exam link successfully enabled for ${updatedCount} employee(s)! Each employee can now log in and take 1 attempt.`,
      updatedCount,
    });
  } catch (error) {
    console.error('Error enabling exam links:', error);
    res.status(500).json({ message: 'Failed to enable exam links', error: error.message });
  }
};

// Grant Permission for One More Attempt (Re-attempt)
const grantReattempt = async (req, res) => {
  try {
    const { employeeId, employeeIds, remark } = req.body;
    const targetIds = employeeIds || (employeeId ? [employeeId] : []);

    if (targetIds.length === 0) {
      return res.status(400).json({ message: 'Please specify an employee to grant re-attempt permission.' });
    }

    const employees = await Employee.find(buildEmployeeIdQuery(targetIds));

    if (employees.length === 0) {
      return res.status(404).json({ message: 'No matching employee accounts found.' });
    }

    let updatedCount = 0;
    for (const emp of employees) {
      if (!emp.examAccess) {
        emp.examAccess = { attemptsUsed: 0 };
      }
      const currentUsed = emp.examAccess.attemptsUsed || 0;
      const currentAllowed = emp.examAccess.attemptsAllowed || 0;
      emp.examAccess.attemptsAllowed = Math.max(currentAllowed, currentUsed) + 1;
      emp.examAccess.isLinkActive = true;
      emp.examAccess.status = 'LINK_ACTIVE';
      emp.examAccess.adminRemark = remark || `Re-attempt permission granted by Admin on ${new Date().toLocaleDateString()}`;
      await emp.save();
      updatedCount++;
    }

    res.json({
      message: `Permission granted! ${updatedCount} employee(s) can now log in for 1 more exam attempt.`,
      updatedCount,
    });
  } catch (error) {
    console.error('Error granting re-attempt:', error);
    res.status(500).json({ message: 'Failed to grant re-attempt permission', error: error.message });
  }
};

// Revoke / Lock Exam Link
const revokeExamLink = async (req, res) => {
  try {
    const { employeeId, employeeIds } = req.body;
    const targetIds = employeeIds || (employeeId ? [employeeId] : []);

    if (targetIds.length === 0) {
      return res.status(400).json({ message: 'Please specify an employee to revoke access.' });
    }

    const employees = await Employee.find(buildEmployeeIdQuery(targetIds));

    let revokedCount = 0;
    for (const emp of employees) {
      if (!emp.examAccess) {
        emp.examAccess = {};
      }
      emp.examAccess.isLinkActive = false;
      emp.examAccess.status = 'LOCKED';
      emp.examAccess.adminRemark = 'Exam access revoked / locked by Admin';
      await emp.save();
      revokedCount++;
    }

    res.json({
      message: `Exam access revoked/locked for ${revokedCount} employee(s).`,
      revokedCount,
    });
  } catch (error) {
    console.error('Error revoking exam link:', error);
    res.status(500).json({ message: 'Failed to revoke exam link', error: error.message });
  }
};

module.exports = {
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
};
           