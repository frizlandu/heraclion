const ExcelJS = require('exceljs');

const csvWriter = require('csv-writer');
const csvParser = require('csv-parser');
const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
const PDFDocument = require('pdfkit');
const { logger } = require('../middleware/logger');

class ExportService {
  constructor() {
    this.exportDir = path.join(process.cwd(), 'public', 'exports');
    this.ensureExportDir();
  }

  /**
   * S'assure que le dossier d'export existe
   */
  ensureExportDir() {
    if (!fs.existsSync(this.exportDir)) {
      fs.mkdirSync(this.exportDir, { recursive: true });
    }
  }

  /**
   * Exporte des données vers Excel
   * @param {Array} data - Données à exporter
   * @param {string} filename - Nom du fichier
   * @param {Object} options - Options d'export
   * @returns {Promise<string>} Chemin du fichier créé
   */
  async exportToExcel(data, filename, options = {}) {
    try {
      const {
        sheetName = 'Data',
        headers = null,
        formatting = {}
      } = options;

      // Créer un nouveau workbook
      const workbook = xlsx.utils.book_new();

      // Convertir les données en worksheet
      const worksheet = headers
        ? xlsx.utils.json_to_sheet(data, { header: headers })
        : xlsx.utils.json_to_sheet(data);

      // Appliquer le formatage si fourni
      if (formatting.columnWidths) {
        worksheet['!cols'] = formatting.columnWidths.map(width => ({ wch: width }));
      }

      // Ajouter la worksheet au workbook
      xlsx.utils.book_append_sheet(workbook, worksheet, sheetName);

      // Générer le chemin du fichier
      const filePath = path.join(this.exportDir, `${filename}.xlsx`);

      // Écrire le fichier
      xlsx.writeFile(workbook, filePath);

      logger.info('Export Excel créé', {
        filename,
        filePath,
        recordCount: data.length
      });

      return filePath;
    } catch (error) {
      logger.error('Erreur export Excel', {
        error: error.message,
        filename,
        recordCount: data.length
      });
      throw error;
    }
  }

  /**
   * Exporte des données vers CSV
   * @param {Array} data - Données à exporter
   * @param {string} filename - Nom du fichier
   * @param {Object} options - Options d'export
   * @returns {Promise<string>} Chemin du fichier créé
   */
  async exportToCSV(data, filename, options = {}) {
    try {
      const {
        headers = null,
        delimiter = ',',
        encoding = 'utf8'
      } = options;

      const filePath = path.join(this.exportDir, `${filename}.csv`);

      // Déterminer les headers
      const csvHeaders = headers || (data.length > 0 ? Object.keys(data[0]) : []);

      // Créer le writer CSV
      const writer = csvWriter.createObjectCsvWriter({
        path: filePath,
        header: csvHeaders.map(key => ({
          id: key,
          title: key.toUpperCase().replace(/_/g, ' ')
        })),
        fieldDelimiter: delimiter,
        encoding
      });

      // Écrire les données
      await writer.writeRecords(data);

      logger.info('Export CSV créé', {
        filename,
        filePath,
        recordCount: data.length
      });

      return filePath;
    } catch (error) {
      logger.error('Erreur export CSV', {
        error: error.message,
        filename,
        recordCount: data.length
      });
      throw error;
    }
  }

  /**
   * Importe des données depuis un fichier CSV
   * @param {string} filePath - Chemin du fichier CSV
   * @param {Object} options - Options d'import
   * @returns {Promise<Array>} Données importées
   */
  async importFromCSV(filePath, options = {}) {
    return new Promise((resolve, reject) => {
      const results = [];
      const {
        delimiter = ',',
        encoding = 'utf8',
        skipEmptyLines = true,
        transform = null
      } = options;

      fs.createReadStream(filePath, { encoding })
        .pipe(csvParser({
          separator: delimiter,
          skipEmptyLines
        }))
        .on('data', (data) => {
          const record = transform ? transform(data) : data;
          if (record) {
            results.push(record);
          }
        })
        .on('end', () => {
          logger.info('Import CSV terminé', {
            filePath,
            recordCount: results.length
          });
          resolve(results);
        })
        .on('error', (error) => {
          logger.error('Erreur import CSV', {
            error: error.message,
            filePath
          });
          reject(error);
        });
    });
  }

  /**
   * Exporte des factures vers Excel
   * @param {Array} factures - Liste des factures
   * @param {string} filename - Nom du fichier
   * @returns {Promise<string>} Chemin du fichier créé
   */
  async exportFacturesToExcel(factures, filename) {
    const formattedData = factures.map(facture => ({
      'Numéro': facture.numero_facture,
      'Date': new Date(facture.date_facture).toLocaleDateString('fr-FR'),
      'Client': facture.client_nom,
      'Entreprise': facture.entreprise_nom,
      'Montant HT': parseFloat(facture.total || 0).toFixed(2),
      'TVA': parseFloat(facture.tva || 0).toFixed(2),
      'Montant TTC': parseFloat(facture.total_general || 0).toFixed(2),
      'Statut': facture.statut,
      'Date création': new Date(facture.created_at).toLocaleDateString('fr-FR')
    }));

    return this.exportToExcel(formattedData, filename, {
      sheetName: 'Factures',
      formatting: {
        columnWidths: [15, 12, 25, 20, 12, 12, 12, 12, 15]
      }
    });
  }

  /**
   * Exporte des stocks vers Excel
   * @param {Array} stocks - Liste des stocks
   * @param {string} filename - Nom du fichier
   * @returns {Promise<string>} Chemin du fichier créé
   */
  async exportStocksToExcel(stocks, filename) {
    const formattedData = stocks.map(stock => ({
      'Référence': stock.reference,
      'Désignation': stock.designation,
      'Stock actuel': stock.quantite_stock,
      'Stock minimum': stock.quantite_min,
      'Prix achat': parseFloat(stock.prix_achat || 0).toFixed(2),
      'Prix vente': parseFloat(stock.prix_vente || 0).toFixed(2),
      'Valeur stock': (stock.quantite_stock * (stock.prix_achat || 0)).toFixed(2),
      'Statut': stock.quantite_stock <= stock.quantite_min ? 'ALERTE' : 'OK'
    }));

    return this.exportToExcel(formattedData, filename, {
      sheetName: 'Stocks',
      formatting: {
        columnWidths: [15, 30, 12, 12, 12, 12, 15, 10]
      }
    });
  }

  /**
   * Crée une archive ZIP de plusieurs fichiers
   * @param {Array} files - Liste des fichiers à archiver
   * @param {string} archiveName - Nom de l'archive
   * @returns {Promise<string>} Chemin de l'archive créée
   */
  async createArchive(files, archiveName) {
    return new Promise((resolve, reject) => {
      const archivePath = path.join(this.exportDir, `${archiveName}.zip`);
      const output = fs.createWriteStream(archivePath);
      const archive = archiver('zip', { zlib: { level: 9 } });

      output.on('close', () => {
        logger.info('Archive créée', {
          archiveName,
          archivePath,
          totalBytes: archive.pointer()
        });
        resolve(archivePath);
      });

      archive.on('error', (error) => {
        logger.error('Erreur création archive', {
          error: error.message,
          archiveName
        });
        reject(error);
      });

      archive.pipe(output);

      // Ajouter les fichiers à l'archive
      files.forEach(file => {
        if (fs.existsSync(file.path)) {
          archive.file(file.path, { name: file.name || path.basename(file.path) });
        }
      });

      archive.finalize();
    });
  }

  /**
   * Génère un rapport mensuel complet
   * @param {Object} data - Données du rapport
   * @param {number} month - Mois
   * @param {number} year - Année
   * @returns {Promise<string>} Chemin de l'archive créée
   */
  async generateMonthlyReport(data, month, year) {
    const monthName = new Intl.DateTimeFormat('fr-FR', { month: 'long' }).format(new Date(year, month - 1));
    const reportName = `rapport_${monthName}_${year}`;

    try {
      const files = [];

      // Export des factures
      if (data.factures && data.factures.length > 0) {
        const facturesPath = await this.exportFacturesToExcel(
          data.factures,
          `factures_${monthName}_${year}`
        );
        files.push({ path: facturesPath, name: 'factures.xlsx' });
      }

      // Export des stocks
      if (data.stocks && data.stocks.length > 0) {
        const stocksPath = await this.exportStocksToExcel(
          data.stocks,
          `stocks_${monthName}_${year}`
        );
        files.push({ path: stocksPath, name: 'stocks.xlsx' });
      }

      // Export des statistiques
      if (data.statistiques) {
        const statsPath = await this.exportToExcel(
          [data.statistiques],
          `statistiques_${monthName}_${year}`,
          { sheetName: 'Statistiques' }
        );
        files.push({ path: statsPath, name: 'statistiques.xlsx' });
      }

      // Créer l'archive
      const archivePath = await this.createArchive(files, reportName);

      // Nettoyer les fichiers temporaires
      files.forEach(file => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });

      return archivePath;
    } catch (error) {
      logger.error('Erreur génération rapport mensuel', {
        error: error.message,
        month,
        year
      });
      throw error;
    }
  }

  /**
   * Nettoie les anciens fichiers d'export
   * @param {number} daysOld - Nombre de jours (par défaut 7)
   * @returns {Promise<number>} Nombre de fichiers supprimés
   */
  async cleanupOldExports(daysOld = 7) {
    try {
      const files = fs.readdirSync(this.exportDir);
      let deletedCount = 0;
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      for (const file of files) {
        const filePath = path.join(this.exportDir, file);
        const stats = fs.statSync(filePath);

        if (stats.mtime < cutoffDate) {
          fs.unlinkSync(filePath);
          deletedCount++;
        }
      }

      logger.info('Nettoyage exports anciens', {
        daysOld,
        deletedCount
      });

      return deletedCount;
    } catch (error) {
      logger.error('Erreur nettoyage exports', {
        error: error.message,
        daysOld
      });
      throw error;
    }
  }

  /**
   * Obtient la taille du dossier d'export
   * @returns {Promise<Object>} Informations sur le dossier
   */
  async getExportDirInfo() {
    try {
      const files = fs.readdirSync(this.exportDir);
      let totalSize = 0;
      let fileCount = 0;

      for (const file of files) {
        const filePath = path.join(this.exportDir, file);
        const stats = fs.statSync(filePath);
        if (stats.isFile()) {
          totalSize += stats.size;
          fileCount++;
        }
      }

      return {
        fileCount,
        totalSize,
        totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2),
        path: this.exportDir
      };
    } catch (error) {
      logger.error('Erreur info dossier export', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Génère un PDF pour un document (facture/proforma)
   * @param {Object} document - Document à exporter
   * @param {Array} lignes - Lignes du document
   * @param {Object} options - Options de génération
   * @returns {Promise<Buffer>} Buffer PDF
   */
  async generateDocumentPdf(document, lignes = [], options = {}) {
    try {
      logger.info(`Génération PDF pour document ${document.id} - ${document.numero}`);

      // Création du document PDF
      const doc = new PDFDocument({
        margin: 50,
        size: 'A4'
      });

      // Buffer pour stocker le PDF
      const chunks = [];
      doc.on('data', chunk => chunks.push(chunk));
      
      return new Promise((resolve, reject) => {
        doc.on('end', () => {
          const pdfBuffer = Buffer.concat(chunks);
          logger.info(`PDF généré avec succès pour document ${document.id}`);
          resolve(pdfBuffer);
        });

        doc.on('error', (error) => {
          logger.error('Erreur lors de la génération PDF:', error);
          reject(error);
        });

        try {
          // En-tête du document
          this._addPdfHeader(doc, document);
          
          // Informations du document
          const yPos = this._addPdfDocumentInfo(doc, document);
          
          // Tableau des lignes
          let finalYPos = yPos;
          if (lignes && lignes.length > 0) {
            finalYPos = this._addPdfLignesTable(doc, lignes, yPos);
          }
          
          // Totaux
          this._addPdfTotals(doc, document, finalYPos);
          
          // Pied de page
          this._addPdfFooter(doc, document);
          
          // Finaliser le document
          doc.end();
          
        } catch (error) {
          logger.error('Erreur lors de la construction du PDF:', error);
          reject(error);
        }
      });

    } catch (error) {
      logger.error('Erreur lors de la génération PDF:', error);
      throw error;
    }
  }

  /**
   * Ajoute l'en-tête du document PDF
   */
  _addPdfHeader(doc, document) {
    // Logo ou nom de l'entreprise
    doc.fontSize(20)
       .text('HERACLION TRANSPORT', 50, 50);
       
    doc.fontSize(12)
       .text('123 Rue de la Logistique', 50, 80)
       .text('13000 Marseille', 50, 95)
       .text('Tél: 04.XX.XX.XX.XX', 50, 110);

    // Type et numéro du document
    const typeDoc = document.type_document === 'facture' ? 'FACTURE' : 'PROFORMA';
    doc.fontSize(16)
       .text(`${typeDoc} N° ${document.numero}`, 300, 50, { align: 'right' });
       
    doc.fontSize(12)
       .text(`Date: ${new Date(document.date_emission).toLocaleDateString('fr-FR')}`, 300, 75, { align: 'right' });
       
    if (document.date_echeance) {
      doc.text(`Échéance: ${new Date(document.date_echeance).toLocaleDateString('fr-FR')}`, 300, 90, { align: 'right' });
    }

    // Ligne de séparation
    doc.moveTo(50, 140)
       .lineTo(550, 140)
       .stroke();
  }

  /**
   * Ajoute les informations du document PDF
   */
  _addPdfDocumentInfo(doc, document) {
    let yPosition = 160;

    // Informations client
    doc.fontSize(14)
       .text('Facturé à:', 50, yPosition);
       
    yPosition += 20;
    doc.fontSize(12)
       .text(document.client_nom || 'Client non défini', 50, yPosition);
       
    if (document.client_adresse) {
      yPosition += 15;
      doc.text(document.client_adresse, 50, yPosition);
    }
    
    if (document.client_ville) {
      yPosition += 15;
      doc.text(document.client_ville, 50, yPosition);
    }

    // Informations transport si applicable
    if (document.modele_facture === 'transport') {
      yPosition += 30;
      doc.fontSize(14)
         .text('Informations Transport:', 50, yPosition);
         
      yPosition += 20;
      doc.fontSize(12);
      
      if (document.lieu_chargement) {
        doc.text(`Lieu de chargement: ${document.lieu_chargement}`, 50, yPosition);
        yPosition += 15;
      }
      
      if (document.lieu_livraison) {
        doc.text(`Lieu de livraison: ${document.lieu_livraison}`, 50, yPosition);
        yPosition += 15;
      }
      
      if (document.total_poids) {
        doc.text(`Poids total: ${document.total_poids} kg`, 50, yPosition);
        yPosition += 15;
      }
    }

    return yPosition + 20;
  }

  /**
   * Ajoute le tableau des lignes PDF
   */
  _addPdfLignesTable(doc, lignes, startY = 300) {
    let yPosition = startY;

    // En-têtes du tableau
    doc.fontSize(12);
    doc.rect(50, yPosition, 500, 25).stroke();
    
    doc.text('Description', 55, yPosition + 8, { width: 200 });
    doc.text('Qté', 260, yPosition + 8, { width: 50, align: 'center' });
    doc.text('Prix U.', 315, yPosition + 8, { width: 70, align: 'center' });
    doc.text('Total HT', 390, yPosition + 8, { width: 80, align: 'center' });
    doc.text('TVA', 475, yPosition + 8, { width: 70, align: 'center' });

    yPosition += 25;

    // Lignes du tableau
    lignes.forEach((ligne, index) => {
      const hauteurLigne = 25;
      
      // Fond alterné
      if (index % 2 === 1) {
        doc.rect(50, yPosition, 500, hauteurLigne).fillAndStroke('#f0f0f0', '#000000');
      } else {
        doc.rect(50, yPosition, 500, hauteurLigne).stroke();
      }

      // Conversion sécurisée des valeurs numériques
      const prixUnitaire = parseFloat(ligne.prix_unitaire || 0);
      const totalHt = parseFloat(ligne.total_ht || 0);
      const tauxTva = parseFloat(ligne.taux_tva || 20);

      doc.fillColor('#000000')
         .text(ligne.description || '', 55, yPosition + 8, { width: 195 })
         .text(ligne.quantite?.toString() || '1', 260, yPosition + 8, { width: 50, align: 'center' })
         .text(`${prixUnitaire.toFixed(2)}€`, 315, yPosition + 8, { width: 70, align: 'center' })
         .text(`${totalHt.toFixed(2)}€`, 390, yPosition + 8, { width: 80, align: 'center' })
         .text(`${tauxTva}%`, 475, yPosition + 8, { width: 70, align: 'center' });

      yPosition += hauteurLigne;
    });

    return yPosition + 20;
  }

  /**
   * Ajoute les totaux PDF
   */
  _addPdfTotals(doc, document, startY = 500) {
    let yPosition = startY;

    // Cadre pour les totaux
    doc.rect(350, yPosition, 200, 80).stroke();

    // Conversion sécurisée des montants en nombres
    const montantHt = parseFloat(document.montant_ht || 0);
    const montantTtc = parseFloat(document.montant_ttc || 0);
    const tauxTva = parseFloat(document.taux_tva || 20);

    yPosition += 15;
    doc.fontSize(12)
       .text(`Sous-total HT: ${montantHt.toFixed(2)}€`, 360, yPosition, { align: 'right', width: 180 });

    yPosition += 20;
    const montantTva = montantTtc - montantHt;
    doc.text(`TVA (${tauxTva}%): ${montantTva.toFixed(2)}€`, 360, yPosition, { align: 'right', width: 180 });

    yPosition += 20;
    doc.fontSize(14)
       .text(`TOTAL TTC: ${montantTtc.toFixed(2)}€`, 360, yPosition, { align: 'right', width: 180 });
  }

  /**
   * Ajoute le pied de page PDF
   */
  _addPdfFooter(doc, document) {
    const yPosition = 700;

    // Ligne de séparation
    doc.moveTo(50, yPosition)
       .lineTo(550, yPosition)
       .stroke();

    doc.fontSize(10)
       .text('SIRET: 123 456 789 00012 - TVA: FR12345678901', 50, yPosition + 15)
       .text('Conditions de paiement: 30 jours net', 50, yPosition + 30);

    if (document.notes) {
      doc.text(`Notes: ${document.notes}`, 50, yPosition + 45, { width: 500 });
    }
  }
}

// Créer une instance singleton
const exportService = new ExportService();

module.exports = exportService;