
import React, { useEffect, useState } from 'react';
import DataTable from '../components/common/DataTable/DataTable';
import { PencilIcon, TrashIcon, PrinterIcon } from '@heroicons/react/24/outline';

const PaiePage = () => {
  const [paiements, setPaiements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({ date: '', agent: '', montant: '', commentaire: '', devise: 'USD', taux: '' });
  const [adding, setAdding] = useState(false);
  // Pour édition
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({ date: '', agent: '', montant: '', commentaire: '', devise: 'USD', taux: '' });
  const [showEditModal, setShowEditModal] = useState(false);
    // Solde caisse
    const [soldeCaisse, setSoldeCaisse] = useState(null);

    // Récupère le solde caisse
    const fetchSoldeCaisse = async () => {
      try {
        const res = await fetch('/api/caisse/solde');
        if (!res.ok) throw new Error('Erreur chargement solde caisse');
        const data = await res.json();
        setSoldeCaisse(data.solde);
      } catch (err) {
        setSoldeCaisse(null);
      }
    };
  // Ouvre le modal d'édition avec les valeurs du paiement
  const handleEditClick = (p) => {
    setEditId(p.id);
    setEditForm({
      date: p.date,
      agent: p.agent,
      montant: Math.abs(p.montant),
      commentaire: p.commentaire || '',
      devise: p.devise || 'USD',
      taux: p.taux || '',
    });
    setShowEditModal(true);
  };

  // Envoie la modification
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const res = await fetch(`/api/paie/${editId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editForm,
          montant: Number(editForm.montant),
          devise: editForm.devise,
          taux: editForm.devise === 'CDF' ? Number(editForm.taux) : '',
        })
      });
      if (!res.ok) throw new Error('Erreur modification paiement');
      setShowEditModal(false);
      setEditId(null);
      fetchPaiements();
        fetchSoldeCaisse();
    } catch (err) {
      setError(err.message);
    }
  };

  // Suppression avec confirmation
  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer ce paiement ?')) return;
    setError(null);
    try {
      const res = await fetch(`/api/paie/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Erreur suppression paiement');
      fetchPaiements();
        fetchSoldeCaisse();
    } catch (err) {
      setError(err.message);
    }
  };

  const fetchPaiements = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/paie');
      if (!res.ok) throw new Error('Erreur chargement paiements');
      setPaiements(await res.json());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPaiements(); }, []);

  const handleFormChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleAdd = async e => {
    e.preventDefault();
    setAdding(true);
    setError(null);
    try {
      const res = await fetch('/api/paie', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          montant: Number(form.montant),
          devise: form.devise,
          taux: form.devise === 'CDF' ? Number(form.taux) : '',
        })
      });
      if (!res.ok) throw new Error('Erreur ajout paiement');
  setForm({ date: '', agent: '', montant: '', commentaire: '', devise: 'USD', taux: '' });
      fetchPaiements();
        fetchSoldeCaisse();
    } catch (err) {
      setError(err.message);
    } finally {
      setAdding(false);
    }
  };
  useEffect(() => {
    fetchPaiements();
    fetchSoldeCaisse();
  }, []);

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <h2 className="text-2xl font-bold mb-6 text-gray-900">Paiement des agents</h2>
        <h2 className="text-2xl font-bold mb-6 text-gray-900">Paiement des agents</h2>
        <div className="mb-4 flex items-center gap-4">
          <span className="font-semibold">Solde caisse (USD) :</span>
          {soldeCaisse === null ? (
            <span className="text-gray-400">Chargement...</span>
          ) : (
            <span className={"text-lg font-bold " + (Number(soldeCaisse) >= 0 ? 'text-green-700' : 'text-red-700')}>
              {Number.isFinite(Number(soldeCaisse))
                ? Number(soldeCaisse).toLocaleString('en-US', { style: 'currency', currency: 'USD' })
                : '$0.00'}
            </span>
          )}
        </div>
      <div className="bg-white shadow rounded-lg p-6 mb-6">
  <form className="flex flex-wrap gap-4 items-end" onSubmit={handleAdd}>
          <div>
            <label className="block text-xs font-medium text-gray-700">Date</label>
            <input type="date" name="date" value={form.date} onChange={handleFormChange} className="border rounded px-2 py-1" required />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700">Agent</label>
            <input type="text" name="agent" value={form.agent} onChange={handleFormChange} className="border rounded px-2 py-1" required placeholder="Nom de l'agent" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700">Montant</label>
            <input type="number" name="montant" value={form.montant} onChange={handleFormChange} className="border rounded px-2 py-1" required min="0" step="any" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700">Commentaire</label>
            <input type="text" name="commentaire" value={form.commentaire} onChange={handleFormChange} className="border rounded px-2 py-1" placeholder="Salaire Octobre..." />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700">Devise</label>
            <select name="devise" value={form.devise} onChange={handleFormChange} className="border rounded px-2 py-1">
              <option value="USD">USD ($)</option>
              <option value="CDF">Franc congolais (CDF)</option>
            </select>
          </div>
          {form.devise === 'CDF' && (
            <div>
              <label className="block text-xs font-medium text-gray-700">Taux (1 USD en CDF)</label>
              <input type="number" name="taux" value={form.taux} onChange={handleFormChange} className="border rounded px-2 py-1" min="0" step="any" required={form.devise === 'CDF'} />
            </div>
          )}
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded" disabled={adding}>
            {adding ? 'Ajout...' : 'Ajouter paiement'}
          </button>
        </form>
        {error && <div className="text-red-600 mt-2">{error}</div>}
      </div>
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">Historique des paiements</h3>
        <DataTable
          data={paiements}
          columns={[
            {
              key: 'date',
              label: 'Date',
              sortable: true,
              render: (value, p) => <span>{p.date}</span>
            },
            {
              key: 'agent',
              label: 'Agent',
              sortable: true,
              render: (value, p) => <span>{p.agent}</span>
            },
            {
              key: 'montant',
              label: 'Montant',
              sortable: true,
              render: (value, p) => {
                let deviseAffiche = p.devise || 'USD';
                let montant = (-Math.abs(p.montant)).toLocaleString(deviseAffiche === 'USD' ? 'en-US' : 'fr-FR', { style: 'currency', currency: deviseAffiche });
                let montantConverti = '';
                if (p.devise === 'CDF' && p.taux) {
                  montantConverti = (-Math.abs(p.montant) / p.taux).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
                } else if (p.devise === 'USD' && p.taux) {
                  montantConverti = (-Math.abs(p.montant) * p.taux).toLocaleString('fr-FR', { style: 'currency', currency: 'CDF' });
                }
                return <span className="font-bold text-red-700">{montant}{montantConverti && <span className="block text-xs text-gray-500">≈ {montantConverti}</span>}</span>;
              }
            },
            {
              key: 'devise',
              label: 'Devise',
              sortable: false,
              render: (value, p) => <span>{p.devise || 'USD'}</span>
            },
            {
              key: 'taux',
              label: 'Taux',
              sortable: false,
              render: (value, p) => <span>{p.taux || ''}</span>
            },
            {
              key: 'commentaire',
              label: 'Commentaire',
              sortable: false,
              render: (value, p) => <span>{p.commentaire}</span>
            },
            {
              key: 'actions',
              label: 'Actions',
              sortable: false,
              render: (value, p) => (
                <div className="flex space-x-2">
                  <button className="p-1 rounded hover:bg-gray-100 text-green-600 hover:text-green-900" title="Modifier" onClick={() => handleEditClick(p)}>
                    <PencilIcon className="w-4 h-4" />
                  </button>
                  <button className="p-1 rounded hover:bg-gray-100 text-red-600 hover:text-red-900" title="Supprimer" onClick={() => handleDelete(p.id)}>
                    <TrashIcon className="w-4 h-4" />
                  </button>
                  <button className="p-1 rounded hover:bg-gray-100 text-blue-600 hover:text-blue-900" title="Imprimer bon" onClick={() => window.open(`/api/paie/${p.id}/bon`, '_blank')}>
                    <PrinterIcon className="w-4 h-4" />
                  </button>
                </div>
              )
            }
          ]}
          loading={loading}
          searchPlaceholder="Rechercher par agent, commentaire..."
          emptyMessage="Aucun paiement trouvé"
        />
      </div>

      {/* Modal d'édition */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h4 className="text-lg font-bold mb-4">Modifier le paiement</h4>
            <form className="flex flex-col gap-3" onSubmit={handleEditSubmit}>
              <input type="date" name="date" value={editForm.date} onChange={e => setEditForm({ ...editForm, date: e.target.value })} className="border rounded px-2 py-1" required />
              <input type="text" name="agent" value={editForm.agent} onChange={e => setEditForm({ ...editForm, agent: e.target.value })} className="border rounded px-2 py-1" required placeholder="Agent" />
              <input type="number" name="montant" value={editForm.montant} onChange={e => setEditForm({ ...editForm, montant: e.target.value })} className="border rounded px-2 py-1" required min="0" step="any" />
              <select name="devise" value={editForm.devise} onChange={e => setEditForm({ ...editForm, devise: e.target.value })} className="border rounded px-2 py-1">
                <option value="USD">USD ($)</option>
                <option value="CDF">Franc congolais (CDF)</option>
              </select>
              {editForm.devise === 'CDF' && (
                <input type="number" name="taux" value={editForm.taux} onChange={e => setEditForm({ ...editForm, taux: e.target.value })} className="border rounded px-2 py-1" min="0" step="any" required={editForm.devise === 'CDF'} placeholder="Taux (1 USD en CDF)" />
              )}
              <input type="text" name="commentaire" value={editForm.commentaire} onChange={e => setEditForm({ ...editForm, commentaire: e.target.value })} className="border rounded px-2 py-1" placeholder="Commentaire" />
              <div className="flex gap-2 mt-2">
                <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Enregistrer</button>
                <button type="button" className="bg-gray-300 px-4 py-2 rounded" onClick={() => setShowEditModal(false)}>Annuler</button>
              </div>
            </form>
          </div>
        </div>
    </div>
  );
};

export default PaiePage;
