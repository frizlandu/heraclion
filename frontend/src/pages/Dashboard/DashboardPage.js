/**
 * Page Dashboard principale
 */
import React, { useState, useEffect } from 'react';
import { dashboardAPI } from '../../services/api/dashboardAPI';
import StatsCards from '../../components/dashboard/StatsCards';
import toast from 'react-hot-toast';

const DashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [activities, setActivities] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [statsRes, activitiesRes, alertsRes] = await Promise.all([
          dashboardAPI.getStats(),
          dashboardAPI.getRecentActivities(),
          dashboardAPI.getAlerts()
        ]);
        if (isMounted) {
          setStats(statsRes.success ? statsRes.data : null);
          setActivities(activitiesRes.success ? activitiesRes.data : []);
          setAlerts(alertsRes.success ? alertsRes.data : []);
        }
      } catch (error) {
        if (isMounted) toast.error('Erreur lors du chargement du dashboard');
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchAll();
    return () => { isMounted = false; };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        <span className="ml-2 text-gray-600">Chargement du dashboard...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 relative">
      {/* Indicateur de mise à jour supprimé car WebSocket = live */}
      {/* En-tête */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Vue d&apos;ensemble de votre activité
        </p>
      </div>

      {/* Cartes de statistiques */}
      {stats && <StatsCards stats={stats} />}

      {/* Autres sections à venir */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900">Activités récentes</h3>
            <p className="mt-1 text-sm text-gray-500">
              Les dernières actions effectuées
            </p>
            <div className="mt-4">
              {activities.length === 0 ? (
                <div className="text-center text-gray-400">
                  <p>Aucune activité récente.</p>
                </div>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {activities.map((activity, idx) => (
                    <li key={idx} className="py-2 flex flex-col sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <span className="font-medium text-indigo-700 mr-2">{activity.type}</span>
                        <span className="text-gray-700">{activity.description}</span>
                      </div>
                      <div className="flex items-center space-x-4 mt-1 sm:mt-0">
                        <span className="text-sm text-gray-500">{activity.status || '-'}</span>
                        <span className="text-sm text-gray-600">{activity.amount ? `${activity.amount} $` : '-'}</span>
                        <span className="text-xs text-gray-400">{activity.date ? new Date(activity.date).toLocaleDateString() : '-'}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900">Alertes</h3>
            <p className="mt-1 text-sm text-gray-500">
              Stock faible, factures en retard, etc.
            </p>
            <div className="mt-4">
              {alerts.length === 0 ? (
                <div className="text-center text-gray-400">
                  <p>Aucune alerte.</p>
                </div>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {alerts.map((alert, idx) => (
                    <li key={idx} className="py-2 flex flex-col sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <span className="font-medium text-red-700 mr-2">{alert.type || 'Alerte'}</span>
                        <span className="text-gray-700">{alert.message || alert.description}</span>
                      </div>
                      <div className="flex items-center space-x-4 mt-1 sm:mt-0">
                        <span className="text-xs text-gray-400">{alert.date ? new Date(alert.date).toLocaleDateString() : '-'}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;