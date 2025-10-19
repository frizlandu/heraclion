/**
 * Routes pour la gestion des documents
 */
const express = require('express');
const router = express.Router();
const BaseModel = require('../models/BaseModel');
const Document = require('../models/Document');
const { logger } = require('../utils/logger');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const fsSync = require('fs');

// upload directory and helper fsSync already handled below in the original configuration

// Configuration Multer pour les uploads de documents (utilisé par la route /upload)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '..', 'public', 'uploads', 'documents');
    // créer le dossier si nécessaire (utilise fs.promises)
    fs.mkdir(uploadDir, { recursive: true })
      .then(() => cb(null, uploadDir))
      .catch((err) => cb(err));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '';
    const name = file.fieldname + '-' + Date.now() + ext;
    cb(null, name);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (req, file, cb) => {
    const allowed = /pdf|jpeg|jpg|png|doc|docx|xls|xlsx/;
    const extOk = allowed.test(path.extname(file.originalname).toLowerCase());
    const mimeOk = allowed.test((file.mimetype || '').toLowerCase());
    if (extOk || mimeOk) return cb(null, true);
    cb(new Error('Type de fichier non autorisé'));
  }
});

/**
 * @swagger
 * /api/v1/documents/{id}/convert-to-facture:
 *   post:
 *     summary: Convertit un proforma en facture
 *     tags: [Documents]
 */
router.post('/:id/convert-to-facture', async (req, res) => {
  try {
    const { id } = req.params;
    const proforma = await Document.findById(id);
    if (!proforma) return res.status(404).json({ success: false, message: 'Proforma non trouvé' });
    if (proforma.type_document !== 'proforma') return res.status(400).json({ success: false, message: 'Ce document n\'est pas un proforma' });

    const currentYear = new Date().getFullYear();
    const existingFactures = await Document.query('SELECT COUNT(*) as count FROM documents WHERE type_document = $1 AND EXTRACT(YEAR FROM created_at) = $2', ['facture', currentYear]);
    const nextNumber = (parseInt(existingFactures.rows[0].count) + 1).toString().padStart(4, '0');
    const numeroFacture = `FAC${currentYear}${nextNumber}`;

    const LigneDocument = new BaseModel('lignes_documents');
    const lignes = await LigneDocument.query('SELECT * FROM lignes_documents WHERE document_id = $1 ORDER BY ordre ASC', [id]);

    const factureData = {
      numero: numeroFacture,
      type_document: 'facture',
      client_id: proforma.client_id,
      entreprise_id: proforma.entreprise_id,
      date_emission: new Date(),
      date_echeance: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      statut: 'emise',
      montant_ht: proforma.montant_ht,
      montant_tva: proforma.montant_tva,
      taux_tva: proforma.taux_tva,
      montant_ttc: proforma.montant_ttc,
      remise_globale: proforma.remise_globale,
      conditions_paiement: proforma.conditions_paiement,
      notes: proforma.notes,
      facture_originale_id: null,
      created_at: new Date(),
      updated_at: new Date()
    };

    const facture = await Document.create(factureData);

    for (const ligne of lignes.rows) {
      const ligneFactureData = {
        document_id: facture.id,
        description: ligne.description,
        quantite: ligne.quantite,
        prix_unitaire: ligne.prix_unitaire,
        taux_tva: ligne.taux_tva,
        montant_ht: ligne.montant_ht,
        montant_tva: ligne.montant_tva,
        montant_ttc: ligne.montant_ttc,
        ordre: ligne.ordre,
        item: ligne.item,
        date_transport: ligne.date_transport,
        plaque_immat: ligne.plaque_immat,
        ticket: ligne.ticket,
        tonnes: ligne.tonnes,
        total_poids: ligne.total_poids,
        frais_administratif: ligne.frais_administratif,
        unite: ligne.unite,
        created_at: new Date(),
        updated_at: new Date()
      };
      await LigneDocument.create(ligneFactureData);
    }

    await Document.update(id, { statut: 'converti' });

    res.json({ success: true, data: facture, message: `Proforma converti en facture ${numeroFacture}` });
  } catch (error) {
    logger.error('Erreur lors de la conversion du proforma en facture:', error);
    res.status(500).json({ success: false, message: 'Erreur interne du serveur', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
});

/**
 * Dupliquer un document
 */
router.post('/:id/duplicate', async (req, res) => {
  try {
    const { id } = req.params;
    const { type_document } = req.body;
    const originalDoc = await Document.findById(id);
    if (!originalDoc) return res.status(404).json({ success: false, message: 'Document non trouvé' });

    const duplicateData = {
      ...originalDoc,
      numero: `${type_document?.toUpperCase() || 'DOC'}-${Date.now()}`,
      type_document: type_document || originalDoc.type_document,
      statut: type_document === 'facture' ? 'emise' : 'brouillon',
    // (kept single formatFileSize and module.exports at bottom of file)
      facture_originale_id: null,
      created_at: new Date(),
      updated_at: new Date()
    };
    delete duplicateData.id;

    const duplicate = await Document.create(duplicateData);
    const LigneDocument = new BaseModel('lignes_documents');
    const lignes = await LigneDocument.query('SELECT * FROM lignes_documents WHERE document_id = $1 ORDER BY ordre ASC', [id]);
    for (const ligne of lignes.rows) {
      const ligneDuplicateData = {
        document_id: duplicate.id,
        description: ligne.description,
        quantite: ligne.quantite,
        prix_unitaire: ligne.prix_unitaire,
        taux_tva: ligne.taux_tva,
        montant_ht: ligne.montant_ht,
        montant_tva: ligne.montant_tva,
        montant_ttc: ligne.montant_ttc,
        ordre: ligne.ordre,
        item: ligne.item,
        date_transport: ligne.date_transport,
        plaque_immat: ligne.plaque_immat,
        ticket: ligne.ticket,
        tonnes: ligne.tonnes,
        total_poids: ligne.total_poids,
        frais_administratif: ligne.frais_administratif,
        unite: ligne.unite,
        created_at: new Date(),
        updated_at: new Date()
      };
      await LigneDocument.create(ligneDuplicateData);
    }

    res.json({ success: true, data: duplicate, message: `Document dupliqué avec le numéro ${duplicate.numero}` });
  } catch (error) {
    logger.error('Erreur lors de la duplication du document:', error);
    res.status(500).json({ success: false, message: 'Erreur interne du serveur', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
});

/**
 * Générer un numéro de proforma basé sur l'entreprise
 */
router.post('/generate-number', async (req, res) => {
  try {
    const { entreprise_id, type_document = 'proforma' } = req.body;
    if (!entreprise_id) return res.status(400).json({ success: false, message: 'L\'ID de l\'entreprise est requis' });

    const Entreprise = new BaseModel('entreprises');
    const entreprise = await Entreprise.findById(entreprise_id);
    if (!entreprise) return res.status(404).json({ success: false, message: 'Entreprise non trouvée' });

    const prefix = entreprise.prefix_facture || 'DOC';
    const countResult = await Document.query('SELECT COUNT(*) as count FROM documents WHERE entreprise_id = $1 AND type_document = $2', [entreprise_id, type_document]);
    const count = parseInt(countResult.rows[0].count) || 0;

    const today = new Date();
    const dateStr = today.getFullYear() + (today.getMonth() + 1).toString().padStart(2, '0') + today.getDate().toString().padStart(2, '0');
    const typePrefix = type_document === 'proforma' ? 'PRF' : type_document === 'facture' ? 'FAC' : 'DOC';
    const numero = `${prefix}-${typePrefix}-${dateStr}-${(count + 1).toString().padStart(4, '0')}`;

    res.json({ success: true, data: { numero, prefix, entreprise_nom: entreprise.nom, count: count + 1 } });
  } catch (error) {
    logger.error('Erreur lors de la génération du numéro:', error);
    res.status(500).json({ success: false, message: 'Erreur interne du serveur', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
});

// Fonction utilitaire pour formater la taille des fichiers
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * @swagger
 * /api/v1/documents/{id}:
 *   get:
 *     summary: Récupère un document par son ID
 *     tags: [Documents]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID du document
 *     responses:
 *       200:
 *         description: Document récupéré avec succès
 *       404:
 *         description: Document non trouvé
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({
        success: false,
        message: 'ID invalide'
      });
    }
    
    const document = await Document.findById(parseInt(id));
    
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document non trouvé'
      });
    }
    
    // Enrichir avec des informations supplémentaires
    const documentEnrichi = { ...document };
    
    // Informations sur la taille
    if (document.taille_fichier) {
      documentEnrichi.taille_humaine = formatFileSize(document.taille_fichier);
    }
    
    // Vérifier l'existence du fichier
    if (document.chemin_fichier) {
      try {
        await fs.access(document.chemin_fichier);
        documentEnrichi.fichier_existe = true;
      } catch {
        documentEnrichi.fichier_existe = false;
      }
    }
    
    // Récupérer les informations du client si client_id existe
    if (document.client_id) {
      try {
        const Client = new BaseModel('clients');
        const client = await Client.findById(document.client_id);
        if (client) {
          documentEnrichi.client_nom = client.nom;
          documentEnrichi.client_prenom = client.prenom;
          documentEnrichi.client_email = client.email;
          documentEnrichi.client_adresse = client.adresse;
          documentEnrichi.client_telephone = client.telephone;
          documentEnrichi.client_nom_complet = client.prenom && client.nom 
            ? `${client.prenom} ${client.nom}` 
            : client.nom || client.raison_sociale || 'Client inconnu';
        }
      } catch (error) {
        logger.warn(`Impossible de récupérer le client ${document.client_id}:`, error.message);
      }
    }
    
    // Récupérer les lignes du document si c'est une facture/devis
    if (['facture', 'devis', 'proforma'].includes(document.type_document)) {
      try {
        // Test si la table existe
        const testQuery = `SELECT COUNT(*) FROM lignes_documents WHERE document_id = $1`;
        console.log(`Backend - Test requête lignes pour document ${id}:`, testQuery);
        
        const LigneDocument = new BaseModel('lignes_documents');
        const lignes = await LigneDocument.findAll('document_id = $1', [parseInt(id)]);
        console.log(`Backend - Lignes trouvées pour document ${id}:`, lignes?.length, lignes);
        documentEnrichi.lignes = lignes || [];
      } catch (error) {
        console.error(`ERREUR DÉTAILLÉE récupération lignes document ${id}:`, {
          message: error.message,
          stack: error.stack,
          code: error.code
        });
        logger.warn(`Impossible de récupérer les lignes du document ${id}:`, error.message);
        documentEnrichi.lignes = [];
      }
    }
    
    console.log(`Backend - Document enrichi pour ${id}:`, {
      type: document.type_document,
      description: documentEnrichi.description,
      lignes: documentEnrichi.lignes?.length || 0,
      montant_ttc: documentEnrichi.montant_ttc
    });
    
  // Mapper les champs pour correspondre aux attentes du frontend
  documentEnrichi.montant_total = document.montant_ttc;
  // Assurer la compatibilité description <-> notes
  documentEnrichi.description = documentEnrichi.description || documentEnrichi.notes || null;
    
    logger.info(`Récupération du document ${document.nom_fichier} (ID: ${id})`);
    
    res.json({
      success: true,
      data: documentEnrichi
    });
    
  } catch (error) {
    logger.error('Erreur lors de la récupération du document:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @swagger
 * /api/v1/documents:
 *   post:
 *     summary: Créer un nouveau document
 *     tags: [Documents]
/**
 * @swagger
 * /api/v1/documents:
 *   post:
 *     summary: Créer un nouveau document
 *     tags: [Documents]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type_document
 *               - numero
 *               - client_id
 *               - date_emission
 *               - montant_ht
 *               - taux_tva
 *               - montant_ttc
 *             properties:
 *               type_document:
 *                 type: string
 *                 enum: [facture, proforma, devis]
 *               numero:
 *                 type: string
 *               client_id:
 *                 type: integer
 *               entreprise_id:
 *                 type: integer
 *               date_emission:
 *                 type: string
 *                 format: date
 *               date_echeance:
 *                 type: string
 *                 format: date
 *               montant_ht:
 *                 type: number
 *               taux_tva:
 *                 type: number
 *               montant_ttc:
 *                 type: number
 *               statut:
 *                 type: string
 *                 enum: [brouillon, validé, envoyé, payé, annulé]
 *               notes:
 *                 type: string
 *               total_poids:
 *                 type: number
 *               lignes:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       201:
 *         description: Document créé avec succès
 *       400:
 *         description: Erreur de validation
 *       500:
 *         description: Erreur interne du serveur
 */
router.post('/', async (req, res) => {
  try {
    const requestData = req.body;
    
    // Validation des données requises
    if (!requestData.type_document || !requestData.numero || !requestData.client_id) {
      return res.status(400).json({
        success: false,
        message: 'Les champs type_document, numero et client_id sont requis'
      });
    }

    // Filtrer les données pour ne garder que les colonnes valides de la table documents
      const colCheck = await Document.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'description' LIMIT 1");
      const hasDescriptionCol = colCheck && colCheck.rowCount > 0;

      const validColumns = [
        'numero', 'type_document', 'client_id', 'entreprise_id',
        'date_emission', 'date_echeance', 'statut',
        'montant_ht', 'montant_tva', 'taux_tva', 'montant_ttc',
        'remise_globale', 'conditions_paiement', 'notes', /* description may or may not exist */ 'pdf_path',
        'facture_originale_id', 'created_by', 'categorie_facture', 'monnaie'
      ];

    // Créer un nouvel objet propre avec seulement les colonnes valides
    const documentData = {};
    validColumns.forEach(column => {
      if (requestData[column] !== undefined && requestData[column] !== null) {
        let value = requestData[column];
        
        // Convertir les IDs en integers
        if (['client_id', 'entreprise_id', 'facture_originale_id', 'created_by'].includes(column)) {
          value = parseInt(value, 10);
          if (isNaN(value)) {
            return; // Skip cette valeur si conversion échoue
          }
        }
        
        // Convertir les montants en float
        if (['montant_ht', 'montant_tva', 'taux_tva', 'montant_ttc', 'remise_globale'].includes(column)) {
          value = parseFloat(value);
          if (isNaN(value)) {
            return; // Skip cette valeur si conversion échoue
          }
        }
        
        documentData[column] = value;
      }
    });

    console.log('Données reçues:', Object.keys(requestData));
    console.log('Données filtrées:', Object.keys(documentData));

    // Ajouter les métadonnées
    documentData.created_at = new Date();
    documentData.updated_at = new Date();
    
    // Si pas de statut défini, mettre par défaut 'brouillon'
    if (!documentData.statut) {
      documentData.statut = 'brouillon';
    }

    // Calculer montant_tva si manquant
    if (documentData.montant_ht && documentData.taux_tva && !documentData.montant_tva) {
      documentData.montant_tva = (documentData.montant_ht * documentData.taux_tva) / 100;
    }

    // Debug: Afficher les données filtrées
    console.log('Données filtrées pour la DB:', documentData);
    console.log('Clés de documentData:', Object.keys(documentData));

    // Créer le document
    console.log('Tentative de création du document avec les données:', documentData);
    const document = await Document.create(documentData);
    console.log('✅ Document créé avec succès, ID:', document.id);
    
    // Traiter les lignes de document si elles existent
    if (requestData.lignes && Array.isArray(requestData.lignes) && requestData.lignes.length > 0) {
      console.log(`Création de ${requestData.lignes.length} lignes pour le document ${document.id}`);
      
      const LigneDocument = new BaseModel('lignes_documents');
      
      for (const ligne of requestData.lignes) {
        const ligneData = {
          document_id: document.id,
          description: ligne.description || '',
          quantite: parseFloat(ligne.quantite) || 1,
          prix_unitaire: parseFloat(ligne.prix_unitaire) || 0,
          taux_tva: parseFloat(ligne.taux_tva) || 0,
          montant_ht: parseFloat(ligne.montant_ht) || 0,
          montant_tva: parseFloat(ligne.montant_tva) || 0,
          montant_ttc: parseFloat(ligne.montant_ttc) || 0,
          ordre: ligne.ordre || 0,
          // Nouveaux champs ajoutés par la migration
          item: ligne.item || '',
          date_transport: ligne.date_transport || null,
          plaque_immat: ligne.plaque_immat || '',
          ticket: ligne.ticket || '',
          tonnes: parseFloat(ligne.tonnes) || 0,
          total_poids: parseFloat(ligne.total_poids) || 0,
          frais_administratif: parseFloat(ligne.frais_administratif) || 0,
          unite: ligne.unite || '',
          created_at: new Date(),
          updated_at: new Date()
        };
        
        console.log('Création ligne:', ligneData);
        await LigneDocument.create(ligneData);
      }
      
      console.log(`✅ ${requestData.lignes.length} lignes créées pour le document ${document.id}`);
    } else {
      console.log('Aucune ligne à créer pour ce document');
    }
    
    logger.info(`Document créé avec succès (ID: ${document.id})`);
    
    console.log('✅ Envoi de la réponse de succès');
    res.status(201).json({
      success: true,
      data: document,
      message: 'Document créé avec succès'
    });
    
  } catch (error) {
    console.error('❌ Erreur lors de la création du document:', {
      message: error.message,
      stack: error.stack,
      code: error.code
    });
    logger.error('Erreur lors de la création du document:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création du document',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @swagger
 * /api/v1/documents/upload:
 *   post:
 *     summary: Upload un nouveau document
 *     tags: [Documents]
 *     consumes:
 *       - multipart/form-data
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *               - type_document
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Fichier à uploader
 *               type_document:
 *                 type: string
 *                 enum: [facture, devis, bon_commande, bon_livraison, contrat, autre]
 *               client_id:
 *                 type: integer
 *               entreprise_id:
 *                 type: integer
 *               description:
 *                 type: string
 *               tags:
 *                 type: string
 *     responses:
 *       201:
 *         description: Document uploadé avec succès
 *       400:
 *         description: Erreur de validation ou fichier invalide
 */
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Aucun fichier fourni'
      });
    }
    
    const { type_document, client_id, entreprise_id, description, tags } = req.body;
    
    if (!type_document) {
      // Supprimer le fichier uploadé si les données sont invalides
      await fs.unlink(req.file.path).catch(() => {});
      return res.status(400).json({
        success: false,
        message: 'Type de document requis'
      });
    }
    
    const typesValides = ['facture', 'devis', 'bon_commande', 'bon_livraison', 'contrat', 'autre'];
    if (!typesValides.includes(type_document)) {
      await fs.unlink(req.file.path).catch(() => {});
      return res.status(400).json({
        success: false,
        message: 'Type de document invalide'
      });
    }
    
    // Vérifier que les IDs existent si fournis
    if (client_id) {
      const Client = new BaseModel('clients');
      const client = await Client.findById(parseInt(client_id));
      if (!client) {
        await fs.unlink(req.file.path).catch(() => {});
        return res.status(400).json({
          success: false,
          message: 'Client non trouvé'
        });
      }
    }
    
    if (entreprise_id) {
      const Entreprise = new BaseModel('entreprises');
      const entreprise = await Entreprise.findById(parseInt(entreprise_id));
      if (!entreprise) {
        await fs.unlink(req.file.path).catch(() => {});
        return res.status(400).json({
          success: false,
          message: 'Entreprise non trouvée'
        });
      }
    }
    
    // Vérifier si la colonne `description` existe dans la table `documents`.
    // Si elle n'existe pas, mapper la valeur vers `notes` pour compatibilité.
    const colCheck = await Document.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'description' LIMIT 1");
    const hasDescriptionCol = colCheck && colCheck.rowCount > 0;

    const insertPayload = {
      nom_fichier: req.file.filename,
      nom_original: req.file.originalname,
      chemin_fichier: req.file.path,
      type_document,
      taille_fichier: req.file.size,
      client_id: client_id ? parseInt(client_id) : null,
      entreprise_id: entreprise_id ? parseInt(entreprise_id) : null,
      tags: tags || null,
      actif: true
    };

    if (hasDescriptionCol) {
      insertPayload.description = description || null;
    } else {
      // Remonter dans la colonne `notes` si `description` n'existe pas
      insertPayload.notes = description || null;
    }

    const nouveauDocument = await Document.create(insertPayload);
    
    logger.info(`Nouveau document uploadé: ${nouveauDocument.nom_original} -> ${nouveauDocument.nom_fichier} (ID: ${nouveauDocument.id})`);
    
    res.status(201).json({
      success: true,
      message: 'Document uploadé avec succès',
      data: {
        ...nouveauDocument,
        taille_humaine: formatFileSize(nouveauDocument.taille_fichier)
      }
    });
    
  } catch (error) {
    // Nettoyer le fichier en cas d'erreur
    if (req.file && req.file.path) {
      await fs.unlink(req.file.path).catch(() => {});
    }
    
    logger.error('Erreur lors de l\'upload du document:', error);
    
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'Fichier trop volumineux (max 10MB)'
      });
    }
    
    if (error.message === 'Type de fichier non autorisé') {
      return res.status(400).json({
        success: false,
        message: 'Type de fichier non autorisé'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @swagger
 * /api/v1/documents/{id}/download:
 *   get:
 *     summary: Télécharge un document
 *     tags: [Documents]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID du document
 *     responses:
 *       200:
 *         description: Fichier téléchargé avec succès
 *       404:
 *         description: Document ou fichier non trouvé
 */
router.get('/:id/download', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({
        success: false,
        message: 'ID invalide'
      });
    }
    
    const document = await Document.findById(parseInt(id));
    
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document non trouvé'
      });
    }
    
    if (!document.chemin_fichier) {
      return res.status(404).json({
        success: false,
        message: 'Chemin de fichier non défini'
      });
    }
    
    try {
      await fs.access(document.chemin_fichier);
    } catch {
      return res.status(404).json({
        success: false,
        message: 'Fichier non trouvé sur le serveur'
      });
    }
    
    logger.info(`Téléchargement du document: ${document.nom_original} (ID: ${id})`);
    
    res.download(document.chemin_fichier, document.nom_original, (err) => {
      if (err) {
        logger.error('Erreur lors du téléchargement:', err);
        if (!res.headersSent) {
          res.status(500).json({
            success: false,
            message: 'Erreur lors du téléchargement'
          });
        }
      }
    });
    
  } catch (error) {
    logger.error('Erreur lors du téléchargement du document:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @swagger
 * /api/v1/documents/{id}/pdf:
 *   get:
 *     summary: Génère et télécharge le PDF d'un document
 *     tags: [Documents]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID du document
 *     responses:
 *       200:
 *         description: PDF du document
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Document non trouvé
 */
router.get('/:id/pdf', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({
        success: false,
        message: 'ID invalide'
      });
    }

    // Récupération du document avec les informations client et entreprise
    const documentQuery = `
      SELECT d.*, 
             c.nom as client_nom, 
             c.adresse as client_adresse, 
             c.ville as client_ville,
             c.telephone as client_telephone,
             c.email as client_email,
             e.nom as entreprise_nom,
             e.adresse as entreprise_adresse,
             e.telephone as entreprise_telephone,
             e.reference as entreprise_reference,
             e.autres_coordonnees as entreprise_autres_coordonnees
      FROM documents d
      LEFT JOIN clients c ON d.client_id = c.id
      JOIN entreprises e ON d.entreprise_id = e.id
      WHERE d.id = $1
    `;
    
    const documentResult = await Document.query(documentQuery, [parseInt(id)]);
    
    if (!documentResult.rows || documentResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Document non trouvé'
      });
    }

    const document = documentResult.rows[0];

    // Récupération des lignes du document
    const lignesResult = await Document.query(
      'SELECT * FROM lignes_documents WHERE document_id = $1 ORDER BY id',
      [parseInt(id)]
    );

    const lignes = lignesResult.rows || [];

    // Import du service d'export
    const exportService = require('../services/exportService');
    
    // Génération du PDF
    const pdfBuffer = await exportService.generateDocumentPdf(document, lignes);
    
    // Configuration des headers de réponse
    const filename = `${document.type_document}_${document.numero}.pdf`;
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    
    logger.info(`PDF généré et envoyé pour document ${id} - ${document.numero}`);
    
    // Envoi du PDF
    res.send(pdfBuffer);
    
  } catch (error) {
    logger.error('Erreur lors de la génération PDF:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la génération PDF',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @swagger
 * /api/v1/documents/{id}:
 *   put:
 *     summary: Met à jour les métadonnées d'un document
 *     tags: [Documents]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               type_document:
 *                 type: string
 *                 enum: [facture, devis, bon_commande, bon_livraison, contrat, autre]
 *               client_id:
 *                 type: integer
 *               entreprise_id:
 *                 type: integer
 *               description:
 *                 type: string
 *               tags:
 *                 type: string
 *               actif:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Document mis à jour avec succès
 *       404:
 *         description: Document non trouvé
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({
        success: false,
        message: 'ID invalide'
      });
    }
    
    const documentExistant = await Document.findById(parseInt(id));
    if (!documentExistant) {
      return res.status(404).json({
        success: false,
        message: 'Document non trouvé'
      });
    }

    const requestData = req.body;
    
    // Validation du type de document
    if (requestData.type_document) {
      const typesValides = ['facture', 'devis', 'bon_commande', 'bon_livraison', 'contrat', 'autre', 'proforma'];
      if (!typesValides.includes(requestData.type_document)) {
        return res.status(400).json({
          success: false,
          message: 'Type de document invalide'
        });
      }
    }
    
    // Vérifier que les IDs existent si fournis
    if (requestData.client_id !== undefined && requestData.client_id !== null) {
      const Client = new BaseModel('clients');
      const client = await Client.findById(parseInt(requestData.client_id));
      if (!client) {
        return res.status(400).json({
          success: false,
          message: 'Client non trouvé'
        });
      }
    }

    if (requestData.entreprise_id !== undefined && requestData.entreprise_id !== null) {
      const Entreprise = new BaseModel('entreprises');
      const entreprise = await Entreprise.findById(parseInt(requestData.entreprise_id));
      if (!entreprise) {
        return res.status(400).json({
          success: false,
          message: 'Entreprise non trouvée'
        });
      }
    }    // Filtrer les données pour ne garder que les colonnes valides de la table documents
    const validColumns = [
      'numero', 'type_document', 'client_id', 'entreprise_id',
      'date_emission', 'date_echeance', 'statut',
      'montant_ht', 'montant_tva', 'taux_tva', 'montant_ttc',
      'remise_globale', 'conditions_paiement', 'notes', 'description', 'pdf_path',
      'facture_originale_id', 'tags', 'actif', 'modele_facture', 'categorie_facture', 'monnaie'
    ];

    // Créer un nouvel objet propre avec seulement les colonnes valides qui ont changé
    const donneesModifiees = {};
    for (const column of validColumns) {
      if (requestData[column] !== undefined) {
        let value = requestData[column];
        
        // Convertir les IDs en integers
        if (['client_id', 'entreprise_id', 'facture_originale_id', 'created_by'].includes(column)) {
          if (value === null || value === '') {
            donneesModifiees[column] = null;
            continue;
          }
          value = parseInt(value, 10);
          if (isNaN(value)) {
            return res.status(400).json({
              success: false,
              message: `Valeur invalide pour ${column}: ${requestData[column]}`
            });
          }
        }
        
        // Convertir les montants en float
        if (['montant_ht', 'montant_tva', 'taux_tva', 'montant_ttc', 'remise_globale'].includes(column)) {
          if (value === null || value === '') {
            donneesModifiees[column] = 0;
            continue;
          }
          value = parseFloat(value);
          if (isNaN(value)) {
            return res.status(400).json({
              success: false,
              message: `Montant invalide pour ${column}: ${requestData[column]}`
            });
          }
        }
        
        donneesModifiees[column] = value;
      }
    }
    
    const documentMisAJour = await Document.update(parseInt(id), donneesModifiees);
    
    // Gérer les lignes de facture si présentes
    if (requestData.lignes && Array.isArray(requestData.lignes)) {
      try {
        const LigneDocument = new BaseModel('lignes_documents');
        
        // Supprimer les anciennes lignes
        await LigneDocument.query('DELETE FROM lignes_documents WHERE document_id = $1', [parseInt(id)]);
        
        // Ajouter les nouvelles lignes
        for (const ligne of requestData.lignes) {
          const ligneData = {
            document_id: parseInt(id),
            description: ligne.description || '',
            quantite: parseFloat(ligne.quantite) || 1,
            prix_unitaire: parseFloat(ligne.prix_unitaire) || 0,
            taux_tva: parseFloat(ligne.taux_tva) || 0,
            montant_ht: parseFloat(ligne.montant_ht) || 0,
            montant_tva: parseFloat(ligne.montant_tva) || 0,
            montant_ttc: parseFloat(ligne.montant_ttc) || 0,
            // Nouveaux champs ajoutés par la migration
            item: ligne.item || '',
            date_transport: ligne.date_transport || null,
            plaque_immat: ligne.plaque_immat || '',
            ticket: ligne.ticket || '',
            tonnes: parseFloat(ligne.tonnes) || 0,
            total_poids: parseFloat(ligne.total_poids) || 0,
            frais_administratif: parseFloat(ligne.frais_administratif) || 0,
            unite: ligne.unite || ''
          };
          await LigneDocument.create(ligneData);
        }
      } catch (error) {
        logger.warn(`Erreur lors de la mise à jour des lignes pour le document ${id}:`, error.message);
      }
    }
    
    logger.info(`Document mis à jour: ${documentMisAJour.nom_original || 'Document'} (ID: ${id})`);
    
    res.json({
      success: true,
      message: 'Document mis à jour avec succès',
      data: {
        ...documentMisAJour,
        // Renvoyer description pour compatibilité frontend (notes -> description)
        description: documentMisAJour.description || documentMisAJour.notes || null,
        montant_total: documentMisAJour.montant_ttc // Frontend attend montant_total
      }
    });
    
  } catch (error) {
    logger.error('Erreur lors de la mise à jour du document:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @swagger
 * /api/v1/documents/{id}:
 *   delete:
 *     summary: Supprime un document et son fichier
 *     tags: [Documents]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Document supprimé avec succès
 *       404:
 *         description: Document non trouvé
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({
        success: false,
        message: 'ID invalide'
      });
    }
    
    const document = await Document.findById(parseInt(id));
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document non trouvé'
      });
    }
    
    // Sauvegarde dans la corbeille avant suppression
    try {
      await Document.query(
        'INSERT INTO corbeille (table_source, data, utilisateur) VALUES ($1, $2, $3)',
        [
          'documents',
          JSON.stringify(document),
          req.user ? req.user.username : null
        ]
      );
    } catch (corbeilleError) {
      logger.error('Erreur lors de la sauvegarde dans la corbeille:', corbeilleError);
    }
    // Supprimer d'abord le fichier physique
    if (document.chemin_fichier) {
      try {
        await fs.unlink(document.chemin_fichier);
        logger.info(`Fichier supprimé: ${document.chemin_fichier}`);
      } catch (error) {
        logger.warn(`Impossible de supprimer le fichier ${document.chemin_fichier}:`, error.message);
      }
    }
    // Supprimer l'enregistrement de la base de données
    await Document.delete(parseInt(id));
    logger.info(`Document supprimé: ${document.nom_original} (ID: ${id})`);
    res.json({
      success: true,
      message: 'Document supprimé avec succès'
    });
    
  } catch (error) {
    logger.error('Erreur lors de la suppression du document:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @swagger
 * /api/v1/documents/stats:
 *   get:
 *     summary: Récupère les statistiques des documents
 *     tags: [Documents]
 *     responses:
 *       200:
 *         description: Statistiques des documents récupérées avec succès
 */
router.get('/stats', async (req, res) => {
  try {
    // Statistiques générales
    const statsGenerales = await Document.query(`
      SELECT 
        COUNT(*) as total_documents,
        COUNT(CASE WHEN actif = true THEN 1 END) as documents_actifs,
        SUM(taille_fichier) as taille_totale,
        AVG(taille_fichier) as taille_moyenne
      FROM documents
    `);
    
    // Statistiques par type
    const statsParType = await Document.query(`
      SELECT 
        type_document,
        COUNT(*) as nombre,
        SUM(taille_fichier) as taille_totale
      FROM documents 
      WHERE actif = true
      GROUP BY type_document
      ORDER BY nombre DESC
    `);
    
    // Documents récents
    const documentsRecents = await Document.query(`
      SELECT id, nom_original, type_document, created_at
      FROM documents 
      WHERE actif = true
      ORDER BY created_at DESC 
      LIMIT 5
    `);
    
    const stats = statsGenerales.rows[0];
    const result = {
      total_documents: parseInt(stats.total_documents),
      documents_actifs: parseInt(stats.documents_actifs),
      documents_archives: parseInt(stats.total_documents) - parseInt(stats.documents_actifs),
      taille_totale: parseInt(stats.taille_totale || 0),
      taille_moyenne: parseFloat(stats.taille_moyenne || 0),
      taille_totale_humaine: formatFileSize(parseInt(stats.taille_totale || 0)),
      par_type: statsParType.rows.map(row => ({
        type: row.type_document,
        nombre: parseInt(row.nombre),
        taille_totale: parseInt(row.taille_totale || 0),
        taille_humaine: formatFileSize(parseInt(row.taille_totale || 0))
      })),
      documents_recents: documentsRecents.rows
    };
    
    logger.info('Statistiques des documents calculées');
    
    res.json({
      success: true,
      data: result
    });
    
  } catch (error) {
    logger.error('Erreur lors du calcul des statistiques des documents:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @swagger
 * /api/v1/documents/{id}/convert-to-facture:
 *   post:
 *     summary: Convertit un proforma en facture
 *     tags: [Documents]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID du proforma à convertir
 *     responses:
 *       200:
 *         description: Proforma converti en facture avec succès
 *       404:
 *         description: Proforma non trouvé
 *       500:
 *         description: Erreur interne du serveur
 */
router.post('/:id/convert-to-facture', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Récupérer le proforma
    const proforma = await Document.findById(id);
    if (!proforma) {
      return res.status(404).json({
        success: false,
        message: 'Proforma non trouvé'
      });
    }
    
    // Vérifier que c'est bien un proforma
    if (proforma.type_document !== 'proforma') {
      return res.status(400).json({
        success: false,
        message: 'Ce document n\'est pas un proforma'
      });
    }
    
    // Générer un nouveau numéro de facture
    const currentYear = new Date().getFullYear();
    const existingFactures = await Document.query(
      'SELECT COUNT(*) as count FROM documents WHERE type_document = $1 AND EXTRACT(YEAR FROM created_at) = $2',
      ['facture', currentYear]
    );
    const nextNumber = (parseInt(existingFactures.rows[0].count) + 1).toString().padStart(4, '0');
    const numeroFacture = `FAC${currentYear}${nextNumber}`;
    
    // Récupérer les lignes du proforma
    const LigneDocument = new BaseModel('lignes_documents');
    const lignes = await LigneDocument.query(
      'SELECT * FROM lignes_documents WHERE document_id = $1 ORDER BY ordre ASC',
      [id]
    );
    
    // Créer la facture basée sur le proforma
    const factureData = {
      numero: numeroFacture,
      type_document: 'facture',
      client_id: proforma.client_id,
      entreprise_id: proforma.entreprise_id,
      date_emission: new Date(),
      date_echeance: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 jours par défaut
      statut: 'emise',
      montant_ht: proforma.montant_ht,
      montant_tva: proforma.montant_tva,
      taux_tva: proforma.taux_tva,
      montant_ttc: proforma.montant_ttc,
      remise_globale: proforma.remise_globale,
      conditions_paiement: proforma.conditions_paiement,
      notes: proforma.notes,
      facture_originale_id: null,
      created_at: new Date(),
      updated_at: new Date()
    };
    
    const facture = await Document.create(factureData);
    
    // Créer les lignes de la facture
    for (const ligne of lignes.rows) {
      const ligneFactureData = {
        document_id: facture.id,
        description: ligne.description,
        quantite: ligne.quantite,
        prix_unitaire: ligne.prix_unitaire,
        taux_tva: ligne.taux_tva,
        montant_ht: ligne.montant_ht,
        montant_tva: ligne.montant_tva,
        montant_ttc: ligne.montant_ttc,
        ordre: ligne.ordre,
        item: ligne.item,
        date_transport: ligne.date_transport,
        plaque_immat: ligne.plaque_immat,
        ticket: ligne.ticket,
        tonnes: ligne.tonnes,
        total_poids: ligne.total_poids,
        frais_administratif: ligne.frais_administratif,
        unite: ligne.unite,
        created_at: new Date(),
        updated_at: new Date()
      };
      
      await LigneDocument.create(ligneFactureData);
    }
    
    // Mettre à jour le statut du proforma
    await Document.update(id, { statut: 'converti' });
    
    logger.info(`Proforma ${proforma.numero} converti en facture ${numeroFacture}`);
    
    res.json({
      success: true,
      data: facture,
      message: `Proforma converti en facture ${numeroFacture}`
    });
    
  } catch (error) {
    logger.error('Erreur lors de la conversion du proforma en facture:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @swagger
 * /api/v1/documents/{id}/duplicate:
 *   post:
 *     summary: Duplique un document
 *     tags: [Documents]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID du document à dupliquer
 *     responses:
 *       200:
 *         description: Document dupliqué avec succès
 *       404:
 *         description: Document non trouvé
 *       500:
 *         description: Erreur interne du serveur
 */
router.post('/:id/duplicate', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Récupérer le document original
    const originalDoc = await Document.findById(id);
    if (!originalDoc) {
      return res.status(404).json({
        success: false,
        message: 'Document non trouvé'
      });
    }
    
    // Générer un nouveau numéro basé sur le type de document
    const currentYear = new Date().getFullYear();
    let prefix = '';
    
    switch (originalDoc.type_document) {
      case 'facture':
        prefix = 'FAC';
        break;
      case 'proforma':
        prefix = 'PRO';
        break;
      case 'devis':
        prefix = 'DEV';
        break;
      default:
        prefix = 'DOC';
    }
    
    const existingDocs = await Document.query(
      'SELECT COUNT(*) as count FROM documents WHERE type_document = $1 AND EXTRACT(YEAR FROM created_at) = $2',
      [originalDoc.type_document, currentYear]
    );
    const nextNumber = (parseInt(existingDocs.rows[0].count) + 1).toString().padStart(4, '0');
    const nouveauNumero = `${prefix}${currentYear}${nextNumber}`;
    
    // Récupérer les lignes du document original
    const LigneDocument = new BaseModel('lignes_documents');
    const lignes = await LigneDocument.query(
      'SELECT * FROM lignes_documents WHERE document_id = $1 ORDER BY ordre ASC',
      [id]
    );
    
    // Créer le document dupliqué
    const duplicateData = {
      numero: nouveauNumero,
      type_document: originalDoc.type_document,
      client_id: originalDoc.client_id,
      entreprise_id: originalDoc.entreprise_id,
      date_emission: new Date(),
      date_echeance: originalDoc.type_document === 'facture' 
        ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 jours pour facture
        : null,
      statut: originalDoc.type_document === 'proforma' ? 'EN_ATTENTE' : 'brouillon',
      montant_ht: originalDoc.montant_ht,
      montant_tva: originalDoc.montant_tva,
      taux_tva: originalDoc.taux_tva,
      montant_ttc: originalDoc.montant_ttc,
      remise_globale: originalDoc.remise_globale,
      conditions_paiement: originalDoc.conditions_paiement,
      notes: `Copie de ${originalDoc.numero} - ${originalDoc.notes || ''}`.trim(),
      facture_originale_id: null,
      created_at: new Date(),
      updated_at: new Date()
    };
    
    const duplicate = await Document.create(duplicateData);
    
    // Dupliquer les lignes
    for (const ligne of lignes.rows) {
      const ligneDuplicateData = {
        document_id: duplicate.id,
        description: ligne.description,
        quantite: ligne.quantite,
        prix_unitaire: ligne.prix_unitaire,
        taux_tva: ligne.taux_tva,
        montant_ht: ligne.montant_ht,
        montant_tva: ligne.montant_tva,
        montant_ttc: ligne.montant_ttc,
        ordre: ligne.ordre,
        item: ligne.item,
        date_transport: ligne.date_transport,
        plaque_immat: ligne.plaque_immat,
        ticket: ligne.ticket,
        tonnes: ligne.tonnes,
        total_poids: ligne.total_poids,
        frais_administratif: ligne.frais_administratif,
        unite: ligne.unite,
        created_at: new Date(),
        updated_at: new Date()
      };
      
      await LigneDocument.create(ligneDuplicateData);
    }
    
    logger.info(`Document ${originalDoc.numero} dupliqué vers ${nouveauNumero}`);
    
    res.json({
      success: true,
      data: duplicate,
      message: `Document dupliqué avec le numéro ${nouveauNumero}`
    });
    
  } catch (error) {
    logger.error('Erreur lors de la duplication du document:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * Convertir un proforma en facture
 */
router.post('/:id/convert-to-facture', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Récupérer le proforma original
    const originalProforma = await Document.findById(id);
    
    if (!originalProforma) {
      return res.status(404).json({
        success: false,
        message: 'Proforma non trouvé'
      });
    }
    
    if (originalProforma.type_document !== 'proforma') {
      return res.status(400).json({
        success: false,
        message: 'Le document n\'est pas un proforma'
      });
    }
    
    // Créer la facture basée sur le proforma
    const factureData = {
      ...originalProforma,
      type_document: 'facture',
      numero: `FAC-${Date.now()}`, // Générer un nouveau numéro
      statut: 'emise',
      facture_originale_id: null,
      created_at: new Date(),
      updated_at: new Date()
    };
    
    // Supprimer l'ID pour créer un nouveau document
    delete factureData.id;
    
    const facture = await Document.create(factureData);
    
    // Copier les lignes du proforma vers la facture
    const LigneDocument = new BaseModel('lignes_documents');
    const lignesProforma = await LigneDocument.find({ document_id: id });
    
    for (const ligne of lignesProforma) {
      const nouvelleLigne = {
        ...ligne,
        document_id: facture.id,
        created_at: new Date(),
        updated_at: new Date()
      };
      delete nouvelleLigne.id;
      await LigneDocument.create(nouvelleLigne);
    }
    
    logger.info(`Proforma ${id} converti en facture ${facture.id}`);
    
    res.json({
      success: true,
      data: facture,
      message: 'Proforma converti en facture avec succès'
    });
    
  } catch (error) {
    logger.error('Erreur lors de la conversion du proforma:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * Dupliquer un document
 */
router.post('/:id/duplicate', async (req, res) => {
  try {
    const { id } = req.params;
    const { type_document } = req.body;
    
    // Récupérer le document original
    const originalDocument = await Document.findById(id);
    
    if (!originalDocument) {
      return res.status(404).json({
        success: false,
        message: 'Document non trouvé'
      });
    }
    
    // Créer le document dupliqué
    const duplicateData = {
      ...originalDocument,
      numero: `${type_document?.toUpperCase() || 'DOC'}-${Date.now()}`, // Nouveau numéro
      type_document: type_document || originalDocument.type_document,
      statut: type_document === 'facture' ? 'emise' : 'brouillon',
      date_emission: new Date().toISOString().split('T')[0],
      facture_originale_id: null,
      created_at: new Date(),
      updated_at: new Date()
    };
    
    // Supprimer l'ID pour créer un nouveau document
    delete duplicateData.id;
    
    const duplicateDocument = await Document.create(duplicateData);
    
    // Copier les lignes du document original
    const LigneDocument = new BaseModel('lignes_documents');
    const lignesOriginales = await LigneDocument.find({ document_id: id });
    
    for (const ligne of lignesOriginales) {
      const nouvelleLigne = {
        ...ligne,
        document_id: duplicateDocument.id,
        created_at: new Date(),
        updated_at: new Date()
      };
      delete nouvelleLigne.id;
      await LigneDocument.create(nouvelleLigne);
    }
    
    logger.info(`Document ${id} dupliqué vers le document ${duplicateDocument.id}`);
    
    res.json({
      success: true,
      data: duplicateDocument,
      message: 'Document dupliqué avec succès'
    });
    
  } catch (error) {
    logger.error('Erreur lors de la duplication du document:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * Générer un numéro de proforma basé sur l'entreprise
 */
router.post('/generate-number', async (req, res) => {
  try {
    const { entreprise_id, type_document = 'proforma' } = req.body;
    
    if (!entreprise_id) {
      return res.status(400).json({
        success: false,
        message: 'L\'ID de l\'entreprise est requis'
      });
    }
    
    // Récupérer les informations de l'entreprise
    const Entreprise = new BaseModel('entreprises');
    const entreprise = await Entreprise.findById(entreprise_id);
    
    if (!entreprise) {
      return res.status(404).json({
        success: false,
        message: 'Entreprise non trouvée'
      });
    }
    
    // Utiliser le prefix_facture de l'entreprise
    const prefix = entreprise.prefix_facture || 'DOC';
    
    // Compter le nombre de documents de ce type pour cette entreprise
    const countQuery = `
      SELECT COUNT(*) as count 
      FROM documents 
      WHERE entreprise_id = $1 AND type_document = $2
    `;
    
    const countResult = await Document.query(countQuery, [entreprise_id, type_document]);
    const count = parseInt(countResult.rows[0].count) || 0;
    
    // Générer le numéro avec un format : PREFIX-PRF-YYYYMMDD-NNNN
    const today = new Date();
    const dateStr = today.getFullYear() + 
                   (today.getMonth() + 1).toString().padStart(2, '0') + 
                   today.getDate().toString().padStart(2, '0');
    
    const typePrefix = type_document === 'proforma' ? 'PRF' : 
                      type_document === 'facture' ? 'FAC' : 'DOC';
    
    const numero = `${prefix}-${typePrefix}-${dateStr}-${(count + 1).toString().padStart(4, '0')}`;
    
    logger.info(`Numéro généré: ${numero} pour entreprise ${entreprise.nom}`);
    
    res.json({
      success: true,
      data: {
        numero,
        prefix: prefix,
        entreprise_nom: entreprise.nom,
        count: count + 1
      }
    });
    
  } catch (error) {
    logger.error('Erreur lors de la génération du numéro:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Fonction utilitaire pour formater la taille des fichiers
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * @swagger
 * /api/v1/documents:
 *   get:
 *     summary: Récupère la liste des documents
 *     tags: [Documents]
 *     parameters:
 *       - in: query
 *         name: page
 *         required: false
 *         schema:
 *           type: integer
 *         description: Numéro de page pour la pagination
 *       - in: query
 *         name: limit
 *         required: false
 *         schema:
 *           type: integer
 *         description: Nombre de documents par page
 *       - in: query
 *         name: search
 *         required: false
 *         schema:
 *           type: string
 *         description: Terme de recherche dans les documents
 *     responses:
 *       200:
 *         description: Liste des documents récupérée avec succès
 *       500:
 *         description: Erreur interne du serveur
 */
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    
    const lim = Math.min(parseInt(limit), 100); // Limite max 100
    const offset = (parseInt(page) - 1) * lim;
    
    // Conditions de recherche
    let where = '';
    const params = [];
    if (search) {
      where = `WHERE (d.numero ILIKE $1 OR d.notes ILIKE $1)`;
      params.push(`%${search}%`);
    }
    
    // Enrichir la requête pour inclure les infos client (nom, prénom, email, etc.)
    const query = `
      SELECT d.*, 
             c.nom AS client_nom, c.prenom AS client_prenom, c.email AS client_email, c.adresse AS client_adresse, c.telephone AS client_telephone
      FROM documents d
      LEFT JOIN clients c ON d.client_id = c.id
      ${where.replace(/documents/g, 'd')}
      ORDER BY d.created_at DESC
      LIMIT ${lim} OFFSET ${offset}
    `;
    const result = await Document.query(query, params);
    // Pour chaque document, ajouter un champ client_nom_complet pour le frontend
    const enrichedRows = result.rows.map(doc => ({
      ...doc,
      client_nom_complet: doc.client_prenom && doc.client_nom
        ? `${doc.client_prenom} ${doc.client_nom}`
        : doc.client_nom || 'Client inconnu'
    }));
    res.json({ success: true, data: enrichedRows });
    
  } catch (error) {
    logger.error('Erreur lors de la récupération des documents:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;