const mongoose = require('mongoose');

async function checkEmps() {
  await mongoose.connect('mongodb://127.0.0.1:27017/exam_portal');
  const Employee = mongoose.model('Employee', new mongoose.Schema({}, { strict: false }));
  const emps = await Employee.find();
  console.log('Employees in DB:', emps.map(e => ({ id: e._id, employeeId: e.employeeId, role: e.role, name: e.name })));
  await mongoose.disconnect();
}

checkEmps();
