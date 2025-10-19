/**
 * Routes API pour la gestion de la configuration PDF
 */
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { logger } = require('../middleware/logger');
const pdfConfig = require('../config/pdfConfig');
const logoManager = require('../services/logoManager');

const router = express.Router();

// Configuration multer pour l'upload de logos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const logoDir = path.join(__dirname, '..', 'public', 'logos');
    if (!fs.existsSync(logoDir)) {
      fs.mkdirSync(logoDir, { recursive: true });
    }
    cb(null, logoDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 2 * 1024 * 1024 // 2MB max
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Seuls les fichiers PNG, JPG et JPEG sont autorisés'));
    }
  }
});

/**
 * @swagger
 * /api/v1/pdf-config:
 *   get:
 *     tags: [Configuration PDF]
 *     summary: Récupère la configuration PDF actuelle
 *     responses:
 *       200:
 *         description: Configuration récupérée avec succès
 */
router.get('/', (req, res) => {
  try {
    const config = pdfConfig.getConfig();
    const templates = Object.keys(config.templates).map(key => ({
      id: key,
      name: config.templates[key].name,
      description: config.templates[key].description,
      colors: config.templates[key].colors
    }));

    res.json({
      success: true,
      data: {
        currentTemplate: config.current.template,
        templates,
        company: config.company,
        sections: config.current.sections,
        formatting: config.current.formatting,
        texts: config.current.texts
      }
    });
  } catch (error) {
    logger.error('Erreur récupération config PDF:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de la configuration'
    });
  }
});

/**
 * @swagger
 * /api/v1/pdf-config:
 *   put:
 *     tags: [Configuration PDF]
 *     summary: Met à jour la configuration PDF
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 */
router.put('/', (req, res) => {
  try {
    const { template, company, sections, formatting, texts } = req.body;

    // Mettre à jour le template si fourni
    if (template && pdfConfig.setTemplate(template)) {
      logger.info(`Template PDF changé vers: ${template}`);
    }

    // Mettre à jour les informations entreprise
    if (company) {
      pdfConfig.updateCompany(company);
      logger.info('Informations entreprise mises à jour');
    }

    // Mettre à jour les sections
    if (sections) {
      pdfConfig.updateConfig({ sections });
      logger.info('Sections PDF mises à jour');
    }

    // Mettre à jour le formatage
    if (formatting) {
      pdfConfig.updateConfig({ formatting });
      logger.info('Formatage PDF mis à jour');
    }

    // Mettre à jour les textes
    if (texts) {
      pdfConfig.updateConfig({ texts });
      logger.info('Textes PDF mis à jour');
    }

    // Sauvegarder la configuration
    const configPath = path.join(__dirname, '..', 'config', 'pdf-config-user.json');
    pdfConfig.saveToFile(configPath);

    res.json({
      success: true,
      message: 'Configuration mise à jour avec succès',
      data: {
        currentTemplate: pdfConfig.getConfig().current.template,
        colors: pdfConfig.getColors()
      }
    });

  } catch (error) {
    logger.error('Erreur mise à jour config PDF:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour de la configuration'
    });
  }
});

/**
 * @swagger
 * /api/v1/pdf-config/templates:
 *   get:
 *     tags: [Configuration PDF]
 *     summary: Liste tous les templates disponibles
 */
router.get('/templates', (req, res) => {
  try {
    const config = pdfConfig.getConfig();
    const templates = Object.entries(config.templates).map(([key, template]) => ({
      id: key,
      name: template.name,
      description: template.description,
      colors: template.colors,
      isActive: config.current.template === key
    }));

    res.json({
      success: true,
      data: templates
    });
  } catch (error) {
    logger.error('Erreur récupération templates:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des templates'
    });
  }
});

/**
 * @swagger
 * /api/v1/pdf-config/templates/{templateId}:
 *   put:
 *     tags: [Configuration PDF]
 *     summary: Active un template spécifique
 */
router.put('/templates/:templateId', (req, res) => {
  try {
    const { templateId } = req.params;

    if (pdfConfig.setTemplate(templateId)) {
      // Sauvegarder la configuration
      const configPath = path.join(__dirname, '..', 'config', 'pdf-config-user.json');
      pdfConfig.saveToFile(configPath);

      logger.info(`Template activé: ${templateId}`);
      
      res.json({
        success: true,
        message: `Template "${templateId}" activé avec succès`,
        data: {
          currentTemplate: templateId,
          colors: pdfConfig.getColors()
        }
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Template non trouvé'
      });
    }
  } catch (error) {
    logger.error('Erreur activation template:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'activation du template'
    });
  }
});

/**
 * @swagger
 * /api/v1/pdf-config/logos:
 *   get:
 *     tags: [Configuration PDF]
 *     summary: Liste tous les logos disponibles
 */
router.get('/logos', (req, res) => {
  try {
    const logos = logoManager.getAvailableLogos();
    const recommendations = logoManager.getRecommendedDimensions();

    res.json({
      success: true,
      data: {
        logos: logos.map(logo => ({
          ...logo,
          url: `/logos/${logo.filename}`
        })),
        recommendations,
        currentLogo: pdfConfig.getConfig().company.logo
      }
    });
  } catch (error) {
    logger.error('Erreur récupération logos:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des logos'
    });
  }
});

/**
 * @swagger
 * /api/v1/pdf-config/logos/upload:
 *   post:
 *     tags: [Configuration PDF]
 *     summary: Upload un nouveau logo
 */
router.post('/logos/upload', upload.single('logo'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Aucun fichier fourni'
      });
    }

    const logoInfo = {
      name: path.basename(req.file.filename, path.extname(req.file.filename)),
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      sizeKB: Math.round(req.file.size / 1024),
      url: `/logos/${req.file.filename}`
    };

    logger.info(`Logo uploadé: ${req.file.filename} (${logoInfo.sizeKB}KB)`);

    res.json({
      success: true,
      message: 'Logo uploadé avec succès',
      data: logoInfo
    });

  } catch (error) {
    logger.error('Erreur upload logo:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'upload du logo'
    });
  }
});

/**
 * @swagger
 * /api/v1/pdf-config/logos/{filename}:
 *   delete:
 *     tags: [Configuration PDF]
 *     summary: Supprime un logo
 */
router.delete('/logos/:filename', (req, res) => {
  try {
    const { filename } = req.params;
    const result = logoManager.removeLogo(filename);

    if (result.success) {
      // Si c'était le logo actuel, le retirer de la config
      const config = pdfConfig.getConfig();
      if (config.company.logo === filename) {
        pdfConfig.updateCompany({ logo: null });
      }

      logger.info(`Logo supprimé: ${filename}`);
      res.json({
        success: true,
        message: result.message
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.error
      });
    }
  } catch (error) {
    logger.error('Erreur suppression logo:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression du logo'
    });
  }
});

/**
 * @swagger
 * /api/v1/pdf-config/logos/{filename}/activate:
 *   put:
 *     tags: [Configuration PDF]
 *     summary: Active un logo pour l'entreprise
 */
router.put('/logos/:filename/activate', (req, res) => {
  try {
    const { filename } = req.params;

    if (logoManager.logoExists(filename)) {
      pdfConfig.updateCompany({ logo: filename });
      
      // Sauvegarder la configuration
      const configPath = path.join(__dirname, '..', 'config', 'pdf-config-user.json');
      pdfConfig.saveToFile(configPath);

      logger.info(`Logo activé: ${filename}`);
      
      res.json({
        success: true,
        message: 'Logo activé avec succès',
        data: {
          currentLogo: filename
        }
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Logo non trouvé'
      });
    }
  } catch (error) {
    logger.error('Erreur activation logo:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'activation du logo'
    });
  }
});

/**
 * @swagger
 * /api/v1/pdf-config/preview:
 *   post:
 *     tags: [Configuration PDF]
 *     summary: Génère un PDF d'aperçu avec la configuration actuelle
 */
router.post('/preview', async (req, res) => {
  try {
    // Importer les services nécessaires
    const { generateDocumentPdf } = require('../services/exportService');

    // Données de test pour l'aperçu
    const mockDocument = {
      id: 'PREVIEW-001',
      type: 'facture',
      numero: 'F-2024-001',
      date_creation: new Date().toISOString().split('T')[0],
      client: {
        nom: 'Client Test SARL',
        adresse: '123 Rue de Test',
        ville: '13000 Marseille',
        email: 'client@test.fr',
        telephone: '04.XX.XX.XX.XX'
      },
      montant_total: 1250.00,
      montant_ht: 1041.67,
      tva: 208.33,
      statut: 'validee',
      articles: [
        {
          designation: 'Service de transport - Marseille/Lyon',
          quantite: 2,
          prix_unitaire: 500.00,
          montant: 1000.00
        },
        {
          designation: 'Frais de manutention',
          quantite: 1,
          prix_unitaire: 250.00,
          montant: 250.00
        }
      ]
    };

    // Générer le PDF avec la configuration actuelle
    const pdfBuffer = await generateDocumentPdf(mockDocument);

    // Définir les headers pour le téléchargement
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=apercu-document.pdf');
    res.setHeader('Content-Length', pdfBuffer.length);

    res.send(pdfBuffer);
  } catch (error) {
    logger.error('Erreur génération aperçu:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la génération de l\'aperçu PDF',
      error: error.message
    });
  }
});

module.exports = router;