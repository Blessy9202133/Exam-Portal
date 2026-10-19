const mongoose = require('mongoose');

const MONGO_URI = 'mongodb://127.0.0.1:27017/exam_portal';

const employeeSchema = new mongoose.Schema({
  employeeId: String,
  name: String,
  email: String,
  department: String,
  level: String,
  role: String,
});

const Employee = mongoose.model('Employee', employeeSchema);

async function checkUser() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  const emp = await Employee.findOne({ employeeId: '53348' });
  console.log('User 53348:', emp);

  const count = await Employee.countDocuments();
  console.log('Total employees in DB:', count);

  const sampleEmps = await Employee.find().limit(10).select('employeeId name department level role');
  console.log('Sample 10 Employees in DB:', sampleEmps);

  await mongoose.disconnect();
}

checkUser().catch(console.error);
