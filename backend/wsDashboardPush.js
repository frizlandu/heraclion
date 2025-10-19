// backend/wsDashboardPush.js
// Envoi automatique des stats/activités dashboard via WebSocket

const { broadcastDashboardUpdate } = require('./wsServer');
const BaseModelBase = require('./models/base/BaseModel');

async function getDashboardData() {
  // Récupérer stats et activités récentes (mêmes requêtes que dashboard/stats et /recent-activities)
  const DocumentModel = require('./models/DocumentModel');
  const StockModel = new BaseModelBase('stocks');
  const CaisseModel = new BaseModelBase('caisse');
  const ClientsModel = new BaseModelBase('clients');
  const EntreprisesModel = new BaseModelBase('entreprises');

  // Statistiques
  let totalFactures = 0, totalProformas = 0, totalClients = 0, totalEntreprises = 0;
  try { totalFactures = await DocumentModel.count('type_document = $1', ['facture']); } catch (e) { console.error('Erreur count facture:', e); }
  try { totalProformas = await DocumentModel.count('type_document = $1', ['proforma']); } catch (e) { console.error('Erreur count proforma:', e); }
  try { totalClients = await ClientsModel.count(); } catch (e) { console.error('Erreur count clients:', e); }
  try { totalEntreprises = await EntreprisesModel.count(); } catch (e) { console.error('Erreur count entreprises:', e); }

  // Activités récentes
  let recentFactures = [], recentProformas = [], recentStocks = [], recentCaisse = [];
  try { recentFactures = await DocumentModel.findAll({ limit: 5, orderBy: 'created_at', orderDirection: 'DESC', where: 'type_document = $1', whereParams: ['facture'] }); } catch (e) { console.error('Erreur findAll facture:', e); }
  try { recentProformas = await DocumentModel.findAll({ limit: 5, orderBy: 'created_at', orderDirection: 'DESC', where: 'type_document = $1', whereParams: ['proforma'] }); } catch (e) { console.error('Erreur findAll proforma:', e); }
  try { recentStocks = await StockModel.findAll({ limit: 5, orderBy: 'updated_at', orderDirection: 'DESC' }); } catch (e) { console.error('Erreur findAll stocks:', e); }
  try { recentCaisse = await CaisseModel.findAll({ limit: 5, orderBy: 'date_operation', orderDirection: 'DESC' }); } catch (e) { console.error('Erreur findAll caisse:', e); }

  const activities = [
    ...recentFactures.map(facture => ({
      type: 'Facture',
      message: `Nouvelle facture pour ${facture.client_id}`,
      date: facture.created_at
    })),
    ...recentProformas.map(proforma => ({
      type: 'Proforma',
      message: `Nouveau proforma pour ${proforma.client_id}`,
      date: proforma.created_at
    })),
    ...recentStocks.map(stock => ({
      type: 'Stock',
      message: `Mise à jour du stock pour ${stock.designation || stock.reference}`,
      date: stock.updated_at || stock.created_at
    })),
    ...recentCaisse.map(op => ({
      type: 'Caisse',
      message: `Opération caisse : ${op.description || op.type_operation}`,
      date: op.date_operation || op.created_at
    })),
  ];
  activities.sort((a, b) => new Date(b.date) - new Date(a.date));
  const activitiesLimited = activities.slice(0, 10);

  return {
    stats: {
      totalFactures,
      totalProformas,
      totalClients,
      totalEntreprises,
      date: new Date().toISOString()
    },
    activities: activitiesLimited
  };
}


let dashboardInterval = null;
function startDashboardPush() {
  dashboardInterval = setInterval(async () => {
    const data = await getDashboardData();
    console.log('[DashboardPush] Données envoyées au dashboard :', JSON.stringify(data, null, 2));
    broadcastDashboardUpdate(data);
  }, 30000); // 30s
}

function stopDashboardPush() {
  if (dashboardInterval) {
    clearInterval(dashboardInterval);
    dashboardInterval = null;
    console.log('Dashboard push interval cleared');
  }
}

module.exports = { startDashboardPush, stopDashboardPush };
