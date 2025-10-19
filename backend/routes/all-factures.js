const express = require('express');
const BaseModel = require('../models/BaseModel');
const BaseModelBase = require('../models/base/BaseModel');
const router = express.Router();

// Endpoint pour fusionner toutes les factures (classiques, transport, non-transport)
router.get('/', async (req, res) => {
  try {
    const DocumentsModel = new BaseModel('documents');
    const FacturesTransportModel = new BaseModelBase('factures_transport');
    const FacturesNonTransportModel = new BaseModelBase('factures_non_transport');
    const ClientsModel = new BaseModel('clients');

    // Récupérer tous les clients pour mapping rapide
    const clients = await ClientsModel.findAll();
    const clientsMap = {};
    clients.forEach(c => {
      clientsMap[c.id] = c;
    });

    // 1. Factures classiques (table documents)
    const docs = await DocumentsModel.findAll('', [], 'created_at DESC');
    const facturesDocs = docs.filter(doc => doc.type_document === 'facture').map(doc => {
      const client = clientsMap[doc.client_id] || {};
      return {
        id: doc.id,
        numero: doc.numero,
        client_id: doc.client_id,
        client_nom: client.nom || '',
        client_prenom: client.prenom || '',
        client_email: client.email || '',
        entreprise_id: doc.entreprise_id,
        date_emission: doc.date_emission || doc.date_facture,
        date_echeance: doc.date_echeance || '',
        montant_total: doc.montant_ttc,
        statut: doc.statut,
        categorie_facture: doc.categorie_facture || 'classique',
        type_source: 'documents',
        created_at: doc.created_at,
        description: doc.description || doc.notes || '',
      };
    });

    // 2. Factures transport
    const facturesTransport = await FacturesTransportModel.findAll();
    const facturesT = facturesTransport.map(f => {
      const client = clientsMap[f.client_id] || {};
      return {
        id: f.id,
        numero: f.numero,
        client_id: f.client_id,
        client_nom: client.nom || '',
        client_prenom: client.prenom || '',
        client_email: client.email || '',
        entreprise_id: f.entreprise_id,
        date_emission: f.date_emission || f.date_facture,
        date_echeance: f.date_echeance || '',
        montant_total: f.total_general,
        statut: f.statut,
        categorie_facture: 'transport',
        type_source: 'factures_transport',
        created_at: f.created_at,
        description: f.description || f.notes || '',
      };
    });

    // 3. Factures non-transport
    const facturesNonTransport = await FacturesNonTransportModel.findAll();
    const facturesNT = facturesNonTransport.map(f => {
      const client = clientsMap[f.client_id] || {};
      return {
        id: f.id,
        numero: f.numero,
        client_id: f.client_id,
        client_nom: client.nom || '',
        client_prenom: client.prenom || '',
        client_email: client.email || '',
        entreprise_id: f.entreprise_id,
        date_emission: f.date_emission || f.date_facture,
        date_echeance: f.date_echeance || '',
        montant_total: f.total_general,
        statut: f.statut,
        categorie_facture: 'non-transport',
        type_source: 'factures_non_transport',
        created_at: f.created_at,
        description: f.description || f.notes || '',
      };
    });

    // Fusionner et trier toutes les factures par date_emission/created_at desc
    const allFactures = [...facturesDocs, ...facturesT, ...facturesNT].sort((a, b) => {
      const dateA = new Date(a.date_emission || a.created_at);
      const dateB = new Date(b.date_emission || b.created_at);
      return dateB - dateA;
    });

    res.json({
      success: true,
      data: allFactures
    });
  } catch (error) {
    console.error('Erreur all-factures:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur', error: error.message });
  }
});

module.exports = router;
