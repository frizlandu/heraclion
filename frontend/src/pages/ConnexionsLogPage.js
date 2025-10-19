import React, { useEffect, useState } from 'react';

const ConnexionsLogPage = () => {
  const [log, setLog] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch('/api/users/connexions-log')
      .then(r => r.json())
      .then(setLog)
      .catch(() => setLog([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-3xl mx-auto py-8">
      <h2 className="text-2xl font-bold mb-4">Historique des connexions</h2>
      {loading ? <div>Chargement...</div> : (
        <table className="w-full border text-xs">
          <thead>
            <tr className="bg-gray-100">
              <th className="border px-2 py-1">Date</th>
              <th className="border px-2 py-1">Email</th>
              <th className="border px-2 py-1">IP</th>
              <th className="border px-2 py-1">Succès</th>
            </tr>
          </thead>
          <tbody>
            {log.map((l, i) => (
              <tr key={i}>
                <td className="border px-2 py-1">{l.date?.replace('T', ' ').slice(0, 19)}</td>
                <td className="border px-2 py-1">{l.email}</td>
                <td className="border px-2 py-1">{l.ip}</td>
                <td className={"border px-2 py-1 " + (l.success ? 'text-green-600' : 'text-red-600')}>{l.success ? 'Oui' : 'Non'}</td>
              </tr>
            ))}
            {log.length === 0 && <tr><td colSpan={4} className="text-center text-gray-400">Aucune connexion</td></tr>}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default ConnexionsLogPage;
