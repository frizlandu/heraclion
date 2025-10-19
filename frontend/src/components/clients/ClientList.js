/**
 * Composant de liste des clients
 */
import React, { useState, useEffect } from 'react';
import { PlusIcon, EyeIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import DataTable from '../common/DataTable/DataTable';
import ClientForm from './ClientForm';
import ClientView from './ClientView';
import { clientsAPI } from '../../services/api/clientsAPI';
import toast from 'react-hot-toast';

const ClientList = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showView, setShowView] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [formMode, setFormMode] = useState('create'); // 'create' ou 'edit'

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      setLoading(true);
      const response = await clientsAPI.getAll();
      
      if (response.success) {
        setClients(response.data.data || response.data || []);
      } else {
        toast.error('Erreur lors du chargement des clients');
      }
    } catch (error) {
      console.error('Erreur clients:', error);
      toast.error('Erreur lors du chargement des clients');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setSelectedClient(null);
    setFormMode('create');
    setShowForm(true);
  };

  const handleEdit = (client) => {
    setSelectedClient(client);
    setFormMode('edit');
    setShowForm(true);
  };

  const handleView = (client) => {
    setSelectedClient(client);
    setShowView(true);
  };

  const handleDelete = async (client) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer le client "${client.nom}" ?`)) {
      try {
        const response = await clientsAPI.delete(client.id);
        
        if (response.success) {
          toast.success('Client supprimé avec succès');
          loadClients(); // Recharger la liste
        } else {
          toast.error(response.message || 'Erreur lors de la suppression');
        }
      } catch (error) {
        console.error('Erreur suppression:', error);
        toast.error('Erreur lors de la suppression du client');
      }
    }
  };

  const handleFormSubmit = async (formData) => {
    try {
      let response;
      
      if (formMode === 'create') {
        response = await clientsAPI.create(formData);
      } else {
        response = await clientsAPI.update(selectedClient.id, formData);
      }
      
      if (response.success) {
        toast.success(`Client ${formMode === 'create' ? 'créé' : 'modifié'} avec succès`);
        setShowForm(false);
        setSelectedClient(null);
        loadClients(); // Recharger la liste
      } else {
        toast.error(response.message || `Erreur lors de la ${formMode === 'create' ? 'création' : 'modification'}`);
      }
    } catch (error) {
      console.error('Erreur formulaire:', error);
      toast.error(`Erreur lors de la ${formMode === 'create' ? 'création' : 'modification'} du client`);
    }
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setSelectedClient(null);
  };

  // Configuration des colonnes
  const columns = [
    {
      key: 'nom',
      label: 'Nom',
      sortable: true,
      render: (value) => (
        <div className="font-medium text-gray-900">{value}</div>
      )
    },
    {
      key: 'email',
      label: 'Email',
      sortable: true,
      render: (value) => (
        <div className="text-gray-600">{value || '-'}</div>
      )
    },
    {
      key: 'telephone',
      label: 'Téléphone',
      sortable: true,
      render: (value) => (
        <div className="text-gray-600">{value || '-'}</div>
      )
    },
    {
      key: 'adresse',
      label: 'Adresse',
      sortable: false,
      render: (value) => (
        <div className="text-gray-600 max-w-xs truncate">{value || '-'}</div>
      )
    },
    {
      key: 'created_at',
      label: 'Date de création',
      sortable: true,
      render: (value) => (
        <div className="text-gray-600">
          {value ? new Date(value).toLocaleDateString('fr-FR') : '-'}
        </div>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      render: (_, client) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleView(client);
            }}
            className="text-indigo-600 hover:text-indigo-900 p-1 rounded-full hover:bg-indigo-50"
            title="Voir les détails"
          >
            <EyeIcon className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleEdit(client);
            }}
            className="text-green-600 hover:text-green-900 p-1 rounded-full hover:bg-green-50"
            title="Modifier"
          >
            <PencilIcon className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(client);
            }}
            className="text-red-600 hover:text-red-900 p-1 rounded-full hover:bg-red-50"
            title="Supprimer"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>
      )
    }
  ];

  // Actions globales (bouton d'ajout)
  const tableActions = (
    <div className="flex justify-between items-center">
      <div>
        <h3 className="text-lg font-medium text-gray-900">Gestion des clients</h3>
        <p className="mt-1 text-sm text-gray-500">
          Liste de tous les clients de l'entreprise
        </p>
      </div>
      <button
        onClick={handleCreate}
        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        <PlusIcon className="h-4 w-4 mr-2" />
        Nouveau client
      </button>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Table des clients */}
      <DataTable
        data={clients}
        columns={columns}
        loading={loading}
        searchable={true}
        searchPlaceholder="Rechercher un client par nom, email ou téléphone..."
        onRowClick={handleView}
        actions={tableActions}
        emptyMessage="Aucun client trouvé"
      />

      {/* Modal de formulaire */}
      {showForm && (
        <ClientForm
          client={selectedClient}
          mode={formMode}
          onSubmit={handleFormSubmit}
          onCancel={handleFormCancel}
        />
      )}

      {/* Modal de visualisation */}
      {showView && selectedClient && (
        <ClientView
          client={selectedClient}
          onClose={() => {
            setShowView(false);
            setSelectedClient(null);
          }}
          onEdit={() => {
            setShowView(false);
            handleEdit(selectedClient);
          }}
          onDelete={() => {
            setShowView(false);
            handleDelete(selectedClient);
          }}
        />
      )}
    </div>
  );
};

export default ClientList;