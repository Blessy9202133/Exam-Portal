const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const seedAdminUser = async () => {
  try {
    const Employee = require('../models/Employee');
    const admin = await Employee.findOne({ employeeId: '123456' });
    if (!admin) {
      const hashedPassword = await bcrypt.hash('123456', 10);
      await Employee.create({
        employeeId: '123456',
        name: 'System Administrator',
        email: 'admin@examportal.com',
        password: hashedPassword,
        department: 'I&C',
        level: 'L3',
        role: 'ADMIN',
        designation: 'System Administrator',
        mobilePhone: ''
      });
      console.log('✅ Default System Admin (123456) automatically initialized in database.');
    } else if (admin.role !== 'ADMIN') {
      admin.role = 'ADMIN';
      await admin.save();
      console.log('✅ Account 123456 role confirmed as ADMIN.');
    }
  } catch (err) {
    console.error('Error auto-seeding admin user:', err.message);
  }
};

const connectDB = async () => {
  try {
    const connStr = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/exam_portal';
    const conn = await mongoose.connect(connStr);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    await seedAdminUser();
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
