const mongoose = require('mongoose');

async function checkDepts() {
  await mongoose.connect('mongodb://127.0.0.1:27017/exam_portal');
  const Employee = require('./src/models/Employee');
  const stats = await Employee.aggregate([
    { $group: { _id: '$department', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);
  console.log(`Total Unique Departments in DB: ${stats.length}`);
  console.log(stats);
  await mongoose.disconnect();
}

checkDepts().catch(console.error);
