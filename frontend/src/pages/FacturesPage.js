/**
 * Page de gestion des factures
 */
import React, { useState, useEffect } from 'react';
import { PlusIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import FacturesList from '../components/factures/FacturesList';
import FactureForm from '../components/factures/FactureForm';
import FactureView from '../components/factures/FactureView';
import { facturesAPI } from '../services/facturesAPI';

const FacturesPage = () => {


  const [factures, setFactures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // États pour les modales
  const [showForm, setShowForm] = useState(false);
  const [showView, setShowView] = useState(false);
  const [selectedFacture, setSelectedFacture] = useState(null);
  const [formMode, setFormMode] = useState('create');


  // Charger la liste des factures (sans filtres avancés)
  const loadFactures = async () => {
    try {
      setLoading(true);
      setError(null);
      const facturesData = await facturesAPI.getAll();
      setFactures(Array.isArray(facturesData) ? facturesData : []);
    } catch (err) {
      console.error('Erreur lors du chargement des factures:', err);
      setError('Erreur lors du chargement des factures');
      setFactures([]);
    } finally {
      setLoading(false);
    }
  };

  // Charger les factures au montage du composant
  useEffect(() => {
    loadFactures();
    // eslint-disable-next-line
  }, []);

  // Handlers pour les actions CRUD
  const handleCreate = () => {
    setSelectedFacture(null);
    setFormMode('create');
    setShowForm(true);
  };

  const handleEdit = async (facture) => {
    try {
      setLoading(true);
      const response = await facturesAPI.getById(facture.id);
      const factureComplete = response.data || response;
      console.log('handleEdit - Facture récupérée:', {
        factureComplete,
        lignes: factureComplete?.lignes,
        lignesLength: factureComplete?.lignes?.length
      });
      setSelectedFacture(factureComplete);
      setFormMode('edit');
      setShowForm(true);
    } catch (err) {
      console.error('Erreur lors du chargement des détails de la facture:', err);
      alert('Erreur lors du chargement des détails de la facture');
    } finally {
      setLoading(false);
    }
  };

  const handleView = async (facture) => {
    try {
      setLoading(true);
      const response = await facturesAPI.getById(facture.id);
      const factureComplete = response.data || response;
      setSelectedFacture(factureComplete);
      setShowView(true);
    } catch (err) {
      console.error('Erreur lors du chargement des détails de la facture:', err);
      alert('Erreur lors du chargement des détails de la facture');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (facture) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer la facture "${facture.numero || `F${facture.id}`}" ?`)) {
      try {
        await facturesAPI.delete(facture.id);
        await loadFactures();
      } catch (err) {
        console.error('Erreur lors de la suppression:', err);
        alert('Erreur lors de la suppression de la facture');
      }
    }
  };

  const handleGeneratePDF = async (facture) => {
    try {
      const pdfBlob = await facturesAPI.generatePDF(facture.id);
      const url = window.URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `facture-${facture.numero || facture.id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Erreur lors de la génération PDF:', err);
      alert('Erreur lors de la génération du PDF');
    }
  };

  const handleSendEmail = (facture) => {
    // TODO: Implémenter l'envoi par email
    alert(`Envoi par email de la facture ${facture.numero || facture.id} (fonctionnalité à venir)`);
  };

  const handleUpdateStatus = async (facture, newStatus) => {
    try {
      await facturesAPI.updateStatus(facture.id, newStatus);
      await loadFactures();
    } catch (err) {
      console.error('Erreur lors du changement de statut:', err);
      alert('Erreur lors du changement de statut');
    }
  };

  // Calculer les statistiques
  const stats = {
    total: factures.length,
    brouillons: factures.filter(f => f.statut === 'brouillon').length,
    envoyees: factures.filter(f => f.statut === 'envoyee').length,
    payees: factures.filter(f => f.statut === 'payee').length,
    montantTotal: factures.reduce((sum, f) => sum + ((f && (f.montant_total || f.montant_ttc)) || 0), 0),
    montantEnAttente: factures
      .filter(f => f.statut === 'envoyee')
      .reduce((sum, f) => sum + ((f && (f.montant_total || f.montant_ttc)) || 0), 0)
  };

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };



  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">
              Erreur de chargement
            </h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error}</p>
            </div>
            <div className="mt-4">
              <button
                onClick={loadFactures}
                className="bg-red-100 px-2 py-1 rounded-md text-red-800 text-sm hover:bg-red-200"
              >
                Réessayer
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Factures</h1>
          <p className="mt-2 text-sm text-gray-700">
            Gérez vos factures, suivez les paiements et générez des rapports.
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button
            onClick={handleCreate}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Nouvelle facture
          </button>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <DocumentTextIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total factures
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.total}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center">
                  <span className="text-gray-600 font-semibold text-xs">B</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Brouillons
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.brouillons}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-semibold text-xs">E</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Envoyées
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.envoyees}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 font-semibold text-xs">P</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Payées
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.payees}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center">
                  <span className="text-indigo-600 font-semibold text-xs">€</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    CA Total
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {formatAmount(stats.montantTotal)}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center">
                  <span className="text-orange-600 font-semibold text-xs">⏳</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    En attente
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {formatAmount(stats.montantEnAttente)}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Liste des factures */}
      <FacturesList
        factures={factures}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onGeneratePDF={handleGeneratePDF}
        onSendEmail={handleSendEmail}
        onUpdateStatus={handleUpdateStatus}
      />

      {/* Formulaire de facture */}
      {showForm && (
        <FactureForm
          facture={selectedFacture}
          mode={formMode}
          onClose={() => {
            setShowForm(false);
            setSelectedFacture(null);
          }}
          onSave={async (factureData) => {
            try {
              if (formMode === 'create') {
                await facturesAPI.create(factureData);
              } else {
                await facturesAPI.update(selectedFacture.id, factureData);
              }
              await loadFactures();
              setShowForm(false);
              setSelectedFacture(null);
            } catch (err) {
              console.error('Erreur lors de la sauvegarde:', err);
              throw err;
            }
          }}
        />
      )}

      {/* Vue détaillée de facture */}
      {showView && selectedFacture && (
        <FactureView
          facture={selectedFacture}
          onClose={() => {
            setShowView(false);
            setSelectedFacture(null);
          }}
          onGeneratePDF={handleGeneratePDF}
          onSendEmail={handleSendEmail}
        />
      )}
    </div>
  );
};

export default FacturesPage;