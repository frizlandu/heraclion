import React from 'react';

const CaisseForm = ({ form, onChange, onSubmit, submitting }) => {
  return (
    <form className="mt-6 bg-gray-50 p-4 rounded shadow" onSubmit={onSubmit}>
      <div className="flex flex-wrap gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-700">Date</label>
          <input type="date" name="date" value={form.date} onChange={onChange} className="border rounded px-2 py-1" required />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700">Libellé</label>
          <input
            type="text"
            name="libelle"
            value={form.libelle}
            onChange={onChange}
            className="border rounded px-2 py-1"
            autoComplete="off"
            required
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700">Type</label>
          <select name="type" value={form.type} onChange={onChange} className="border rounded px-2 py-1">
            <option value="entree">Entrée</option>
            <option value="sortie">Sortie</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700">Montant</label>
          <input type="number" name="montant" value={form.montant} onChange={onChange} className="border rounded px-2 py-1" required />
        </div>
      </div>
      <button
        type="submit"
        className="mt-4 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded shadow"
        disabled={submitting}
      >
        {submitting ? 'Ajout en cours...' : 'Ajouter opération'}
      </button>
    </form>
  );
};

export default CaisseForm;
