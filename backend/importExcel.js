const ExcelJS = require('exceljs');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGO_URI = 'mongodb://127.0.0.1:27017/exam_portal';

const employeeSchema = new mongoose.Schema(
  {
    employeeId: { type: String, required: true, unique: true, uppercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    department: { type: String, required: true },
    level: { type: String, required: true },
    role: { type: String, enum: ['EMPLOYEE', 'ADMIN'], default: 'EMPLOYEE' },
    designation: { type: String, trim: true },
    mobilePhone: { type: String, trim: true },
  },
  { timestamps: true }
);

const Employee = mongoose.model('Employee', employeeSchema);

function normalizeDepartment(deptStr) {
  if (!deptStr) return 'I&C';
  const str = String(deptStr).trim().toUpperCase();

  if (str === 'ENGINEERING') return 'ENGINEERING';
  if (str.includes('IV&V') || str.includes('IV AND V') || str.includes('IV & V')) return 'IV&V';
  if (str.includes('PERFORMANCE') || str.includes('ANALYSIS') || str.includes('ANALYTICS')) return 'PERFORMANCE ANALYSIS';
  if (str === 'PRODUCTION QC' || str.includes('PROD QC')) return 'PRODUCTION QC';
  if (str === 'PRODUCTION') return 'PRODUCTION';
  if (str.includes('PROJECT QC') || str.includes('PROJECT QC-CLW')) return 'PROJECT QC';
  if (str === 'QC') return 'QC';
  if (str.includes('PROJECT ENGG') || str.includes('PROJECT ENGINEERING') || str.includes('PROJECT MANAGEMENT')) return 'PROJECT ENGG';
  if (str.includes('SERVICE') || str.includes('FACTORY SERVICE')) return 'SERVICE';
  if (str.includes('I&C') || str.includes('COMMISSIONING') || str.includes('INSTALLATION') || str.includes('LOCO') || str.includes('STATION')) return 'I&C';

  return 'I&C';
}

function normalizeLevel(levelStr) {
  if (!levelStr) return 'L1';
  const str = String(levelStr).trim().toUpperCase();
  if (str.includes('L3') || str.includes('3')) return 'L3';
  if (str.includes('L2') || str.includes('2')) return 'L2';
  return 'L1';
}

async function importFullExcel() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile('c:\\Users\\O Sushma\\Downloads\\EG Emp Data - 30.09.2026.xlsx');

  const worksheet = workbook.worksheets[0];
  console.log(`Processing worksheet: ${worksheet.name} with ${worksheet.rowCount} rows...`);

  const hashedPassword = await bcrypt.hash('123456', 10);
  let importedCount = 0;
  let updatedCount = 0;

  // Header row detection
  let colMap = {};
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1 || rowNumber === 2 || rowNumber === 3) {
      row.eachCell((cell) => {
        const val = String(cell.value || '').trim().toLowerCase();
        if (val.includes('employee number') || val.includes('employee id') || val.includes('emp no') || val === 'id') {
          colMap.employeeId = cell.col;
        } else if (val.includes('display name') || val.includes('full name') || val === 'name') {
          colMap.name = cell.col;
        } else if (val.includes('department') || val === 'dept') {
          colMap.department = cell.col;
        } else if (val.includes('designation') || val.includes('title')) {
          colMap.designation = cell.col;
        } else if (val.includes('level') || val === 'lvl') {
          colMap.level = cell.col;
        } else if (val.includes('mobile') || val.includes('phone')) {
          colMap.mobilePhone = cell.col;
        } else if (val.includes('work email') || val.includes('email')) {
          colMap.email = cell.col;
        }
      });
    }
  });

  console.log('Detected Column Map:', colMap);

  for (let r = 2; r <= worksheet.rowCount; r++) {
    const row = worksheet.getRow(r);
    const getCellVal = (colNum) => {
      if (!colNum) return '';
      const cell = row.getCell(colNum);
      if (!cell || cell.value === null || cell.value === undefined) return '';
      if (typeof cell.value === 'object' && cell.value.result !== undefined) {
        return String(cell.value.result).trim();
      }
      return String(cell.value).trim();
    };

    const rawEmpId = getCellVal(colMap.employeeId);
    if (!rawEmpId || rawEmpId.toLowerCase().includes('employee number')) continue;
    const employeeId = rawEmpId.toUpperCase();

    const name = getCellVal(colMap.name);
    if (!name) continue;

    let email = getCellVal(colMap.email).toLowerCase();
    if (!email) {
      email = `${employeeId.toLowerCase()}@hbl.in`;
    }

    const rawDept = getCellVal(colMap.department);
    const department = normalizeDepartment(rawDept);

    const rawLevel = getCellVal(colMap.level);
    const level = normalizeLevel(rawLevel);

    const designation = getCellVal(colMap.designation);
    const mobilePhone = getCellVal(colMap.mobilePhone);

    const isSuperAdmin = employeeId === '123456';
    const role = isSuperAdmin ? 'ADMIN' : 'EMPLOYEE';

    const existing = await Employee.findOne({ employeeId });
    if (existing) {
      existing.name = name;
      existing.email = email;
      existing.department = department;
      existing.level = level;
      existing.role = role;
      existing.password = hashedPassword;
      if (designation) existing.designation = designation;
      if (mobilePhone) existing.mobilePhone = mobilePhone;
      await existing.save();
      updatedCount++;
    } else {
      const newEmp = new Employee({
        employeeId,
        name,
        email,
        password: hashedPassword,
        department,
        level,
        role,
        designation,
        mobilePhone,
      });
      await newEmp.save();
      importedCount++;
    }
  }

  // Ensure 123456 Admin is explicitly created if missing from Excel
  const adminExists = await Employee.findOne({ employeeId: '123456' });
  if (!adminExists) {
    const adminEmp = new Employee({
      employeeId: '123456',
      name: 'System Administrator',
      email: 'admin@hbl.in',
      password: hashedPassword,
      department: 'I&C',
      level: 'L3',
      role: 'ADMIN',
    });
    await adminEmp.save();
    console.log('Super Admin 123456 registered explicitly.');
  }

  const totalInDb = await Employee.countDocuments();
  console.log(`IMPORT COMPLETE: ${importedCount} created, ${updatedCount} updated. Total employees in DB: ${totalInDb}`);

  // Test checking 53348 specifically
  const testEmp = await Employee.findOne({ employeeId: '53348' });
  console.log('Verification for 53348:', testEmp ? { employeeId: testEmp.employeeId, name: testEmp.name, role: testEmp.role, department: testEmp.department } : 'NOT FOUND');

  await mongoose.disconnect();
}

importFullExcel().catch(console.error);
