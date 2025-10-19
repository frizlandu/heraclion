/**
 * Page de gestion des clients
 */
import React, { useState, useEffect, useCallback } from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';
import ClientList from '../components/clients/ClientList';
import ClientForm from '../components/clients/ClientForm';
import ClientView from '../components/clients/ClientView';
import { clientsAPI } from '../services/clientsAPI';

const ClientsPage = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // États pour les modales
  const [showForm, setShowForm] = useState(false);
  const [showView, setShowView] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [formMode, setFormMode] = useState('create'); // 'create' ou 'edit'

  // Charger la liste des clients
  const loadClients = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await clientsAPI.getAll();
      // L'API retourne { success: true, data: { data: [...], total: ... } }
      const clientsData = response.data?.data || response.data || response || [];
      setClients(Array.isArray(clientsData) ? clientsData : []);
    } catch (err) {
      console.error('Erreur lors du chargement des clients:', err);
      setError('Erreur lors du chargement des clients');
      setClients([]); // S'assurer que clients est toujours un tableau
    } finally {
      setLoading(false);
    }
  }, []);

  // Charger les clients au montage du composant
  useEffect(() => {
    loadClients();
  }, [loadClients]);

  // Handlers pour les actions CRUD
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
        await clientsAPI.delete(client.id);
        await loadClients(); // Recharger la liste
      } catch (err) {
        console.error('Erreur lors de la suppression:', err);
        if (err?.response?.status === 409) {
          alert('Impossible de supprimer ce client : il est lié à d’autres données (factures, commandes, etc.).');
        } else {
          alert('Erreur lors de la suppression du client');
        }
      }
    }
  };

  // Handler pour la soumission du formulaire
  const handleFormSubmit = async (formData) => {
    try {
      if (formMode === 'create') {
        await clientsAPI.create(formData);
      } else {
        await clientsAPI.update(selectedClient.id, formData);
      }
      
      setShowForm(false);
      setSelectedClient(null);
      await loadClients(); // Recharger la liste
    } catch (err) {
      console.error('Erreur lors de la sauvegarde:', err);
      throw err; // Laisser le formulaire gérer l'erreur
    }
  };

  // Handler pour fermer les modales
  const handleCloseForm = () => {
    setShowForm(false);
    setSelectedClient(null);
  };

  const handleCloseView = () => {
    setShowView(false);
    setSelectedClient(null);
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
                onClick={loadClients}
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
          <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
          <p className="mt-2 text-sm text-gray-700">
            Gérez vos clients et leurs informations de contact.
          </p>
        </div>
        {/* Bouton 'Nouveau client' supprimé */}
      </div>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                  <span className="text-indigo-600 font-semibold text-sm">T</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total clients
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {clients.length}
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
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 font-semibold text-sm">@</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Avec email
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {Array.isArray(clients) ? clients.filter(c => c.email).length : 0}
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
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-semibold text-sm">📞</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Avec téléphone
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {Array.isArray(clients) ? clients.filter(c => c.telephone).length : 0}
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
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-purple-600 font-semibold text-sm">📍</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Avec adresse
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {Array.isArray(clients) ? clients.filter(c => c.adresse).length : 0}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Liste des clients */}
      <div className="bg-white shadow rounded-lg">
        <ClientList
          clients={clients}
          onEdit={handleEdit}
          onView={handleView}
          onDelete={handleDelete}
        />
      </div>

      {/* Modal Formulaire */}
      {showForm && (
        <ClientForm
          client={selectedClient}
          mode={formMode}
          onSubmit={handleFormSubmit}
          onCancel={handleCloseForm}
        />
      )}

      {/* Modal Vue détaillée */}
      {showView && (
        <ClientView
          client={selectedClient}
          onClose={handleCloseView}
        />
      )}
    </div>
  );
};

export default ClientsPage;