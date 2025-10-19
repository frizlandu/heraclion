
import React, { useEffect, useState } from 'react';
import EcritureForm from '../components/compta/EcritureForm';
import DataTable from '../components/common/DataTable/DataTable';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

const AccountingPage = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    date_debut: '',
    date_fin: '',
    client_id: '',
    type_operation: '',
  });

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filters.date_debut) params.append('date_debut', filters.date_debut);
      if (filters.date_fin) params.append('date_fin', filters.date_fin);
      if (filters.client_id) params.append('client_id', filters.client_id);
      if (filters.type_operation) params.append('type_operation', filters.type_operation);
      const res = await fetch(`/api/comptabilite?${params.toString()}`);
      if (!res.ok) throw new Error('Erreur lors du chargement des données');
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line
  }, [filters]);

  const handleChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <h2 className="text-2xl font-bold mb-6 text-gray-900">Comptabilité</h2>
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded border border-red-300">
          {error}
        </div>
      )}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">Nouvelle écriture comptable</h3>
        <EcritureForm onSuccess={fetchData} />
        <h3 className="text-lg font-semibold mb-4 text-gray-800">Filtres</h3>
        <form className="flex flex-wrap gap-4 mb-6">
          <div>
            <label className="block text-xs font-medium text-gray-700">Date début</label>
            <input type="date" name="date_debut" value={filters.date_debut} onChange={handleChange} className="border rounded px-2 py-1" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700">Date fin</label>
            <input type="date" name="date_fin" value={filters.date_fin} onChange={handleChange} className="border rounded px-2 py-1" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700">Client ID</label>
            <input type="text" name="client_id" value={filters.client_id} onChange={handleChange} className="border rounded px-2 py-1" placeholder="ID client" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700">Type d'opération</label>
            <select name="type_operation" value={filters.type_operation} onChange={handleChange} className="border rounded px-2 py-1">
              <option value="">Tous</option>
              <option value="revenu">Revenu</option>
              <option value="depense">Dépense</option>
            </select>
          </div>
        </form>
        <h3 className="text-lg font-semibold mb-4 text-gray-800">Écritures comptables</h3>
        <DataTable
          data={data}
          columns={[
            {
              key: 'date',
              label: 'Date',
              sortable: true,
              render: (value, e) => <span>{e.date}</span>
            },
            {
              key: 'client_nom',
              label: 'Client',
              sortable: false,
              render: (value, e) => <span>{e.client_nom || e.client_id}</span>
            },
            {
              key: 'type',
              label: 'Type',
              sortable: true,
              render: (value, e) => <span>{e.type}</span>
            },
            {
              key: 'libelle',
              label: 'Libellé',
              sortable: false,
              render: (value, e) => <span>{e.libelle}</span>
            },
            {
              key: 'montant_usd',
              label: 'Montant (USD)',
              sortable: true,
              render: (value, e) => {
                let montantUSD = e.montant;
                if (e.devise === 'CDF' && e.taux) {
                  montantUSD = e.montant / e.taux;
                }
                return <span className={"font-bold " + (montantUSD >= 0 ? 'text-green-700' : 'text-red-700')}>{montantUSD.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</span>;
              }
            },
            {
              key: 'actions',
              label: 'Actions',
              sortable: false,
              render: (value, e) => (
                <div className="flex space-x-2">
                  <button className="p-1 rounded hover:bg-gray-100 text-green-600 hover:text-green-900" title="Modifier" onClick={() => {/* TODO: ouvrir modal édition */}}>
                    <PencilIcon className="w-4 h-4" />
                  </button>
                  <button className="p-1 rounded hover:bg-gray-100 text-red-600 hover:text-red-900" title="Supprimer" onClick={() => {/* TODO: suppression */}}>
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              )
            }
          ]}
          loading={loading}
          searchPlaceholder="Rechercher par client, libellé..."
          emptyMessage="Aucune écriture trouvée"
        />
      </div>
    </div>
  );
};

export default AccountingPage;
