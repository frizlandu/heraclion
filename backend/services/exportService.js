const xlsx = require('xlsx');
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

  /**
   * Formate un montant selon la monnaie spécifiée
   * @param {number} amount - Montant à formater
   * @param {string} currency - Code de la monnaie (USD, EUR, etc.)
   * @returns {string} Montant formaté
   */
  formatCurrency(amount, currency = 'EUR') {
    const currencySymbols = {
      'USD': '$',
      'EUR': '€',
      'CDF': 'FC',
      'CAD': 'CAD$'
    };

    const symbol = currencySymbols[currency] || currency;
    const formattedAmount = parseFloat(amount).toFixed(2);
    
    // Pour le dollar américain et canadien, le symbole va avant
    if (currency === 'USD' || currency === 'CAD') {
      return `${symbol}${formattedAmount}`;
    }
    
    // Pour l'euro et le franc congolais, le symbole va après
    return `${formattedAmount}${symbol}`;
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

      // Récupération de la configuration
      const config = pdfConfig.getConfig();
      const colors = pdfConfig.getColors();
      const margins = config.current.layout.margins;

      // Création du document PDF avec configuration personnalisée
      const doc = new PDFDocument({
        margin: margins.top,
        size: config.current.layout.pageSize
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
          // Configuration et couleurs
          const config = pdfConfig.getConfig();
          const colors = pdfConfig.getColors();
          
          // En-tête du document avec configuration
          this._addPdfHeader(doc, document, config, colors);
          
          // Informations du document
          const yPos = this._addPdfDocumentInfo(doc, document);
          
          // Tableau des lignes
          let finalYPos = yPos;
          if (lignes && lignes.length > 0) {
            finalYPos = this._addPdfLignesTable(doc, lignes, yPos, document);
          }
          
          // Totaux
          this._addPdfTotals(doc, document, finalYPos, lignes);
          
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
   * Ajoute l'en-tête du document PDF avec configuration personnalisée
   */
  _addPdfHeader(doc, document, config, colors) {
    // Utiliser les informations de l'entreprise du document, avec fallback sur la config globale
    const company = {
      name: document.entreprise_nom || config.company?.name || 'Entreprise non définie',
      address: document.entreprise_adresse || config.company?.address || '',
      phone: document.entreprise_telephone || config.company?.phone || '',
      reference: document.entreprise_reference || config.company?.reference || '',
      autres_coordonnees: document.entreprise_autres_coordonnees || config.company?.email || '',
      logo: config.company?.logo || null // Le logo reste global pour l'instant
    };
    
    const sections = config.current.sections;
    const fonts = config.current.layout.fonts;
    const margins = config.current.layout.margins;
    
    let yPosition = margins.top;
    let logoWidth = 0;

    // === FOND D'EN-TÊTE PERSONNALISÉ ===
    doc.rect(margins.left, 30, 500, 100)
       .fillAndStroke(colors.background, colors.primary);

    // === LOGO D'ENTREPRISE ===
    if (sections.header.showLogo && company.logo) {
      const logoPath = logoManager.getLogoPath(company.logo);
      if (logoPath && fs.existsSync(logoPath)) {
        try {
          const logoHeight = 60;
          logoWidth = 120;
          doc.image(logoPath, margins.left + 10, yPosition + 10, {
            width: logoWidth,
            height: logoHeight
          });
        } catch (error) {
          console.warn('Erreur chargement logo:', error.message);
          logoWidth = 0;
        }
      }
    }

    // === INFORMATIONS ENTREPRISE ===
    if (sections.header.showCompanyInfo) {
      const companyX = margins.left + logoWidth + (logoWidth > 0 ? 30 : 10);
      
      doc.fillColor(colors.primary)
         .fontSize(fonts.title.size)
         .font('Helvetica-Bold')
         .text(company.name, companyX, yPosition + 20);
         
      doc.fillColor(colors.text)
         .fontSize(fonts.small.size)
         .font('Helvetica')
         .text(`${company.address} • ${company.city}`, companyX, yPosition + 45);
      
      if (company.phone || company.email) {
        const contact = [company.phone, company.email].filter(Boolean).join(' • ');
        doc.text(contact, companyX, yPosition + 60);
      }
      
      if (company.siret || company.tva) {
        const legal = [
          company.siret ? `SIRET: ${company.siret}` : null,
          company.tva ? `TVA: ${company.tva}` : null
        ].filter(Boolean).join(' • ');
        doc.text(legal, companyX, yPosition + 75);
      }
    }

    // === INFORMATIONS DOCUMENT ===
    if (sections.header.showDocumentInfo) {
      const docTypes = config.current.texts.documentTypes;
      const typeDoc = docTypes[document.type_document] || document.type_document.toUpperCase();
      
      const docWidth = 140;
      const docHeight = 60;
      const docX = 410;
      const docY = yPosition + 15;

      // Encadré document avec couleurs du template - agrandissement pour éviter la superposition
      const adjustedDocHeight = 80; // Augmenté de 60 à 80
      doc.rect(docX, docY, docWidth, adjustedDocHeight)
         .fillAndStroke(colors.accent + '40', colors.primary);

      // Titre du document
      doc.fillColor(colors.primary)
         .fontSize(fonts.subtitle.size)
         .font('Helvetica-Bold')
         .text(typeDoc, docX + 10, docY + 12, { 
           width: docWidth - 20, 
           align: 'center' 
         });

      // Numéro du document - position ajustée pour éviter la superposition
      doc.fillColor(colors.text)
         .fontSize(fonts.header.size)
         .font('Helvetica-Bold')
         .text(document.numero, docX + 10, docY + 40, { 
           width: docWidth - 20, 
           align: 'center' 
         });

      // Dates - ajustement avec la nouvelle hauteur de l'encadré
      const dateY = docY + adjustedDocHeight + 10;
      doc.rect(docX, dateY, docWidth, 35)
         .fillAndStroke(colors.background, colors.secondary);

      doc.fillColor(colors.secondary)
         .fontSize(fonts.small.size)
         .font('Helvetica')
         .text(`Date: ${pdfConfig.formatDate(document.date_emission)}`, docX + 10, dateY + 6, { 
           width: docWidth - 20, 
           align: 'center' 
         });
         
      if (document.date_echeance) {
        doc.text(`Échéance: ${pdfConfig.formatDate(document.date_echeance)}`, docX + 10, dateY + 20, { 
           width: docWidth - 20, 
           align: 'center' 
         });
      }
    }

    // === LIGNE DE SÉPARATION ===
    const separatorY = 175; // Ajusté de 155 à 175 pour s'adapter à l'encadré agrandi
    doc.strokeColor(colors.primary)
       .lineWidth(2)
       .moveTo(margins.left, separatorY)
       .lineTo(550, separatorY)
       .stroke();

    // Réinitialiser les styles
    doc.fillColor(colors.text)
       .strokeColor(colors.text)
       .font('Helvetica')
       .lineWidth(1)
       .font('Helvetica');
  }

  /**
   * Ajoute les informations du document PDF avec une présentation améliorée
   */
  _addPdfDocumentInfo(doc, document, config, colors) {
    let yPosition = 195; // Ajusté de 175 à 195 pour s'adapter aux modifications de l'en-tête

    // Encadré pour les informations client
    const clientBoxHeight = document.client_adresse ? 80 : 60;
    doc.rect(50, yPosition, 240, clientBoxHeight)
       .fillAndStroke('#f8f9fa', '#6c757d');

    // Titre "Facturé à"
    doc.fillColor('#495057')
       .fontSize(12)
       .font('Helvetica-Bold')
       .text('FACTURÉ À', 60, yPosition + 10);

    // Informations client
    yPosition += 30;
    doc.fillColor('#212529')
       .fontSize(11)
       .font('Helvetica-Bold')
       .text(document.client_nom || 'Client non défini', 60, yPosition);
       
    if (document.client_adresse) {
      yPosition += 15;
      doc.fillColor('#6c757d')
         .font('Helvetica')
         .text(document.client_adresse, 60, yPosition);
    }
    
    if (document.client_ville) {
      yPosition += 15;
      doc.text(document.client_ville, 60, yPosition);
    }

    // Email si disponible
    if (document.client_email) {
      yPosition += 15;
      doc.fillColor('#0d6efd')
         .text(document.client_email, 60, yPosition);
    }

    // Encadré pour les informations transport si applicable
    if (document.categorie_facture === 'transport') {
      const transportY = 175;
      const transportBoxHeight = 100;
      
      doc.rect(310, transportY, 240, transportBoxHeight)
         .fillAndStroke('#fff3e0', '#ff9800');

      doc.fillColor('#e65100')
         .fontSize(12)
         .font('Helvetica-Bold')
         .text('INFORMATIONS TRANSPORT', 320, transportY + 10);

      let transportYPos = transportY + 30;
      doc.fillColor('#5d4037')
         .fontSize(10)
         .font('Helvetica');
      
      if (document.lieu_chargement) {
        doc.text(`Chargement: ${document.lieu_chargement}`, 320, transportYPos);
        transportYPos += 15;
      }
      
      if (document.lieu_livraison) {
        doc.text(`Livraison: ${document.lieu_livraison}`, 320, transportYPos);
        transportYPos += 15;
      }
      
      if (document.total_poids) {
        doc.text(`Poids total: ${document.total_poids} kg`, 320, transportYPos);
      }
    } else {
      // Encadré avec informations supplémentaires pour non-transport
      const infoY = 175;
      const infoBoxHeight = 80;
      
      doc.rect(310, infoY, 240, infoBoxHeight)
         .fillAndStroke('#e8f5e8', '#4caf50');

      doc.fillColor('#2e7d32')
         .fontSize(12)
         .font('Helvetica-Bold')
         .text('INFORMATIONS FACTURATION', 320, infoY + 10);

      let infoYPos = infoY + 30;
      doc.fillColor('#388e3c')
         .fontSize(10)
         .font('Helvetica')
         .text(`Type: ${document.categorie_facture || 'Standard'}`, 320, infoYPos);
      
      if (document.conditions_paiement) {
        infoYPos += 15;
        doc.text(`Conditions: ${document.conditions_paiement}`, 320, infoYPos);
      }
    }

    // Réinitialiser les couleurs
    doc.fillColor('#000000');

    return Math.max(yPosition, 175 + 120);
  }

  /**
   * Ajoute le tableau des lignes PDF avec pagination automatique
   */
  _addPdfLignesTable(doc, lignes, startY = 300, document) {
    // Pour les proformas, toujours utiliser le tableau simplifié
    const isTransport = document.type_document === 'facture' && document.categorie_facture === 'transport';
    const pageWidth = 500;
    const margeGauche = 50;
    const hauteurLigne = 20;
    const hauteurEnTete = 25;
    const margeBasDePage = 100; // Espace réservé pour les totaux

    // Définition des colonnes optimisées
    const colonnes = isTransport ? [
      { titre: 'Item', largeur: 30, champ: 'item', align: 'center' },
      { titre: 'Date', largeur: 35, champ: 'date_transport', isDate: true, align: 'center' },
      { titre: 'P/IMMAT', largeur: 40, champ: 'plaque_immat', align: 'center' },
      { titre: 'Désignation', largeur: 80, champ: 'description', align: 'left' },
      { titre: 'Ticket', largeur: 35, champ: 'ticket', align: 'center' },
      { titre: 'Tonne', largeur: 30, champ: 'tonnes', isNumber: true, decimales: 2, align: 'right' },
      { titre: 'T/Poids', largeur: 35, champ: 'total_poids', isNumber: true, decimales: 0, align: 'right' },
      { titre: 'P.U.', largeur: 40, champ: 'prix_unitaire', isCurrency: true, align: 'right' },
      { titre: 'Total HT', largeur: 45, champ: 'montant_ht', isCurrency: true, align: 'right' },
      { titre: 'F.Admin', largeur: 40, champ: 'frais_administratif', isCurrency: true, align: 'right' },
      { titre: 'TVA%', largeur: 25, champ: 'taux_tva', isPercent: true, align: 'center' },
      { titre: 'TVA', largeur: 35, champ: 'montant_tva', isCurrency: true, align: 'right' },
      { titre: 'Total', largeur: 50, champ: 'montant_ttc', isCurrency: true, align: 'right' }
    ] : [
      { titre: 'Description', largeur: 180, champ: 'description', align: 'left' },
      { titre: 'Qté', largeur: 40, champ: 'quantite', align: 'center' },
      { titre: 'Prix unit.', largeur: 80, champ: 'prix_unitaire', isCurrency: true, align: 'right' },
      { titre: 'TVA %', largeur: 45, champ: 'taux_tva', isPercent: true, align: 'center' },
      { titre: 'Total HT', largeur: 80, champ: 'montant_ht', isCurrency: true, align: 'right' }
    ];

    // Ajuster les largeurs proportionnellement
    const totalWidth = colonnes.reduce((sum, col) => sum + col.largeur, 0);
    if (totalWidth > pageWidth) {
      const factor = pageWidth / totalWidth;
      colonnes.forEach(col => {
        col.largeur = Math.floor(col.largeur * factor);
      });
    }

    const largeurTotale = colonnes.reduce((sum, col) => sum + col.largeur, 0);
    let yPosition = startY;
    let pageNumber = 1;

    // Fonction pour dessiner l'en-tête du tableau
    const dessinerEnTete = (y) => {
      doc.fontSize(9).font('Helvetica-Bold');
      
      // Fond d'en-tête
      doc.rect(margeGauche, y, largeurTotale, hauteurEnTete)
         .fillAndStroke('#4a90e2', '#2171b5');
      
      // Textes d'en-tête
      doc.fillColor('#ffffff');
      let xPosition = margeGauche;
      colonnes.forEach(colonne => {
        doc.text(colonne.titre, xPosition + 2, y + 8, { 
          width: colonne.largeur - 4, 
          align: 'center' 
        });
        xPosition += colonne.largeur;
      });
      
      return y + hauteurEnTete;
    };

    // Fonction pour vérifier si on doit changer de page
    const verifierNouvellePage = (yActuel) => {
      const hauteurPage = doc.page.height;
      if (yActuel + hauteurLigne + margeBasDePage > hauteurPage) {
        // Ajouter le numéro de page en bas
        doc.fillColor('#6c757d')
           .fontSize(8)
           .text(`Page ${pageNumber}`, margeGauche, hauteurPage - 30, {
             width: largeurTotale,
             align: 'center'
           });
        
        // Nouvelle page
        doc.addPage();
        pageNumber++;
        
        // Réinitialiser la position Y et redessiner l'en-tête
        const nouvelleY = 50;
        return dessinerEnTete(nouvelleY);
      }
      return yActuel;
    };

    // Dessiner l'en-tête initial
    yPosition = dessinerEnTete(yPosition);

    // Traiter chaque ligne avec pagination
    lignes.forEach((ligne, index) => {
      // Vérifier si on a besoin d'une nouvelle page
      yPosition = verifierNouvellePage(yPosition);
      
      // Fond alterné avec bordures
      if (index % 2 === 1) {
        doc.rect(margeGauche, yPosition, largeurTotale, hauteurLigne)
           .fillAndStroke('#f8f9fa', '#dee2e6');
      } else {
        doc.rect(margeGauche, yPosition, largeurTotale, hauteurLigne)
           .fillAndStroke('#ffffff', '#dee2e6');
      }

      // Contenu des cellules
      doc.fillColor('#212529').fontSize(8).font('Helvetica');
      let xPosition = margeGauche;
      
      colonnes.forEach(colonne => {
        let valeur = ligne[colonne.champ] || '';
        let couleurTexte = '#212529';
        let fontStyle = 'Helvetica';
        
        // Formatage selon le type de données
        if (colonne.isDate && valeur) {
          valeur = new Date(valeur).toLocaleDateString('fr-FR');
        } else if (colonne.isNumber && valeur) {
          const nombre = parseFloat(valeur);
          valeur = nombre.toFixed(colonne.decimales || 0);
          fontStyle = 'Helvetica-Bold';
          couleurTexte = '#0d6efd';
        } else if (colonne.isCurrency && valeur) {
          const montant = parseFloat(valeur);
          // Forcer l'affichage en dollars pour tous les PDFs
          valeur = this.formatCurrency(montant, 'USD');
          fontStyle = 'Helvetica-Bold';
          couleurTexte = '#198754';
        } else if (colonne.isPercent) {
          const pourcent = parseFloat(valeur || 0);
          valeur = `${pourcent}%`;
          couleurTexte = '#fd7e14';
        } else if (!valeur && colonne.champ === 'quantite') {
          valeur = '1';
        }

        // Appliquer le style
        doc.fillColor(couleurTexte).font(fontStyle);

        // Alignement
        const alignement = colonne.align || 
          (colonne.isCurrency || colonne.isNumber ? 'right' : 
           colonne.isPercent ? 'center' : 'left');

        doc.text(valeur.toString(), xPosition + 3, yPosition + 6, { 
          width: colonne.largeur - 6, 
          align: alignement,
          ellipsis: true
        });
        
        xPosition += colonne.largeur;
      });

      yPosition += hauteurLigne;
    });

    // Ajouter le numéro de page final si nécessaire
    if (pageNumber > 1) {
      const hauteurPage = doc.page.height;
      doc.fillColor('#6c757d')
         .fontSize(8)
         .text(`Page ${pageNumber}`, margeGauche, hauteurPage - 30, {
           width: largeurTotale,
           align: 'center'
         });
    }

    return yPosition + 20;
  }

  /**
   * Ajoute les totaux PDF avec présentation améliorée
   */
  _addPdfTotals(doc, document, startY = 500, lignes = []) {
    // Calcul des totaux comme dans FactureView.js
    const lignesData = lignes || [];
    const totaux = (lignesData && lignesData.length > 0) 
      ? lignesData.reduce((acc, ligne) => {
          acc.total_ht += parseFloat(ligne.montant_ht) || 0;
          acc.total_tva += parseFloat(ligne.montant_tva) || 0;
          acc.total_ttc += parseFloat(ligne.montant_ttc) || 0;
          return acc;
        }, { total_ht: 0, total_tva: 0, total_ttc: 0 })
      : {
          total_ht: parseFloat(document.montant_ht) || 0,
          total_tva: parseFloat(document.montant_tva) || 0,
          total_ttc: parseFloat(document.montant_total || document.montant_ttc) || 0
        };

    let yPosition = startY + 20;
    const largeurTotaux = 220;
    const xTotaux = 330;

    // Titre de section
    doc.fillColor('#495057')
       .fontSize(14)
       .font('Helvetica-Bold')
       .text('RÉCAPITULATIF', xTotaux, yPosition - 5);

    yPosition += 20;

    // Encadré principal pour les totaux
    doc.rect(xTotaux, yPosition, largeurTotaux, 90)
       .fillAndStroke('#f8f9fa', '#6c757d');

    // Ligne Total HT
    yPosition += 15;
    doc.rect(xTotaux + 10, yPosition, largeurTotaux - 20, 18)
       .fillAndStroke('#e9ecef', '#adb5bd');
    
    doc.fillColor('#495057')
       .fontSize(11)
       .font('Helvetica')
       .text('Total HT:', xTotaux + 15, yPosition + 5);
    
    // Forcer l'affichage en dollars pour tous les PDFs
    doc.fillColor('#198754')
       .font('Helvetica-Bold')
       .text(this.formatCurrency(totaux.total_ht, 'USD'), xTotaux + 15, yPosition + 5, { 
         width: largeurTotaux - 30, 
         align: 'right' 
       });

    // Ligne Total TVA
    yPosition += 22;
    doc.rect(xTotaux + 10, yPosition, largeurTotaux - 20, 18)
       .fillAndStroke('#fff3cd', '#ffc107');
    
    doc.fillColor('#856404')
       .fontSize(11)
       .font('Helvetica')
       .text('Total TVA:', xTotaux + 15, yPosition + 5);
    
    doc.fillColor('#fd7e14')
       .font('Helvetica-Bold')
       .text(this.formatCurrency(totaux.total_tva, 'USD'), xTotaux + 15, yPosition + 5, { 
         width: largeurTotaux - 30, 
         align: 'right' 
       });

    // Ligne Total TTC (mise en valeur)
    yPosition += 22;
    doc.rect(xTotaux + 10, yPosition, largeurTotaux - 20, 25)
       .fillAndStroke('#d1ecf1', '#0dcaf0');
    
    doc.fillColor('#055160')
       .fontSize(14)
       .font('Helvetica-Bold')
       .text('TOTAL TTC:', xTotaux + 15, yPosition + 8);
    
    doc.fillColor('#dc3545')
       .fontSize(16)
       .text(this.formatCurrency(totaux.total_ttc, 'USD'), xTotaux + 15, yPosition + 8, { 
         width: largeurTotaux - 30, 
         align: 'right' 
       });

    // Petite note de bas
    yPosition += 35;
    const currencyName = 'dollars américains'; // Toujours en dollars
    doc.fillColor('#6c757d')
       .fontSize(8)
       .font('Helvetica-Oblique')
       .text(`Prix en ${currencyName} TTC`, xTotaux + 15, yPosition, { 
         width: largeurTotaux - 30, 
         align: 'center' 
       });

    // Réinitialiser les styles
    doc.fillColor('#000000')
       .font('Helvetica');
  }

  /**
   * Ajoute le pied de page PDF avec style amélioré
   */
  _addPdfFooter(doc, document) {
    const config = pdfConfig.getConfig();
    
    // Utiliser les informations de l'entreprise du document
    const company = {
      name: document.entreprise_nom || config.company?.name || 'Entreprise non définie',
      reference: document.entreprise_reference || config.company?.reference || 'REF non définie'
    };
    
    const hauteurPage = doc.page.height;
    const yPosition = hauteurPage - 120;

    // Ligne de séparation stylisée
    doc.strokeColor('#4a90e2')
       .lineWidth(2)
       .moveTo(50, yPosition)
       .lineTo(550, yPosition)
       .stroke();

    // Encadré pour les notes si présentes
    if (document.notes && document.notes.trim()) {
      const notesY = yPosition + 10;
      doc.rect(50, notesY, 500, 30)
         .fillAndStroke('#fff3e0', '#ff9800');
      
      doc.fillColor('#e65100')
         .fontSize(10)
         .font('Helvetica-Bold')
         .text('Notes:', 60, notesY + 5);
      
      doc.fillColor('#5d4037')
         .fontSize(9)
         .font('Helvetica')
         .text(document.notes, 60, notesY + 18, { 
           width: 480, 
           ellipsis: true 
         });
    }

    // Informations légales dans un encadré
    const legalY = yPosition + (document.notes ? 50 : 15);
    doc.rect(50, legalY, 500, 40)
       .fillAndStroke('#f8f9fa', '#6c757d');

    // Informations entreprise
    const refNumber = company.reference || 'N/A';
    doc.fillColor('#495057')
       .fontSize(9)
       .font('Helvetica')
       .text(company.name, 60, legalY + 8)
       .text(`REF: ${refNumber}`, 200, legalY + 8)
       .text(`TEL: ${company.telephone || 'N/A'}`, 350, legalY + 8);

    // Conditions de paiement
    doc.fillColor('#6c757d')
       .fontSize(8)
       .text('Conditions de paiement: 30 jours net • Pénalités de retard: 3 fois le taux légal', 60, legalY + 25, {
         width: 480,
         align: 'center'
       });

    // Réinitialiser les styles
    doc.fillColor('#000000')
       .strokeColor('#000000')
       .lineWidth(1)
       .font('Helvetica');
  }
}

// Créer une instance singleton
const exportService = new ExportService();

module.exports = exportService;