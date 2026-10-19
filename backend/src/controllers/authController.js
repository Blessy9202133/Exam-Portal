const Employee = require('../models/Employee');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../middleware/auth');

const login = async (req, res) => {
  try {
    const { employeeId, password } = req.body;

    if (!employeeId || !password) {
      return res.status(400).json({ message: 'Employee ID and password are required' });
    }

    const employee = await Employee.findOne({ employeeId: employeeId.toUpperCase() });
    if (!employee) {
      return res.status(401).json({ message: 'Invalid Employee ID or password' });
    }

    const isMatch = await bcrypt.compare(password, employee.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid Employee ID or password' });
    }

    const token = jwt.sign(
      {
        id: employee._id,
        employeeId: employee.employeeId,
        name: employee.name,
        department: employee.department,
        level: employee.level,
        role: employee.role,
      },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      token,
      employee: {
        id: employee._id,
        employeeId: employee.employeeId,
        name: employee.name,
        email: employee.email,
        department: employee.department,
        level: employee.level,
        role: employee.role,
        examAccess: employee.examAccess || {
          isLinkActive: false,
          attemptsAllowed: 0,
          attemptsUsed: 0,
          status: 'NOT_ASSIGNED',
        },
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

const getProfile = async (req, res) => {
  try {
    const employee = await Employee.findById(req.user.id).select('-password');
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    res.json(employee);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { login, getProfile };
