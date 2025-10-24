const ExcelJS = require('exceljs');
const csvWriter = require('csv-writer');
const csvParser = require('csv-parser');
const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
const PDFDocument = require('pdfkit');
const { logger } = require('../middleware/logger');
const pdfConfig = require('../config/pdfConfig');
const logoManager = require('./logoManager');

class ExportService {
  constructor() {
    this.exportDir = path.join(process.cwd(), 'public', 'exports');
    this.ensureExportDir();
  }

  formatCurrency(amount, currency = 'EUR') {
    const currencySymbols = {
      'USD': '$',
      'EUR': '€',
      'CDF': 'FC',
      'CAD': 'CAD$'
    };
    const symbol = currencySymbols[currency] || currency;
    const formattedAmount = parseFloat(amount).toFixed(2);
    return (currency === 'USD' || currency === 'CAD')
      ? `${symbol}${formattedAmount}`
      : `${formattedAmount}${symbol}`;
  }

  ensureExportDir() {
    if (!fs.existsSync(this.exportDir)) {
      fs.mkdirSync(this.exportDir, { recursive: true });
    }
  }

  async exportToExcel(data, filename, options = {}) {
    try {
      const {
        sheetName = 'Data',
        headers = null,
        formatting = {},
        currency = 'EUR',
        logoPath = null
      } = options;

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet(sheetName);

      // === Logo en haut ===
      if (logoPath && fs.existsSync(logoPath)) {
        const imageId = workbook.addImage({
          filename: logoPath,
          extension: path.extname(logoPath).slice(1)
        });
        worksheet.addImage(imageId, {
          tl: { col: 0, row: 0 },
          ext: { width: 150, height: 60 }
        });
        worksheet.addRow([]);
        worksheet.addRow([]);
      }

      // === Colonnes ===
      const keys = headers || Object.keys(data[0]);
      worksheet.columns = keys.map((key, i) => ({
        header: key,
        key,
        width: formatting.columnWidths?.[i] || 15,
        style: {
          alignment: { vertical: 'middle', horizontal: 'center' },
          font: { bold: true }
        }
      }));

      // === En-tête stylé ===
      const headerRow = worksheet.getRow(worksheet.lastRow.number);
      headerRow.eachCell((cell) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF4A90E2' }
        };
        cell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      });

      // === Lignes ===
      data.forEach((row) => {
        const added = worksheet.addRow(row);
        added.eachCell((cell, colNumber) => {
          const val = cell.value;
          if (typeof val === 'number') {
            const header = worksheet.getRow(1).getCell(colNumber).value;
            if (header.toString().toLowerCase().includes('montant') || header.toString().toLowerCase().includes('prix')) {
              cell.numFmt = currency === 'USD' ? '"$"#,##0.00' : '#,##0.00 [$€-1]';
              cell.font = { color: { argb: 'FF198754' } };
              cell.alignment = { horizontal: 'right' };
            }
          }
        });
      });

      const filePath = path.join(this.exportDir, `${filename}.xlsx`);
      await workbook.xlsx.writeFile(filePath);

      logger.info('Export Excel stylé créé', {
        filename,
        filePath,
        recordCount: data.length
      });

      return filePath;
    } catch (error) {
      logger.error('Erreur export Excel stylé', {
        error: error.message,
        filename,
        recordCount: data.length
      });
      throw error;
    }
  }

  // Les autres méthodes (exportToCSV, importFromCSV, exportFacturesToExcel, etc.)
  // restent inchangées et continuent d'appeler exportToExcel cockpitifié
}

module.exports = ExportService;
