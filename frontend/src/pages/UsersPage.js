import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newUser, setNewUser] = useState({ nom: '', email: '', role: 'user', mot_de_passe: '' });
  const [creating, setCreating] = useState(false);
  const handleCreateUser = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser)
      });
      if (!res.ok) throw new Error();
      toast.success('Utilisateur créé');
      setNewUser({ nom: '', email: '', role: 'user', mot_de_passe: '' });
      fetchUsers();
    } catch {
      toast.error('Erreur création utilisateur');
    } finally {
      setCreating(false);
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/users');
      if (!res.ok) throw new Error('Erreur API');
      setUsers(await res.json());
    } catch (e) {
      toast.error('Erreur chargement utilisateurs');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (id, newRole) => {
    try {
      const res = await fetch(`/api/users/${id}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole })
      });
      if (!res.ok) throw new Error();
      toast.success('Rôle modifié');
      fetchUsers();
    } catch {
      toast.error('Erreur modification rôle');
    }
  };

  const handleActifToggle = async (id, actif) => {
    try {
      const res = await fetch(`/api/users/${id}/actif`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actif })
      });
      if (!res.ok) throw new Error();
      toast.success(actif ? 'Utilisateur activé' : 'Utilisateur désactivé');
      fetchUsers();
    } catch {
      toast.error('Erreur activation/désactivation');
    }
  };

  useEffect(() => { fetchUsers(); }, []);

    const handleResetPassword = async (id) => {
      if (!window.confirm('Réinitialiser le mot de passe de cet utilisateur ?')) return;
      try {
        const res = await fetch(`/api/users/${id}/reset-password`, { method: 'POST' });
        if (!res.ok) throw new Error();
        const data = await res.json();
        toast.success(`Mot de passe réinitialisé: ${data.tempPassword}`);
      } catch {
        toast.error('Erreur réinitialisation mot de passe');
      }
    };

    const handleDeleteUser = async (id) => {
      if (!window.confirm('Supprimer cet utilisateur ?')) return;
      try {
        const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error();
        toast.success('Utilisateur supprimé');
        fetchUsers();
      } catch {
        toast.error('Erreur suppression utilisateur');
      }
    };

    return (
      <div className="max-w-3xl mx-auto py-8">
        <h2 className="text-2xl font-bold mb-4">Utilisateurs</h2>
        <form onSubmit={handleCreateUser} className="mb-6 flex flex-wrap gap-2 items-end bg-gray-50 p-3 rounded">
          <input
            type="text"
            placeholder="Nom"
            value={newUser.nom}
            onChange={e => setNewUser(u => ({ ...u, nom: e.target.value }))}
            className="border px-2 py-1 rounded"
            required
          />
          <input
            type="email"
            placeholder="Email"
            value={newUser.email}
            onChange={e => setNewUser(u => ({ ...u, email: e.target.value }))}
            className="border px-2 py-1 rounded"
            required
          />
          <select
            value={newUser.role}
            onChange={e => setNewUser(u => ({ ...u, role: e.target.value }))}
            className="border px-2 py-1 rounded"
          >
            <option value="user">user</option>
            <option value="admin">admin</option>
          </select>
          <input
            type="text"
            placeholder="Mot de passe initial"
            value={newUser.mot_de_passe}
            onChange={e => setNewUser(u => ({ ...u, mot_de_passe: e.target.value }))}
            className="border px-2 py-1 rounded"
            required
          />
          <button
            type="submit"
            className="bg-green-200 hover:bg-green-300 px-3 py-1 rounded"
            disabled={creating}
          >Créer</button>
        </form>
        {loading ? <div>Chargement...</div> : (
          <table className="w-full border">
            <thead>
              <tr className="bg-gray-100">
                <th className="border px-2 py-1">Nom</th>
                <th className="border px-2 py-1">Email</th>
                <th className="border px-2 py-1">Rôle</th>
                <th className="border px-2 py-1">Actif</th>
                <th className="border px-2 py-1">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td className="border px-2 py-1">{u.nom || u.name}</td>
                  <td className="border px-2 py-1">{u.email}</td>
                  <td className="border px-2 py-1">
                    <select
                      value={u.role}
                      onChange={e => handleRoleChange(u.id, e.target.value)}
                      className="border rounded px-1 py-0.5"
                    >
                      <option value="user">user</option>
                      <option value="admin">admin</option>
                    </select>
                  </td>
                  <td className="border px-2 py-1">
                    <button
                      onClick={() => handleActifToggle(u.id, !u.actif)}
                      className={`px-2 py-0.5 rounded ${u.actif ? 'bg-green-200' : 'bg-red-200'}`}
                    >
                      {u.actif ? 'Oui' : 'Non'}
                    </button>
                  </td>
                  <td className="border px-2 py-1">
                    <button
                      onClick={() => handleResetPassword(u.id)}
                      className="bg-blue-200 hover:bg-blue-300 px-2 py-0.5 rounded mr-2"
                    >Réinit. mot de passe</button>
                    <button
                      onClick={() => handleDeleteUser(u.id)}
                      className="bg-red-200 hover:bg-red-300 px-2 py-0.5 rounded"
                    >Supprimer</button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && <tr><td colSpan={5} className="text-center text-gray-400">Aucun utilisateur</td></tr>}
            </tbody>
          </table>
        )}
      </div>
  );
};

export default UsersPage;
