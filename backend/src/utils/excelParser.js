const ExcelJS = require('exceljs');
const { saveImageToServer } = require('./imageStorage');

/**
 * Parses an Excel (.xlsx) file buffer into an array of Question objects.
 * Automatically extracts any pasted pictures/diagrams in rows and saves them to the server.
 */
const parseExcelDocument = async (fileBuffer, defaultDepartment = 'I&C') => {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(fileBuffer);

  const worksheet = workbook.worksheets[0];
  if (!worksheet) {
    throw new Error('Excel sheet is empty');
  }

  const questions = [];
  let colMap = {};

  // Extract pasted images from the Excel worksheet and store them on the server
  const imageMapByRow = {};
  try {
    const images = worksheet.getImages();
    images.forEach((img) => {
      const imgObj = workbook.getImage(img.imageId);
      if (imgObj && imgObj.buffer) {
        const ext = imgObj.extension || 'png';
        const rawRow =
          img.range && img.range.tl
            ? img.range.tl.nativeRow !== undefined
              ? img.range.tl.nativeRow
              : Math.floor(img.range.tl.row || 0)
            : null;
        if (rawRow !== null && rawRow >= 1) {
          const targetRow = rawRow + 1; // 1-indexed Excel row number
          const savedUrl = saveImageToServer(Buffer.from(imgObj.buffer), ext);
          if (savedUrl) {
            imageMapByRow[targetRow] = savedUrl;
          }
        }
      }
    });
  } catch (e) {
    console.error('Warning extracting Excel embedded images:', e.message);
  }

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) {
      row.eachCell((cell) => {
        const val = String(cell.value || '').trim().toLowerCase();
        if (val.includes('department')) colMap.department = cell.col;
        else if (val.includes('difficulty')) colMap.difficulty = cell.col;
        else if (val.includes('type')) colMap.questionType = cell.col;
        else if (val.includes('image') || val.includes('picture') || val.includes('diagram')) colMap.imageUrl = cell.col;
        else if (val.includes('question')) colMap.questionText = cell.col;
        else if (val.includes('option a') || val === 'a') colMap.optA = cell.col;
        else if (val.includes('option b') || val === 'b') colMap.optB = cell.col;
        else if (val.includes('option c') || val === 'c') colMap.optC = cell.col;
        else if (val.includes('option d') || val === 'd') colMap.optD = cell.col;
        else if (val.includes('correct') || val.includes('answer')) colMap.correctAnswer = cell.col;
        else if (val.includes('mark')) colMap.marks = cell.col;
        else if (val.includes('explanation')) colMap.explanation = cell.col;
      });
      return;
    }

    const getCellVal = (colNum) => {
      if (!colNum) return '';
      const cell = row.getCell(colNum);
      if (!cell || cell.value === null || cell.value === undefined) return '';
      if (typeof cell.value === 'object' && cell.value.result !== undefined) {
        return String(cell.value.result).trim();
      }
      return String(cell.value).trim();
    };

    const questionText = getCellVal(colMap.questionText);
    if (!questionText) return;

    let rawDept = getCellVal(colMap.department) || defaultDepartment;
    const matchedDept = normalizeDepartment(rawDept);

    let diffStr = (getCellVal(colMap.difficulty) || 'EASY').toUpperCase();
    if (diffStr === 'COMPLEX') diffStr = 'TOUGH';
    if (!['EASY', 'MODERATE', 'TOUGH'].includes(diffStr)) {
      diffStr = 'EASY';
    }

    const rawType = (getCellVal(colMap.questionType) || '').toUpperCase();
    let questionType = 'MCQ';
    if (rawType.includes('FILL') || rawType.includes('BLANK')) {
      questionType = 'FILL_BLANK';
    } else if (rawType.includes('MULTI') || rawType.includes('SELECT') || rawType.includes('CHECKBOX')) {
      questionType = 'MULTIPLE';
    }

    // Priority 1: Pasted image in the Excel row saved to server
    let imageUrl = imageMapByRow[rowNumber] || '';
    if (!imageUrl) {
      const cellImg = getCellVal(colMap.imageUrl);
      if (cellImg.startsWith('data:image/')) {
        const base64Match = cellImg.match(/^data:image\/([a-zA-Z0-9]+);base64,(.+)$/);
        if (base64Match) {
          imageUrl = saveImageToServer(Buffer.from(base64Match[2], 'base64'), base64Match[1]);
        }
      } else if (cellImg.startsWith('http://') || cellImg.startsWith('https://') || cellImg.startsWith('/uploads/')) {
        imageUrl = cellImg;
      }
    }

    const optA = getCellVal(colMap.optA);
    const optB = getCellVal(colMap.optB);
    const optC = getCellVal(colMap.optC);
    const optD = getCellVal(colMap.optD);

    let options = [];
    if (questionType !== 'FILL_BLANK') {
      options = [optA, optB, optC, optD].filter(Boolean);
      while (options.length < 4) {
        options.push(`Option ${options.length + 1}`);
      }
      options = options.slice(0, 4);
    }

    const correctAnsStr = getCellVal(colMap.correctAnswer);
    let correctOptionIndex = 0;
    let correctOptions = [];
    let correctTextAnswer = '';

    if (questionType === 'FILL_BLANK') {
      correctTextAnswer = correctAnsStr || optA || '';
    } else if (questionType === 'MULTIPLE') {
      const upperStr = correctAnsStr.toUpperCase();
      if (upperStr.includes('A') || upperStr.includes('1')) correctOptions.push(0);
      if (upperStr.includes('B') || upperStr.includes('2')) correctOptions.push(1);
      if (upperStr.includes('C') || upperStr.includes('3')) correctOptions.push(2);
      if (upperStr.includes('D') || upperStr.includes('4')) correctOptions.push(3);
      if (correctOptions.length === 0) correctOptions = [0];
      correctOptionIndex = correctOptions[0];
    } else {
      const upperStr = correctAnsStr.toUpperCase();
      if (upperStr.includes('B') || upperStr === '2') correctOptionIndex = 1;
      else if (upperStr.includes('C') || upperStr === '3') correctOptionIndex = 2;
      else if (upperStr.includes('D') || upperStr === '4') correctOptionIndex = 3;
      correctOptions = [correctOptionIndex];
    }

    const rawMarks = parseInt(getCellVal(colMap.marks), 10);
    const marks = isNaN(rawMarks) || rawMarks < 1 ? 1 : rawMarks;

    const explanation = getCellVal(colMap.explanation);

    questions.push({
      department: matchedDept,
      difficulty: diffStr,
      questionType,
      imageUrl,
      questionText,
      options,
      correctOptionIndex,
      correctOptions,
      correctTextAnswer,
      marks,
      explanation,
    });
  });

  return questions;
};

/**
 * Parses an Excel (.xlsx) file buffer into an array of Employee user objects.
 */
const parseEmployeeExcelDocument = async (fileBuffer) => {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(fileBuffer);

  const worksheet = workbook.worksheets[0];
  if (!worksheet) {
    throw new Error('Excel sheet is empty');
  }

  const employees = [];
  let colMap = {};

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) {
      row.eachCell((cell) => {
        const val = String(cell.value || '').trim().toLowerCase();
        if (
          val.includes('employee number') ||
          val.includes('employee id') ||
          val.includes('emp no') ||
          val.includes('emp number') ||
          val === 'id'
        ) {
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
      return;
    }

    const getCellVal = (colNum) => {
      if (!colNum) return '';
      const cell = row.getCell(colNum);
      if (!cell || cell.value === null || cell.value === undefined) return '';
      if (typeof cell.value === 'object' && cell.value.result !== undefined) {
        return String(cell.value.result).trim();
      }
      return String(cell.value).trim();
    };

    const employeeId = getCellVal(colMap.employeeId).toUpperCase();
    const name = getCellVal(colMap.name);
    if (!employeeId || !name) return;

    let email = getCellVal(colMap.email).toLowerCase();
    if (!email) {
      email = `${employeeId.toLowerCase()}@examportal.com`;
    }

    const rawDept = getCellVal(colMap.department);
    const department = normalizeDepartment(rawDept);

    const rawLevel = getCellVal(colMap.level);
    const level = normalizeLevel(rawLevel);

    const designation = getCellVal(colMap.designation);
    const mobilePhone = getCellVal(colMap.mobilePhone);

    employees.push({
      employeeId,
      name,
      email,
      department,
      level,
      designation,
      mobilePhone,
      role: 'EMPLOYEE',
    });
  });

  return employees;
};

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

module.exports = { parseExcelDocument, parseEmployeeExcelDocument };
