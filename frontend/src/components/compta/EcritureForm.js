import React, { useState } from 'react';
import toast from 'react-hot-toast';

const initialForm = {
  date: '',
  client_id: '',
  client_nom: '',
  type: '', // revenu, depense, banque, inventaire, amortissement, regul
  libelle: '',
  montant: '',
  devise: 'USD',
  taux: '',
};

const EcritureForm = ({ onSuccess }) => {
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/comptabilite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          montant: parseFloat(form.montant),
          taux: form.devise === 'CDF' ? parseFloat(form.taux) : undefined,
        })
      });
      if (!res.ok) throw new Error('Erreur lors de l\'ajout');
      setForm(initialForm);
      toast.success('Écriture ajoutée');
      if (onSuccess) onSuccess();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="flex flex-wrap gap-4 mb-6" onSubmit={handleSubmit}>
      <div>
        <label className="block text-xs font-medium text-gray-700">Date</label>
        <input type="date" name="date" value={form.date} onChange={handleChange} className="border rounded px-2 py-1" required />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-700">Client ID</label>
        <input type="text" name="client_id" value={form.client_id} onChange={handleChange} className="border rounded px-2 py-1" />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-700">Client Nom</label>
        <input type="text" name="client_nom" value={form.client_nom} onChange={handleChange} className="border rounded px-2 py-1" />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-700">Type</label>
        <select name="type" value={form.type} onChange={handleChange} className="border rounded px-2 py-1" required>
          <option value="">Choisir</option>
          <option value="revenu">Revenu</option>
          <option value="depense">Dépense</option>
          <option value="banque">Banque</option>
          <option value="inventaire">Inventaire</option>
          <option value="amortissement">Amortissement</option>
          <option value="regul">Régularisation</option>
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-700">Libellé</label>
        <input type="text" name="libelle" value={form.libelle} onChange={handleChange} className="border rounded px-2 py-1" required />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-700">Montant</label>
        <input type="number" name="montant" value={form.montant} onChange={handleChange} className="border rounded px-2 py-1" required min="0" step="any" />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-700">Devise</label>
        <select name="devise" value={form.devise} onChange={handleChange} className="border rounded px-2 py-1">
          <option value="USD">USD ($)</option>
          <option value="CDF">Franc congolais (CDF)</option>
        </select>
      </div>
      {form.devise === 'CDF' && (
        <div>
          <label className="block text-xs font-medium text-gray-700">Taux (1 USD en CDF)</label>
          <input type="number" name="taux" value={form.taux} onChange={handleChange} className="border rounded px-2 py-1" min="0" step="any" required={form.devise === 'CDF'} />
        </div>
      )}
      <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded" disabled={loading}>
        {loading ? 'Ajout...' : 'Ajouter écriture'}
      </button>
    </form>
  );
};

export default EcritureForm;
