const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');

async function searchInExcel(filePath) {
  try {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);

    for (const worksheet of workbook.worksheets) {
      worksheet.eachRow((row, rowNumber) => {
        row.eachCell((cell) => {
          const val = String(cell.value || '');
          if (val.includes('53348') || val.includes('Employee Number') || val.includes('Display Name')) {
            console.log(`[FOUND in ${path.basename(filePath)} | Sheet: ${worksheet.name} | Row ${rowNumber}]:`);
            const rowVals = [];
            row.eachCell(c => rowVals.push(c.value));
            console.log(rowVals);
          }
        });
      });
    }
  } catch (err) {
    // Ignore errors for unreadable files
  }
}

async function searchAllDesktopExcels() {
  const desktopDir = 'c:\\Users\\O Sushma\\Desktop';
  const files = fs.readdirSync(desktopDir);
  for (const f of files) {
    if (f.endsWith('.xlsx') || f.endsWith('.xls') || f.endsWith('.csv')) {
      const fullPath = path.join(desktopDir, f);
      await searchInExcel(fullPath);
    }
  }
}

searchAllDesktopExcels().catch(console.error);
