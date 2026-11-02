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

const crypto = require('crypto');
const { sendPasswordResetEmail } = require('../utils/mailer');

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

// Forgot Password - Send reset link to employee email
const forgotPassword = async (req, res) => {
  try {
    const { identifier } = req.body;
    if (!identifier || !identifier.trim()) {
      return res.status(400).json({ message: 'Please enter your Employee ID or Email address.' });
    }

    const cleanInput = identifier.trim();
    // Match either employeeId (uppercase) or email (lowercase)
    const employee = await Employee.findOne({
      $or: [
        { employeeId: cleanInput.toUpperCase() },
        { email: cleanInput.toLowerCase() }
      ]
    });

    if (!employee) {
      // Don't leak user existence for unknown accounts
      return res.json({
        message: 'If an account is associated with this ID or Email, password reset instructions have been sent to the registered email address.'
      });
    }

    if (!employee.email) {
      return res.status(400).json({
        message: 'No email address registered for this employee profile. Please contact the administrator.'
      });
    }

    // Generate secure token (valid for 1 hour)
    const resetToken = crypto.randomBytes(24).toString('hex');
    employee.resetPasswordToken = resetToken;
    employee.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await employee.save();

    const origin = req.headers.origin || req.headers.referer?.replace(/\/$/, '') || null;
    await sendPasswordResetEmail({
      to: employee.email,
      employeeName: employee.name,
      resetToken,
      origin
    });

    const masked = employee.email.replace(/(.{2})(.*)(?=@)/, '$1***');
    res.json({
      message: `Password reset instructions have been sent to your registered email (${masked}).`,
      emailMasked: masked,
      devResetToken: process.env.NODE_ENV !== 'production' ? resetToken : undefined
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Failed to process password reset request', error: error.message });
  }
};

// Reset Password - Verify token and set new password
const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword || !newPassword.trim()) {
      return res.status(400).json({ message: 'Reset token and new password are required.' });
    }

    if (newPassword.trim().length < 4) {
      return res.status(400).json({ message: 'Password must be at least 4 characters long.' });
    }

    const employee = await Employee.findOne({
      resetPasswordToken: token.trim(),
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!employee) {
      return res.status(400).json({ message: 'Password reset link is invalid or has expired. Please request a new one.' });
    }

    // Hash and update password
    const hashedPassword = await bcrypt.hash(newPassword.trim(), 10);
    employee.password = hashedPassword;
    employee.resetPasswordToken = null;
    employee.resetPasswordExpires = null;
    await employee.save();

    res.json({ message: 'Password has been successfully updated! You can now log in with your new password.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Failed to reset password', error: error.message });
  }
};

module.exports = { login, getProfile, forgotPassword, resetPassword };
