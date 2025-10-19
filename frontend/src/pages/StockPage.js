import React, { useState, useEffect, useCallback } from 'react';
import {
  PlusIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  AdjustmentsHorizontalIcon
} from '@heroicons/react/24/outline';
import DataTable from '../components/common/DataTable/DataTable';
import { stockAPI } from '../services/stockAPI';
import StockForm from '../components/stock/StockForm';
import StockView from '../components/stock/StockView';
import StockAdjustment from '../components/stock/StockAdjustment';

const StockPage = () => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showView, setShowView] = useState(false);
  const [showAdjustment, setShowAdjustment] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [formMode, setFormMode] = useState('create');
  // Charger la liste des articles
  const loadArticles = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
  const data = await stockAPI.getAll({ limit: 1000 });
  // Correction du mapping pour s'adapter à la structure exacte de la réponse backend
  const articlesList = Array.isArray(data?.data?.data) ? data.data.data : Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
  setArticles(articlesList);
    } catch (err) {
      setError('Erreur lors du chargement des articles');
      setArticles([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadArticles();
  }, [loadArticles]);

  const handleCreate = () => {
    setSelectedArticle(null);
    setFormMode('create');
    setShowForm(true);
  };

  const handleEdit = async (article) => {
    setSelectedArticle(article);
    setFormMode('edit');
    setShowForm(true);
  };

  const handleView = (article) => {
    setSelectedArticle(article);
    setShowView(true);
  };

  const handleDelete = async (article) => {
    if (window.confirm('Supprimer cet article ?')) {
      setError(null);
      setSuccess(null);
      try {
        await stockAPI.delete(article.id);
        setSuccess('Article supprimé avec succès.');
        await loadArticles();
      } catch (err) {
        if (err?.response?.status === 404) {
          setError('Article déjà supprimé ou inexistant.');
        } else if (err?.response?.data?.message) {
          setError('Erreur : ' + err.response.data.message);
        } else {
          setError('Erreur lors de la suppression.');
        }
      }
    }
  };

  const handleAdjustStock = (article) => {
    setSelectedArticle(article);
    setShowAdjustment(true);
  };

  const handleFormSuccess = async () => {
    setShowForm(false);
    setSelectedArticle(null);
    // Attendre un court délai pour garantir la propagation côté backend
    setTimeout(() => {
      loadArticles();
    }, 300);
  };

  const handleAdjustmentSuccess = () => {
    setShowAdjustment(false);
    setSelectedArticle(null);
    loadArticles();
  };

  // Colonnes du DataTable
  const columns = [
    {
      key: 'designation',
      label: 'Désignation',
      sortable: true,
      render: (value, a) => <span className="font-medium text-gray-900">{a.designation || a.nom}</span>
    },
    {
      key: 'reference',
      label: 'Référence',
      sortable: true,
      render: (value, a) => <span>{a.reference}</span>
    },
    {
      key: 'quantite_stock',
      label: 'Quantité',
      sortable: true,
      render: (value, a) => <span>{a.quantite_stock} {a.unite || 'pièce'}{a.quantite_stock > 1 ? 's' : ''}</span>
    },
    {
      key: 'prix_achat',
      label: 'Prix achat',
      sortable: true,
      render: (value, a) => <span>{a.prix_achat} €</span>
    },
    {
      key: 'prix_vente',
      label: 'Prix vente',
      sortable: true,
      render: (value, a) => <span>{a.prix_vente} €</span>
    },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      render: (value, a) => (
        <div className="flex space-x-2">
          <button onClick={() => handleView(a)} className="p-1 rounded hover:bg-gray-100 text-indigo-600 hover:text-indigo-900" title="Voir">
            <EyeIcon className="w-4 h-4" />
          </button>
          <button onClick={() => handleAdjustStock(a)} className="p-1 rounded hover:bg-gray-100 text-green-600 hover:text-green-900" title="Ajuster le stock">
            <AdjustmentsHorizontalIcon className="w-4 h-4" />
          </button>
          <button onClick={() => handleEdit(a)} className="p-1 rounded hover:bg-gray-100 text-blue-600 hover:text-blue-900" title="Modifier">
            <PencilIcon className="w-4 h-4" />
          </button>
          <button onClick={() => handleDelete(a)} className="p-1 rounded hover:bg-gray-100 text-red-600 hover:text-red-900" title="Supprimer">
            <TrashIcon className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative" role="alert">
          <span className="block sm:inline">{success}</span>
        </div>
      )}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Stock</h1>
        <button onClick={handleCreate} className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
          <PlusIcon className="w-5 h-5 mr-2" /> Nouvel article
        </button>
      </div>
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="px-4 py-2 text-sm text-gray-500">Articles reçus : {Array.isArray(articles) ? articles.length : 0}</div>
        <DataTable
          data={articles}
          columns={columns}
          loading={loading}
          searchPlaceholder="Rechercher par désignation, référence..."
          emptyMessage="Aucun article trouvé"
        />
      </div>
      {/* Modales */}
      {showForm && (
        <StockForm
          article={selectedArticle}
          mode={formMode}
          onClose={() => setShowForm(false)}
          onSuccess={handleFormSuccess}
        />
      )}
      {showView && selectedArticle && (
        <StockView
          article={selectedArticle}
          onClose={() => setShowView(false)}
          onEdit={() => {
            setShowView(false);
            handleEdit(selectedArticle);
          }}
          onAdjustStock={() => {
            setShowView(false);
            handleAdjustStock(selectedArticle);
          }}
        />
      )}
      {showAdjustment && selectedArticle && (
        <StockAdjustment
          article={selectedArticle}
          onClose={() => setShowAdjustment(false)}
          onSuccess={handleAdjustmentSuccess}
        />
      )}
    </div>
  );
};

export default StockPage;