const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');

async function searchFolder(folderPath) {
  if (!fs.existsSync(folderPath)) return;
  const files = fs.readdirSync(folderPath);
  for (const f of files) {
    if (f.endsWith('.xlsx') || f.endsWith('.xls') || f.endsWith('.csv')) {
      const filePath = path.join(folderPath, f);
      try {
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(filePath);
        for (const worksheet of workbook.worksheets) {
          worksheet.eachRow((row, rowNumber) => {
            row.eachCell((cell) => {
              const val = String(cell.value || '');
              if (val.includes('53348')) {
                console.log(`[MATCH FOUND] File: ${filePath} | Sheet: ${worksheet.name} | Row ${rowNumber}`);
                const rowVals = [];
                row.eachCell(c => rowVals.push(c.value));
                console.log(rowVals);
              }
            });
          });
        }
      } catch (e) {}
    }
  }
}

async function runSearch() {
  await searchFolder('c:\\Users\\O Sushma\\Desktop');
  await searchFolder('c:\\Users\\O Sushma\\Downloads');
  await searchFolder('c:\\Users\\O Sushma\\Documents');
}

runSearch().catch(console.error);
