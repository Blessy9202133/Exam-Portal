const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/exam_portal';

const employeeSchema = new mongoose.Schema({
  employeeId: String,
  role: String,
  password: String,
});

const Employee = mongoose.model('Employee', employeeSchema);

async function updateAllPasswords() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  const employees = await Employee.find({});
  let count = 0;
  for (const emp of employees) {
    emp.password = await bcrypt.hash(emp.employeeId.trim(), 10);
    await emp.save();
    count++;
    if (count % 100 === 0) console.log(`Processed ${count} accounts...`);
  }

  console.log(`Updated ${count} accounts so password = Employee ID (username).`);
  await mongoose.disconnect();
}

updateAllPasswords().catch(console.error);
