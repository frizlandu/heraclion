import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

const BeneficiairesPage = () => {
  const [beneficiaires, setBeneficiaires] = useState([]);
  const [form, setForm] = useState({ nom: '', email: '' });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchBeneficiaires = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/beneficiaires');
      setBeneficiaires(await res.json());
    } catch (e) {
      toast.error('Erreur chargement bénéficiaires');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBeneficiaires(); }, []);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.nom) return toast.error('Nom obligatoire');
    try {
      let res;
      if (editingId) {
        res = await fetch(`/api/beneficiaires/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form)
        });
      } else {
        res = await fetch('/api/beneficiaires', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form)
        });
      }
      if (!res.ok) throw new Error('Erreur API');
      setForm({ nom: '', email: '' });
      setEditingId(null);
      fetchBeneficiaires();
    } catch (e) {
      toast.error('Erreur sauvegarde');
    }
  };

  const handleEdit = b => {
    setForm({ nom: b.nom, email: b.email || '' });
    setEditingId(b.id);
  };

  const handleDelete = async id => {
    if (!window.confirm('Supprimer ce bénéficiaire ?')) return;
    try {
      await fetch(`/api/beneficiaires/${id}`, { method: 'DELETE' });
      fetchBeneficiaires();
    } catch (e) {
      toast.error('Erreur suppression');
    }
  };

  return (
    <div className="max-w-xl mx-auto py-8">
      <h2 className="text-2xl font-bold mb-4">Bénéficiaires</h2>
      <form className="flex gap-2 mb-4" onSubmit={handleSubmit}>
        <input name="nom" value={form.nom} onChange={handleChange} placeholder="Nom" className="border rounded px-2 py-1" required />
        <input name="email" value={form.email} onChange={handleChange} placeholder="Email" className="border rounded px-2 py-1" />
        <button type="submit" className="bg-blue-600 text-white px-4 py-1 rounded">{editingId ? 'Modifier' : 'Ajouter'}</button>
        {editingId && <button type="button" className="bg-gray-300 px-2 py-1 rounded" onClick={() => { setEditingId(null); setForm({ nom: '', email: '' }); }}>Annuler</button>}
      </form>
      {loading ? <div>Chargement...</div> : (
        <table className="w-full border">
          <thead>
            <tr className="bg-gray-100">
              <th className="border px-2 py-1">Nom</th>
              <th className="border px-2 py-1">Email</th>
              <th className="border px-2 py-1">Actions</th>
            </tr>
          </thead>
          <tbody>
            {beneficiaires.map(b => (
              <tr key={b.id}>
                <td className="border px-2 py-1">{b.nom}</td>
                <td className="border px-2 py-1">{b.email}</td>
                <td className="border px-2 py-1">
                  <button className="text-blue-600 mr-2" onClick={() => handleEdit(b)}>Éditer</button>
                  <button className="text-red-600" onClick={() => handleDelete(b.id)}>Supprimer</button>
                </td>
              </tr>
            ))}
            {beneficiaires.length === 0 && <tr><td colSpan={3} className="text-center text-gray-400">Aucun bénéficiaire</td></tr>}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default BeneficiairesPage;
