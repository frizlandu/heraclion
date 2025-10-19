import React, { useState, useEffect, useCallback } from 'react';
import { 
  PlusIcon, 
  EyeIcon, 
  PencilIcon, 
  TrashIcon,
  ArrowPathIcon,
  DocumentArrowDownIcon,
  DocumentDuplicateIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';
import DataTable from '../components/common/DataTable/DataTable';
import proformasAPI from '../services/proformasAPI';
import ProformaForm from '../components/proformas/ProformaForm';
import ProformaView from '../components/proformas/ProformaView';

const ProformasPage = () => {
  const [proformas, setProformas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showView, setShowView] = useState(false);
  const [selectedProforma, setSelectedProforma] = useState(null);
  const [formMode, setFormMode] = useState('create');

  // Charger la liste des proformas
  const loadProformas = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await proformasAPI.getAll();
      const proformasData = response.data?.data || response.data || response || [];
      setProformas(Array.isArray(proformasData) ? proformasData : []);
    } catch (err) {
      console.error('Erreur lors du chargement des proformas:', err);
      setError('Erreur lors du chargement des proformas');
      setProformas([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Charger les proformas au montage du composant
  useEffect(() => {
    loadProformas();
  }, [loadProformas]);

  // Créer un nouveau proforma
  const handleCreate = () => {
    setSelectedProforma(null);
    setFormMode('create');
    setShowForm(true);
  };

  // Modifier un proforma
  const handleEdit = async (proforma) => {
    try {
      // Récupérer le proforma complet avec ses lignes
      const response = await proformasAPI.getById(proforma.id);
      const proformaComplet = response.success ? response.data : response;
      
      console.log('Proforma complet pour édition:', proformaComplet);
      setSelectedProforma(proformaComplet);
      setFormMode('edit');
      setShowForm(true);
    } catch (error) {
      console.error('Erreur lors de la récupération du proforma pour édition:', error);
      // En cas d'erreur, utiliser les données de base
      setSelectedProforma(proforma);
      setFormMode('edit');
      setShowForm(true);
    }
  };

  // Voir les détails d'un proforma
  const handleView = async (proforma) => {
    try {
      // Récupérer le proforma complet avec ses lignes
      const response = await proformasAPI.getById(proforma.id);
      const proformaComplet = response.success ? response.data : response;
      
      console.log('Proforma complet récupéré:', proformaComplet);
      setSelectedProforma(proformaComplet);
      setShowView(true);
    } catch (error) {
      console.error('Erreur lors de la récupération du proforma:', error);
      // En cas d'erreur, utiliser les données de base
      setSelectedProforma(proforma);
      setShowView(true);
    }
  };

  // Supprimer un proforma
  const handleDelete = async (proforma) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer le proforma ${proforma.numero || proforma.id} ?`)) {
      try {
        await proformasAPI.delete(proforma.id);
        await loadProformas();
      } catch (err) {
        console.error('Erreur lors de la suppression:', err);
        alert('Erreur lors de la suppression du proforma');
      }
    }
  };

  // Dupliquer un proforma
  const handleDuplicate = async (proforma) => {
    try {
      await proformasAPI.duplicate(proforma.id);
      await loadProformas();
    } catch (err) {
      console.error('Erreur lors de la duplication:', err);
      alert('Erreur lors de la duplication du proforma');
    }
  };

  // Convertir proforma en facture
  const handleConvertToFacture = async (proforma) => {
    if (window.confirm(`Convertir le proforma ${proforma.numero || proforma.id} en facture ?`)) {
      try {
        await proformasAPI.convertToFacture(proforma.id);
        await loadProformas();
        alert('Proforma converti en facture avec succès !');
      } catch (err) {
        console.error('Erreur lors de la conversion:', err);
        alert('Erreur lors de la conversion en facture');
      }
    }
  };

  // Télécharger le PDF
  const handleDownloadPDF = async (proforma) => {
    try {
      const pdfBlob = await proformasAPI.generatePDF(proforma.id);
      const url = window.URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `proforma_${proforma.numero || proforma.id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Erreur lors du téléchargement PDF:', err);
      alert('Erreur lors de la génération du PDF');
    }
  };

  // Formatage des montants
  const formatCurrency = (amount, currency = 'USD') => {
    if (!amount) {
      const currencySymbols = { 'USD': '$0.00', 'EUR': '0,00 €', 'CDF': '0,00 FC', 'CAD': 'CAD$0.00' };
      return currencySymbols[currency] || `${currency} 0.00`;
    }
    
    // Pour le franc congolais, utiliser un formatage personnalisé
    if (currency === 'CDF') {
      const formattedAmount = parseFloat(amount).toFixed(2);
      return `${formattedAmount} FC`;
    }
    
    const locale = currency === 'EUR' ? 'fr-FR' : 'en-US';
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency
    }).format(parseFloat(amount));
  };

  // Formatage des dates
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  // Obtenir le style du badge de statut
  const getStatusBadge = (statut) => {
    const statusStyles = {
      'EN_ATTENTE': 'bg-yellow-100 text-yellow-800',
      'ACCEPTE': 'bg-green-100 text-green-800',
      'REFUSE': 'bg-red-100 text-red-800',
      'EXPIRE': 'bg-gray-100 text-gray-800'
    };
    
    const statusLabels = {
      'EN_ATTENTE': 'En attente',
      'ACCEPTE': 'Accepté',
      'REFUSE': 'Refusé',
      'EXPIRE': 'Expiré'
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyles[statut] || 'bg-gray-100 text-gray-800'}`}>
        {statusLabels[statut] || statut}
      </span>
    );
  };

  // Colonnes du DataTable
  const columns = [
    {
      key: 'numero',
      label: 'Numéro',
      sortable: true,
      render: (value, p) => <span className="font-medium text-gray-900">{p.numero || `Proforma #${p.id}`}</span>
    },
    {
      key: 'client_nom',
      label: 'Client',
      sortable: false,
      render: (value, p) => {
        // Fallback complet pour le nom du client
        const nomClient = p.client_nom || p.client_nom_complet || (p.client && (p.client.nom || p.client.raison_sociale)) || p.client_prenom || p.client_email || 'Non défini';
        return <span>{nomClient}</span>;
      }
    },
    {
      key: 'date_proforma',
      label: 'Date',
      sortable: true,
      render: (value, p) => {
        const date = p.date_proforma || p.date_emission || p.created_at;
        return (
          <span>
            {date ? formatDate(date) : <span className="text-gray-400">-</span>}
          </span>
        );
      }
    },
    {
      key: 'montant_ttc',
      label: 'Montant',
      sortable: true,
      render: (value, p) => <span className="font-bold">{formatCurrency(p.montant_ttc, p.monnaie)}</span>
    },
    {
      key: 'statut',
      label: 'Statut',
      sortable: false,
      render: (value, p) => getStatusBadge(p.statut)
    },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      render: (value, p) => (
        <div className="flex space-x-2">
          <button onClick={() => handleView(p)} className="p-1 rounded hover:bg-gray-100 text-indigo-600 hover:text-indigo-900" title="Voir">
            <EyeIcon className="w-4 h-4" />
          </button>
          <button onClick={() => handleEdit(p)} className="p-1 rounded hover:bg-gray-100 text-blue-600 hover:text-blue-900" title="Modifier">
            <PencilIcon className="w-4 h-4" />
          </button>
          <button onClick={() => handleDownloadPDF(p)} className="p-1 rounded hover:bg-gray-100 text-green-600 hover:text-green-900" title="Télécharger PDF">
            <DocumentArrowDownIcon className="w-4 h-4" />
          </button>
          <button onClick={() => handleDuplicate(p)} className="p-1 rounded hover:bg-gray-100 text-yellow-600 hover:text-yellow-900" title="Dupliquer">
            <DocumentDuplicateIcon className="w-4 h-4" />
          </button>
          <button onClick={() => handleConvertToFacture(p)} className="p-1 rounded hover:bg-gray-100 text-purple-600 hover:text-purple-900" title="Convertir en facture">
            <ArrowRightIcon className="w-4 h-4" />
          </button>
          <button onClick={() => handleDelete(p)} className="p-1 rounded hover:bg-gray-100 text-red-600 hover:text-red-900" title="Supprimer">
            <TrashIcon className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des Proformas</h1>
          <p className="text-gray-600">
            {proformas.length} proforma{proformas.length !== 1 ? 's' : ''} au total
          </p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={loadProformas}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <ArrowPathIcon className="-ml-0.5 mr-2 h-4 w-4" />
            Actualiser
          </button>
          <button
            onClick={handleCreate}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <PlusIcon className="-ml-0.5 mr-2 h-4 w-4" />
            Nouveau proforma
          </button>
        </div>
      </div>

      {/* Message d'erreur */}
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="text-sm text-red-700">{error}</div>
        </div>
      )}

      {/* Liste des proformas DataTable */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <DataTable
          data={proformas}
          columns={columns}
          loading={loading}
          searchPlaceholder="Rechercher par numéro, client..."
          emptyMessage="Aucun proforma trouvé"
        />
      </div>

      {/* Formulaire de proforma */}
      {showForm && (
        <ProformaForm
          proforma={selectedProforma}
          mode={formMode}
          onClose={() => {
            setShowForm(false);
            setSelectedProforma(null);
          }}
          onSave={async (proformaData) => {
            try {
              if (formMode === 'create') {
                await proformasAPI.create(proformaData);
              } else {
                await proformasAPI.update(selectedProforma.id, proformaData);
              }
              await loadProformas();
              setShowForm(false);
              setSelectedProforma(null);
            } catch (err) {
              console.error('Erreur lors de la sauvegarde:', err);
              throw err;
            }
          }}
        />
      )}

      {/* Vue détaillée de proforma */}
      {showView && selectedProforma && (
        <ProformaView
          proforma={selectedProforma}
          onClose={() => {
            setShowView(false);
            setSelectedProforma(null);
          }}
          onEdit={() => {
            setShowView(false);
            handleEdit(selectedProforma);
          }}
          onDelete={() => {
            setShowView(false);
            handleDelete(selectedProforma);
          }}
          onConvertToFacture={() => {
            setShowView(false);
            handleConvertToFacture(selectedProforma);
          }}
        />
      )}
    </div>
  );
};

export default ProformasPage;