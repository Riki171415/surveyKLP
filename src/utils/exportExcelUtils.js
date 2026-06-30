import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

/**
 * Utility to export multiple tables to an Excel file with consistent styling.
 * @param {string} dashboardTitle - Title of the dashboard for the header.
 * @param {Array} tables - Array of table objects: { title: string, headers: Array<string>, data: Array<Array|Object> }
 * @param {string} filenamePrefix - Prefix for the output filename.
 */
export const exportTablesToExcel = async (dashboardTitle, tables, filenamePrefix) => {
  try {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Dashboard Survey KKLP';
    workbook.created = new Date();
    
    // Max sheet name is 31 chars
    const sheetName = dashboardTitle.substring(0, 31).replace(/[\[\]\*\\\?\/\:]/g, ''); 
    const sheet = workbook.addWorksheet(sheetName);

    // Setup Columns (Max 10 columns for general use)
    sheet.columns = [
      { header: '', key: 'col1', width: 5 }, // Left padding
      { header: '', key: 'col2', width: 45 }, // Main category name
      { header: '', key: 'col3', width: 25 }, // Value 1
      { header: '', key: 'col4', width: 20 }, // Value 2 (if any)
      { header: '', key: 'col5', width: 20 }, // Value 3 (if any)
      { header: '', key: 'col6', width: 20 },
      { header: '', key: 'col7', width: 20 },
    ];

    // Main Title
    sheet.mergeCells('B1:F1');
    const titleCell = sheet.getCell('B1');
    titleCell.value = `DASHBOARD ${dashboardTitle.toUpperCase()}`;
    titleCell.font = { name: 'Arial', size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0ea5e9' } };

    let currentRow = 3;

    tables.forEach(table => {
      if (!table.data || table.data.length === 0) return; // Skip empty tables

      // Section Title
      sheet.addRow([]);
      sheet.addRow(['', table.title.toUpperCase()]);
      sheet.lastRow.getCell(2).font = { bold: true, size: 12 };
      
      // Table Headers
      const headerRowVals = ['', ...table.headers];
      sheet.addRow(headerRowVals);
      const headerRow = sheet.lastRow;
      headerRow.font = { bold: true };
      
      // Style headers
      table.headers.forEach((_, i) => {
        const cell = headerRow.getCell(i + 2);
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
        cell.border = { top: {style:'thin'}, bottom: {style:'thin'}, left: {style:'thin'}, right: {style:'thin'} };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      });

      // Table Data
      table.data.forEach(item => {
        let rowVals = [''];
        if (Array.isArray(item)) {
          rowVals.push(...item);
        } else if (item && typeof item === 'object') {
          // If it's an object, assume { name, value, ... } format usually from Recharts
          rowVals.push(item.name || item.id || item.label || '-', item.value !== undefined ? item.value : item.count || 0);
        }
        
        sheet.addRow(rowVals);
        const dataRow = sheet.lastRow;
        
        // Add borders to data row
        table.headers.forEach((_, i) => {
          const cell = dataRow.getCell(i + 2);
          cell.border = { top: {style:'thin'}, bottom: {style:'thin'}, left: {style:'thin'}, right: {style:'thin'} };
          // If value is a number, center it
          if (typeof cell.value === 'number') {
            cell.alignment = { horizontal: 'center' };
          }
        });
      });
      
      sheet.addRow([]); // Blank row after table
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `${filenamePrefix}_${new Date().getTime()}.xlsx`);
    
  } catch (err) {
    console.error('Failed to export native excel:', err);
    alert('Gagal mengekspor Excel: ' + err.message);
  }
};
