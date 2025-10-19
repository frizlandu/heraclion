import React, { useEffect, useState } from 'react';
import { entreprisesAPI } from '../services/entreprisesAPI';
import { usePdfConfig } from '../hooks/usePdfConfig';
import { Link } from 'react-router-dom';

const SettingsPage = () => {
  const [entreprises, setEntreprises] = useState([]);
  const [loadingEntreprises, setLoadingEntreprises] = useState(true);
  const [error, setError] = useState(null);
  const { config, loading: loadingPdf, error: pdfError } = usePdfConfig();

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await entreprisesAPI.getAll();
        setEntreprises(data || []);
      } catch (e) {
        setError('Impossible de charger les entreprises');
      } finally {
        setLoadingEntreprises(false);
      }
    };
    fetch();
  }, []);

  return (
    <div className="py-8 px-6">
      <h1 className="text-2xl font-bold mb-4">Paramètres</h1>

      <section className="mb-6">
        <h2 className="text-lg font-semibold">Configuration générale</h2>
        <p className="text-sm text-gray-600">Liens rapides vers les pages de configuration.</p>
        <div className="mt-3 space-x-3">
          <Link to="/entreprises" className="text-indigo-600 underline">Gérer les entreprises</Link>
          <Link to="/pdf-config" className="text-indigo-600 underline">Configuration PDF</Link>
          <Link to="/utilisateurs" className="text-indigo-600 underline">Utilisateurs</Link>
        </div>
      </section>

      <section className="mb-6">
        <h3 className="font-medium">Entreprises</h3>
        {loadingEntreprises ? (
          <p>Chargement...</p>
        ) : error ? (
          <p className="text-red-600">{error}</p>
        ) : (
          <p>{entreprises.length} entreprise(s) configurée(s)</p>
        )}
      </section>

      <section>
        <h3 className="font-medium">Configuration PDF</h3>
        {loadingPdf ? (
          <p>Chargement configuration PDF...</p>
        ) : pdfError ? (
          <p className="text-red-600">Erreur chargement configuration PDF</p>
        ) : (
          <div>
            <p>Template actif: {config?.activeTemplate || 'Aucun'}</p>
            <p>Logos disponibles: {config?.logos?.length || 0}</p>
          </div>
        )}
      </section>
    </div>
  );
};

export default SettingsPage;
