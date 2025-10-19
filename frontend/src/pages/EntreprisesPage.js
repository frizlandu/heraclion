import React, { useEffect, useState } from 'react';
import { entreprisesAPI } from '../services/entreprisesAPI';
import toast from 'react-hot-toast';
import DataTable from '../components/common/DataTable/DataTable';
import { PencilIcon, TrashIcon, EyeIcon } from '@heroicons/react/24/outline';


const EntreprisesPage = () => {

  const [entreprises, setEntreprises] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  // CRUD state
  const [showModal, setShowModal] = useState(false);
  const [editEntreprise, setEditEntreprise] = useState(null);
  const [form, setForm] = useState({ nom: '', type_entreprise: '', telephone: '', adresse: '' });
  const [formLoading, setFormLoading] = useState(false);


  const fetchEntreprises = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { page, limit, search, type };
      const response = await entreprisesAPI.getAll(params);
      setEntreprises(response.data || response);
      setTotalPages(response.totalPages || 1);
    } catch (err) {
      setError('Erreur lors du chargement des entreprises');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntreprises();
    // eslint-disable-next-line
  }, [page, limit, search, type]);

  const handleSearch = e => {
    setSearch(e.target.value);
    setPage(1);
  };
  const handleType = e => {
    setType(e.target.value);
    setPage(1);
  };


  // Form helpers
  const openCreateModal = () => {
    setEditEntreprise(null);
    setForm({ nom: '', type_entreprise: '', telephone: '', adresse: '' });
    setShowModal(true);
  };
  const openEditModal = (e) => {
    setEditEntreprise(e);
    setForm({
      nom: e.nom || '',
      type_entreprise: e.type_entreprise || '',
      telephone: e.telephone || '',
      adresse: e.adresse || '',
    });
    setShowModal(true);
  };
  const closeModal = () => {
    setShowModal(false);
    setEditEntreprise(null);
    setForm({ nom: '', type_entreprise: '', telephone: '', adresse: '' });
  };

  const handleFormChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      if (editEntreprise) {
        await entreprisesAPI.update(editEntreprise.id, form);
        toast.success('Entreprise modifiée');
      } else {
        await entreprisesAPI.create(form);
        toast.success('Entreprise créée');
      }
      closeModal();
      fetchEntreprises();
    } catch (err) {
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer cette entreprise ?')) return;
    try {
      await entreprisesAPI.delete(id);
      toast.success('Entreprise supprimée');
      fetchEntreprises();
    } catch (err) {
      toast.error('Erreur lors de la suppression');
    }
  };

  // Ajoute la fonction pour supprimer tous les clients test
  const handleDeleteTestClients = async () => {
    if (!window.confirm('Supprimer tous les clients test ?')) return;
    try {
      const testClients = entreprises.filter(e => e.nom && e.nom.toLowerCase().includes('test'));
      for (const client of testClients) {
        await entreprisesAPI.delete(client.id);
      }
      toast.success('Tous les clients test ont été supprimés');
      fetchEntreprises();
    } catch (err) {
      toast.error('Erreur lors de la suppression des clients test');
    }
  };


  // Colonnes DataTable façon Factures
  const columns = [
    {
      key: 'nom',
      label: 'Nom',
      sortable: true,
      render: (value, e) => <span className="font-medium text-gray-900">{e.nom}</span>
    },
    {
      key: 'type_entreprise',
      label: 'Type',
      sortable: true,
      render: (value, e) => <span>{e.type_entreprise === 'TRANSPORT' ? 'Transport' : 'Non transport'}</span>
    },
    {
      key: 'telephone',
      label: 'Téléphone',
      sortable: false,
      render: (value, e) => <span>{e.telephone}</span>
    },
    {
      key: 'adresse',
      label: 'Adresse',
      sortable: false,
      render: (value, e) => <span>{e.adresse}</span>
    },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      render: (value, e) => (
        <div className="flex space-x-2">
          <button onClick={() => openEditModal(e)} className="p-1 rounded hover:bg-gray-100 text-green-600 hover:text-green-900" title="Modifier">
            <PencilIcon className="w-4 h-4" />
          </button>
          <button onClick={() => handleDelete(e.id)} className="p-1 rounded hover:bg-gray-100 text-red-600 hover:text-red-900" title="Supprimer">
            <TrashIcon className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Entreprises</h2>
        <button onClick={openCreateModal} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Ajouter</button>
      </div>
      <div className="flex gap-4 mb-4">
        <input type="text" placeholder="Recherche par nom..." value={search} onChange={handleSearch} className="border rounded px-2 py-1" />
        <select value={type} onChange={handleType} className="border rounded px-2 py-1">
          <option value="">Tous types</option>
          <option value="TRANSPORT">Transport</option>
          <option value="NON_TRANSPORT">Non transport</option>
        </select>
      </div>
      <DataTable
        data={entreprises}
        columns={columns}
        loading={loading}
        searchPlaceholder="Rechercher par nom, type..."
        emptyMessage="Aucune entreprise trouvée"
      />
      <div className="flex justify-between items-center mt-4">
        <div>
          <span className="font-semibold">{entreprises.length} entreprises affichées</span>
        </div>
        <div className="flex items-center space-x-2">
          <button onClick={handleDeleteTestClients} className="px-3 py-1 rounded bg-red-500 text-white hover:bg-red-600">Supprimer tous les clients test</button>
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 rounded bg-gray-200">Précédent</button>
          <span>Page {page} / {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1 rounded bg-gray-200">Suivant</button>
        </div>
      </div>

      {/* Modal Formulaire */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded shadow-lg p-8 w-full max-w-md relative">
            <button onClick={closeModal} className="absolute top-2 right-2 text-gray-500 hover:text-gray-800">✕</button>
            <h3 className="text-lg font-bold mb-4">{editEntreprise ? 'Modifier' : 'Ajouter'} une entreprise</h3>
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium">Nom</label>
                <input name="nom" value={form.nom} onChange={handleFormChange} required className="border rounded px-2 py-1 w-full" />
              </div>
              <div>
                <label className="block text-sm font-medium">Type</label>
                <select name="type_entreprise" value={form.type_entreprise} onChange={handleFormChange} required className="border rounded px-2 py-1 w-full">
                  <option value="">Sélectionner</option>
                  <option value="TRANSPORT">Transport</option>
                  <option value="NON_TRANSPORT">Non transport</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium">Téléphone</label>
                <input name="telephone" value={form.telephone} onChange={handleFormChange} className="border rounded px-2 py-1 w-full" />
              </div>
              <div>
                <label className="block text-sm font-medium">Adresse</label>
                <input name="adresse" value={form.adresse} onChange={handleFormChange} className="border rounded px-2 py-1 w-full" />
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={closeModal} className="px-4 py-2 rounded bg-gray-200">Annuler</button>
                <button type="submit" disabled={formLoading} className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700">{formLoading ? 'Enregistrement...' : 'Enregistrer'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EntreprisesPage;
