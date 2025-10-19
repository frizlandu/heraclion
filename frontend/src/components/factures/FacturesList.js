/**
 * Composant de liste des factures avec gestion CRUD
 */
import React from 'react';
import { 
  EyeIcon, 
  PencilIcon, 
  TrashIcon, 
  DocumentArrowDownIcon,
  EnvelopeIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';
import DataTable from '../common/DataTable/DataTable';

const FacturesList = ({ factures, onView, onEdit, onDelete, onGeneratePDF, onSendEmail, onUpdateStatus, loading = false }) => {

  // Fonction pour formater le montant
  const formatAmount = (amount) => {
    if (!amount && amount !== 0) return '0,00 $';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // Fonction pour formater la date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  // Fonction pour afficher le statut avec couleur
  const renderStatus = (facture) => {
    // Vérification de sécurité pour éviter les erreurs
    if (!facture || typeof facture !== 'object') {
      return <span className="text-red-500">Erreur</span>;
    }
    
    const statusConfig = {
      'brouillon': { 
        color: 'bg-gray-100 text-gray-800', 
        icon: ClockIcon,
        label: 'Brouillon' 
      },
      'envoyee': { 
        color: 'bg-blue-100 text-blue-800', 
        icon: EnvelopeIcon,
        label: 'Envoyée' 
      },
      'payee': { 
        color: 'bg-green-100 text-green-800', 
        icon: CheckCircleIcon,
        label: 'Payée' 
      },
      'en_retard': { 
        color: 'bg-red-100 text-red-800', 
        icon: ExclamationCircleIcon,
        label: 'En retard' 
      }
    };

    const config = statusConfig[facture.statut] || statusConfig['brouillon'];
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </span>
    );
  };

  // Configuration des colonnes
  const columns = [
    {
      key: 'numero',
      label: 'N° Facture',
      sortable: true,
      render: (value, facture) => (
        <div className="font-medium text-gray-900">
          {facture.numero || `F${facture.id?.toString().padStart(4, '0')}`}
        </div>
      )
    },
    {
      key: 'client_nom',
      label: 'Client',
      sortable: true,
      render: (value, facture) => {
        const clientNom = facture.client_nom_complet || facture.client_nom || 'Client inconnu';
        const clientEmail = facture.client_email;
        return (
          <div>
            <div className="font-medium text-gray-900">{clientNom}</div>
            {clientEmail && (
              <div className="text-sm text-gray-500">{clientEmail}</div>
            )}
          </div>
        );
      }
    },
    {
      key: 'date_emission',
      label: 'Date émission',
      sortable: true,
      render: (value, facture) => (
        <div className="text-gray-900">
          {formatDate(facture.date_emission)}
        </div>
      )
    },
    {
      key: 'date_echeance',
      label: 'Date échéance',
      sortable: true,
      render: (value, facture) => (
        <div className="text-gray-900">
          {formatDate(facture.date_echeance)}
        </div>
      )
    },
    {
      key: 'montant_display',  // Clé inexistante pour recevoir l'objet complet
      label: 'Montant',
      sortable: true,
      sortKey: 'montant_total', // Clé pour le tri
      render: (value, facture) => {
        const montant = (facture && (facture.montant_total || facture.montant_ttc)) || 0;
        return (
          <div className="font-medium text-gray-900">
            {formatAmount(montant)}
          </div>
        );
      }
    },
    {
      key: 'statut',
      label: 'Statut',
      sortable: true,
      render: (value, facture) => renderStatus(facture)
    },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      render: (value, facture) => {
        const actions = getActions(facture);
        return (
          <div className="flex space-x-2">
            {actions.map((action, index) => (
              <button
                key={index}
                onClick={action.onClick}
                className={`p-1 rounded hover:bg-gray-100 ${action.className}`}
                title={action.label}
              >
                <action.icon className="w-4 h-4" />
              </button>
            ))}
          </div>
        );
      }
    }
  ];

  // Actions disponibles pour chaque facture
  const getActions = (facture) => {
    // Vérification de sécurité
    if (!facture || typeof facture !== 'object') {
      return [];
    }
    
    const actions = [
      {
        label: 'Détails',
        icon: EyeIcon,
        onClick: () => onView(facture),
        className: 'text-indigo-600 hover:text-indigo-900'
      },
      {
        label: 'Modifier',
        icon: PencilIcon,
        onClick: () => onEdit(facture),
        className: 'text-green-600 hover:text-green-900'
      },
      {
        label: 'PDF',
        icon: DocumentArrowDownIcon,
        onClick: () => onGeneratePDF(facture),
        className: 'text-blue-600 hover:text-blue-900'
      },
      {
        label: 'Envoyer',
        icon: EnvelopeIcon,
        onClick: () => onSendEmail(facture),
        className: 'text-purple-600 hover:text-purple-900'
      }
    ];

    // Toujours ajouter le bouton supprimer à la fin
    actions.push({
      label: 'Supprimer',
      icon: TrashIcon,
      onClick: () => onDelete(facture),
      className: 'text-red-600 hover:text-red-900'
    });

    return actions;
  };

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">
          Liste des factures
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          Gérez vos factures, suivez les paiements et générez des rapports.
        </p>
      </div>

      <DataTable
        data={factures}
        columns={columns}
        loading={loading}
        searchPlaceholder="Rechercher par numéro, client..."
        emptyMessage="Aucune facture trouvée"
        searchFields={['numero', 'client_nom', 'client_email', 'statut']}
      />
    </div>
  );
};

export default FacturesList;