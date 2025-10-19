/**
 * Composant pour afficher les détails d'un client
 */
import React from 'react';
import { XMarkIcon, UserIcon, EnvelopeIcon, PhoneIcon, MapPinIcon } from '@heroicons/react/24/outline';

const ClientView = ({ client, onClose }) => {
  if (!client) {
    return null;
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-2/3 lg:w-1/2 shadow-lg rounded-md bg-white">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Détails du client
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Contenu */}
        <div className="mt-6">
          {/* Informations principales */}
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <div className="flex items-center mb-4">
              <div className="bg-indigo-100 rounded-full p-3">
                <UserIcon className="h-8 w-8 text-indigo-600" />
              </div>
              <div className="ml-4">
                <h4 className="text-xl font-semibold text-gray-900">{client.nom}</h4>
                <p className="text-sm text-gray-500">Client #{client.id}</p>
              </div>
            </div>
          </div>

          {/* Informations de contact */}
          <div className="space-y-4">
            <h5 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
              Informations de contact
            </h5>

            {/* Email */}
            <div className="flex items-center">
              <EnvelopeIcon className="h-5 w-5 text-gray-400 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-700">Email</p>
                <p className="text-sm text-gray-600">
                  {client.email ? (
                    <a 
                      href={`mailto:${client.email}`}
                      className="text-indigo-600 hover:text-indigo-500"
                    >
                      {client.email}
                    </a>
                  ) : (
                    <span className="text-gray-400 italic">Non renseigné</span>
                  )}
                </p>
              </div>
            </div>

            {/* Téléphone */}
            <div className="flex items-center">
              <PhoneIcon className="h-5 w-5 text-gray-400 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-700">Téléphone</p>
                <p className="text-sm text-gray-600">
                  {client.telephone ? (
                    <a 
                      href={`tel:${client.telephone}`}
                      className="text-indigo-600 hover:text-indigo-500"
                    >
                      {client.telephone}
                    </a>
                  ) : (
                    <span className="text-gray-400 italic">Non renseigné</span>
                  )}
                </p>
              </div>
            </div>

            {/* Adresse */}
            <div className="flex items-start">
              <MapPinIcon className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-700">Adresse</p>
                <p className="text-sm text-gray-600 whitespace-pre-line">
                  {client.adresse || (
                    <span className="text-gray-400 italic">Non renseignée</span>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Informations système */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h5 className="text-lg font-medium text-gray-900 mb-4">
              Informations système
            </h5>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-700">Date de création</p>
                <p className="text-sm text-gray-600">{formatDate(client.created_at)}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-700">Dernière modification</p>
                <p className="text-sm text-gray-600">{formatDate(client.updated_at)}</p>
              </div>
            </div>
          </div>

          {/* Statistiques (si disponibles) */}
          {client.stats && (
            <div className="mt-8 pt-6 border-t border-gray-200">
              <h5 className="text-lg font-medium text-gray-900 mb-4">
                Statistiques
              </h5>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-sm font-medium text-blue-800">Documents</p>
                  <p className="text-2xl font-bold text-blue-900">
                    {client.stats.documents || 0}
                  </p>
                </div>
                
                <div className="bg-green-50 rounded-lg p-4">
                  <p className="text-sm font-medium text-green-800">Commandes</p>
                  <p className="text-2xl font-bold text-green-900">
                    {client.stats.commandes || 0}
                  </p>
                </div>
                
                <div className="bg-purple-50 rounded-lg p-4">
                  <p className="text-sm font-medium text-purple-800">CA Total</p>
                  <p className="text-2xl font-bold text-purple-900">
                    {client.stats.ca_total ? `${client.stats.ca_total}€` : '0€'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end mt-8 pt-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClientView;