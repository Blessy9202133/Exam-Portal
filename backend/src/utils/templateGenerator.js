const fs = require('fs');
const path = require('path');
const ExcelJS = require('exceljs');
const { Document, Packer, Paragraph, TextRun, ImageRun, HeadingLevel } = require('docx');
const { getSampleDiagramBuffer, getLocalImagePathFromUrl } = require('./imageStorage');

/**
 * Generates a department-specific Excel (.xlsx) template buffer.
 * Embeds a real sample diagram image directly into the worksheet so managers can simply paste images in cells.
 */
const generateExcelTemplate = async (department = 'I&C') => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(`${department} Questions`);

  // Define Headers (No URLs needed - users simply paste images in the Picture column)
  worksheet.columns = [
    { header: 'Department', key: 'department', width: 20 },
    { header: 'Difficulty', key: 'difficulty', width: 15 },
    { header: 'Question Type', key: 'questionType', width: 18 },
    { header: 'Question Text', key: 'questionText', width: 45 },
    { header: 'Picture / Diagram (Paste Image Here)', key: 'imageUrl', width: 32 },
    { header: 'Option A', key: 'optA', width: 25 },
    { header: 'Option B', key: 'optB', width: 25 },
    { header: 'Option C', key: 'optC', width: 25 },
    { header: 'Option D', key: 'optD', width: 25 },
    { header: 'Correct Answer', key: 'correctAnswer', width: 25 },
    { header: 'Marks', key: 'marks', width: 10 },
    { header: 'Explanation', key: 'explanation', width: 40 },
  ];

  // Style Header Row
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFF' }, size: 11 };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: '1F4E78' },
  };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

  // Sample questions demonstrating MCQ, MULTIPLE, FILL_BLANK, and Pasted Picture Diagram
  const sampleQuestions = [
    {
      department,
      difficulty: 'EASY',
      questionType: 'MCQ',
      questionText: 'What is the standard signal range for industrial analog current loops in instrumentation?',
      imageUrl: '',
      optA: '0 to 10 V',
      optB: '4 to 20 mA',
      optC: '1 to 5 V',
      optD: '0 to 50 mA',
      correctAnswer: 'B',
      marks: 1,
      explanation: '4-20 mA current loop is the universal standard for analog instrumentation signaling.',
    },
    {
      department,
      difficulty: 'MODERATE',
      questionType: 'MULTIPLE',
      questionText: 'Which of the following are primary components of an automated control loop? (Select all that apply)',
      imageUrl: '',
      optA: 'Sensor / Transmitter',
      optB: 'Coffee Machine',
      optC: 'Controller (PLC/DCS)',
      optD: 'Final Control Element (Valve)',
      correctAnswer: 'A, C, D',
      marks: 2,
      explanation: 'Sensors measure the process, controllers compute output, and valves/actuators execute the control action.',
    },
    {
      department,
      difficulty: 'MODERATE',
      questionType: 'FILL_BLANK',
      questionText: 'The protocol used for superimposing digital communication signals on 4-20 mA current loops is called ______.',
      imageUrl: '',
      optA: '',
      optB: '',
      optC: '',
      optD: '',
      correctAnswer: 'HART',
      marks: 2,
      explanation: 'HART (Highway Addressable Remote Transducer) overlays digital FSK signals on analog loops.',
    },
    {
      department,
      difficulty: 'TOUGH',
      questionType: 'MCQ',
      questionText: 'Identify the schematic symbol shown in the pasted diagram.',
      imageUrl: '',
      optA: 'Field-Mounted Transmitter',
      optB: 'Thermocouple Sensor',
      optC: 'Solenoid Valve',
      optD: 'Flow Meter',
      correctAnswer: 'A',
      marks: 3,
      explanation: 'The pasted diagram represents a standard Field-Mounted Transmitter symbol.',
    },
  ];

  sampleQuestions.forEach((data) => {
    worksheet.addRow(data);
  });

  // Embed an actual sample diagram image inside Row 5 (Question 4), Column E (Picture column)
  try {
    const samplePngBuffer = getSampleDiagramBuffer();
    const imageId = workbook.addImage({
      buffer: samplePngBuffer,
      extension: 'png',
    });
    worksheet.getRow(5).height = 68;
    worksheet.addImage(imageId, {
      tl: { col: 4, row: 4 },
      ext: { width: 150, height: 75 },
    });
  } catch (err) {
    console.error('Error embedding sample image into Excel template:', err.message);
  }

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber > 1) {
      row.alignment = { vertical: 'middle', wrapText: true };
    }
  });

  return await workbook.xlsx.writeBuffer();
};

/**
 * Generates a department-specific Word (.docx) template buffer.
 */
const generateWordTemplate = async (department = 'I&C') => {
  const samplePngBuffer = getSampleDiagramBuffer();

  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            text: `${department.toUpperCase()} DEPARTMENT QUESTION BANK TEMPLATE`,
            heading: HeadingLevel.HEADING_1,
            spacing: { after: 200 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: 'Instructions for Question Bank Creators:',
                bold: true,
                size: 24,
              }),
            ],
            spacing: { after: 100 },
          }),
          new Paragraph({
            text: `1. Department: ${department}. Specify Difficulty (EASY, MODERATE, TOUGH), Type (MCQ, MULTIPLE, FILL_BLANK), and Marks for each question.`,
            spacing: { after: 50 },
          }),
          new Paragraph({
            text: '2. For MCQs and Multiple Select: Provide 4 options (A, B, C, D) and specify Answer: B or Answer: A, C.',
            spacing: { after: 50 },
          }),
          new Paragraph({
            text: '3. For Fill-in-the-Blanks: Write [Type: FILL_BLANK] and specify Answer: text.',
            spacing: { after: 50 },
          }),
          new Paragraph({
            text: '4. Pictures/Diagrams: Simply copy & paste any picture directly under the question line! The server automatically stores the image during upload.',
            spacing: { after: 200 },
          }),
          new Paragraph({ text: '------------------------------------------------------------', spacing: { after: 300 } }),

          // Sample Question 1: MCQ
          new Paragraph({
            children: [
              new TextRun({ text: `[Department: ${department}]  [Type: MCQ]  [Difficulty: EASY]  [Marks: 1]`, bold: true, color: '1F4E78' }),
            ],
            spacing: { after: 100 },
          }),
          new Paragraph({
            children: [new TextRun({ text: 'Q1. What is the standard signal range for industrial analog current loops?', bold: true })],
            spacing: { after: 100 },
          }),
          new Paragraph({ text: 'A) 0 to 10 V' }),
          new Paragraph({ text: 'B) 4 to 20 mA (Correct)', bold: true }),
          new Paragraph({ text: 'C) 1 to 5 V' }),
          new Paragraph({ text: 'D) 0 to 50 mA', spacing: { after: 100 } }),
          new Paragraph({ text: 'Explanation: 4-20 mA current loop is the universal standard in industry.', spacing: { after: 300 } }),

          // Sample Question 2: Multiple Select
          new Paragraph({
            children: [
              new TextRun({ text: `[Department: ${department}]  [Type: MULTIPLE]  [Difficulty: MODERATE]  [Marks: 2]`, bold: true, color: '1F4E78' }),
            ],
            spacing: { after: 100 },
          }),
          new Paragraph({
            children: [new TextRun({ text: 'Q2. Which of the following are primary components of an automated control loop?', bold: true })],
            spacing: { after: 100 },
          }),
          new Paragraph({ text: 'A) Sensor / Transmitter (Correct)', bold: true }),
          new Paragraph({ text: 'B) Coffee Machine' }),
          new Paragraph({ text: 'C) Controller PLC/DCS (Correct)', bold: true }),
          new Paragraph({ text: 'D) Final Control Element (Correct)', bold: true, spacing: { after: 100 } }),
          new Paragraph({ text: 'Answer: A, C, D' }),
          new Paragraph({ text: 'Explanation: Sensors, controllers, and valves form the closed loop.', spacing: { after: 300 } }),

          // Sample Question 3: Fill in the Blank
          new Paragraph({
            children: [
              new TextRun({ text: `[Department: ${department}]  [Type: FILL_BLANK]  [Difficulty: EASY]  [Marks: 1]`, bold: true, color: '1F4E78' }),
            ],
            spacing: { after: 100 },
          }),
          new Paragraph({
            children: [new TextRun({ text: 'Q3. Digital communication overlay protocol on 4-20 mA loops is called ______.', bold: true })],
            spacing: { after: 100 },
          }),
          new Paragraph({ text: 'Answer: HART', bold: true }),
          new Paragraph({ text: 'Explanation: HART overlays digital FSK signals on analog loops.', spacing: { after: 300 } }),

          // Sample Question 4: Pasted Picture Diagram
          new Paragraph({
            children: [
              new TextRun({ text: `[Department: ${department}]  [Type: MCQ]  [Difficulty: TOUGH]  [Marks: 3]`, bold: true, color: '1F4E78' }),
            ],
            spacing: { after: 100 },
          }),
          new Paragraph({
            children: [new TextRun({ text: 'Q4. Identify the schematic symbol shown in the pasted diagram below:', bold: true })],
            spacing: { after: 100 },
          }),
          new Paragraph({
            children: [
              new ImageRun({
                data: samplePngBuffer,
                transformation: { width: 160, height: 80 },
                type: 'png',
              }),
            ],
            spacing: { after: 100 },
          }),
          new Paragraph({ text: 'A) Field-Mounted Transmitter (Correct)', bold: true }),
          new Paragraph({ text: 'B) Thermocouple Sensor' }),
          new Paragraph({ text: 'C) Solenoid Valve' }),
          new Paragraph({ text: 'D) Flow Meter', spacing: { after: 100 } }),
          new Paragraph({ text: 'Answer: A' }),
          new Paragraph({ text: 'Explanation: The pasted diagram represents a standard Field-Mounted Transmitter symbol.', spacing: { after: 300 } }),
        ],
      },
    ],
  });

  return await Packer.toBuffer(doc);
};

/**
 * Generates an Excel (.xlsx) buffer containing active database questions for a department.
 * Re-embeds any stored server images directly into the Picture column of the Excel sheet.
 */
const exportExistingQuestionsExcel = async (department = 'I&C') => {
  const Question = require('../models/Question');
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(`${department} Active Questions`);

  worksheet.columns = [
    { header: 'Department', key: 'department', width: 20 },
    { header: 'Difficulty', key: 'difficulty', width: 15 },
    { header: 'Question Type', key: 'questionType', width: 18 },
    { header: 'Question Text', key: 'questionText', width: 45 },
    { header: 'Picture / Diagram (Paste Image Here)', key: 'imageUrl', width: 32 },
    { header: 'Option A', key: 'optA', width: 25 },
    { header: 'Option B', key: 'optB', width: 25 },
    { header: 'Option C', key: 'optC', width: 25 },
    { header: 'Option D', key: 'optD', width: 25 },
    { header: 'Correct Answer', key: 'correctAnswer', width: 25 },
    { header: 'Marks', key: 'marks', width: 10 },
    { header: 'Explanation', key: 'explanation', width: 40 },
  ];

  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFF' }, size: 11 };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: '1F4E78' },
  };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

  const questions = await Question.find({ department }).sort({ createdAt: 1 });

  questions.forEach((q, idx) => {
    let corrAns = '';
    if (q.questionType === 'FILL_BLANK') {
      corrAns = q.correctTextAnswer || '';
    } else if (q.questionType === 'MULTIPLE') {
      corrAns = (q.correctOptions || []).map((i) => ['A', 'B', 'C', 'D'][i]).join(', ');
    } else {
      corrAns = ['A', 'B', 'C', 'D'][q.correctOptionIndex] || 'A';
    }

    const rowNumber = idx + 2;
    const localImgPath = getLocalImagePathFromUrl(q.imageUrl);

    worksheet.addRow({
      department: q.department || department,
      difficulty: q.difficulty || 'EASY',
      questionType: q.questionType || 'MCQ',
      questionText: q.questionText,
      imageUrl: localImgPath ? '' : (q.imageUrl || ''),
      optA: q.options ? q.options[0] || '' : '',
      optB: q.options ? q.options[1] || '' : '',
      optC: q.options ? q.options[2] || '' : '',
      optD: q.options ? q.options[3] || '' : '',
      correctAnswer: corrAns,
      marks: q.marks || 1,
      explanation: q.explanation || '',
    });

    if (localImgPath) {
      try {
        const ext = path.extname(localImgPath).replace('.', '').toLowerCase() || 'png';
        const imgId = workbook.addImage({
          filename: localImgPath,
          extension: ext === 'jpg' ? 'jpeg' : ext,
        });
        worksheet.getRow(rowNumber).height = 68;
        worksheet.addImage(imgId, {
          tl: { col: 4, row: rowNumber - 1 },
          ext: { width: 150, height: 75 },
        });
      } catch (e) {
        console.error('Warning embedding stored image in export:', e.message);
      }
    }
  });

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber > 1) {
      row.alignment = { vertical: 'middle', wrapText: true };
    }
  });

  return await workbook.xlsx.writeBuffer();
};

/**
 * Generates an Excel (.xlsx) template buffer for bulk Employee account registration.
 */
const generateEmployeeExcelTemplate = async () => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Employee Accounts');

  worksheet.columns = [
    { header: '#', key: 'sno', width: 8 },
    { header: 'Employee Number', key: 'employeeId', width: 18 },
    { header: 'Display Name', key: 'name', width: 25 },
    { header: 'Department', key: 'department', width: 25 },
    { header: 'Designation', key: 'designation', width: 22 },
    { header: 'Level', key: 'level', width: 12 },
    { header: 'Mobile Phone', key: 'mobilePhone', width: 18 },
    { header: 'Work Email', key: 'email', width: 30 },
  ];

  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFF' }, size: 11 };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: '1F4E78' },
  };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

  const sampleRows = [
    {
      sno: 1,
      employeeId: 'EMP1001',
      name: 'I&C Testing L1 User',
      department: 'I&C',
      designation: 'Testing Engineer',
      level: 'L1',
      mobilePhone: '9876543210',
      email: 'ic.l1@examportal.com',
    },
    {
      sno: 2,
      employeeId: 'EMP2002',
      name: 'PE Testing L2 User',
      department: 'PROJECT ENGG',
      designation: 'Senior Engineer',
      level: 'L2',
      mobilePhone: '9876543211',
      email: 'pe.l2@examportal.com',
    },
  ];

  sampleRows.forEach((r) => worksheet.addRow(r));

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber > 1) {
      row.alignment = { vertical: 'middle' };
    }
  });

  return await workbook.xlsx.writeBuffer();
};

module.exports = {
  generateExcelTemplate,
  generateWordTemplate,
  exportExistingQuestionsExcel,
  generateEmployeeExcelTemplate,
};
