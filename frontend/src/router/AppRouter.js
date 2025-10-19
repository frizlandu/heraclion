
/**
 * Routeur principal de l'application
 */
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Contexts
import { AuthProvider } from '../context/AuthContext';

// Components
import PrivateRoute from './PrivateRoute';
import MainLayout from '../components/common/Layout/MainLayout';
import ErrorBoundary from '../components/common/ErrorBoundary';

// Pages
import Login from '../pages/Auth/Login';
import DashboardPage from '../pages/Dashboard/DashboardPage';
import ClientsPage from '../pages/ClientsPage';
import FacturesPage from '../pages/FacturesPage';
import ProformasPage from '../pages/ProformasPage';
import StockPage from '../pages/StockPage';
import TestCalculs from '../components/TestCalculs';
import SimpleFactureTest from '../components/SimpleFactureTest';
import TestCalculDebug from '../components/factures/TestCalculDebug';
import TestCalculSimple from '../components/factures/TestCalculSimple';
import BeneficiairesPage from '../pages/BeneficiairesPage';
import UsersPage from '../pages/UsersPage';
import ConnexionsLogPage from '../pages/ConnexionsLogPage';

// import AccountingPage from '../pages/AccountingPage';
import CaissePage from '../pages/CaissePage';

// Configuration PDF
import PdfConfigPage from '../pages/PdfConfigPage';
import ReportsPage from '../pages/ReportsPage';
import EntreprisesPage from '../pages/EntreprisesPage';
import SettingsPage from '../pages/SettingsPage';

const AppRouter = () => {
  return (
    <Router>
      <AuthProvider>
        <ErrorBoundary>
          <div className="App">
            <Routes>
              {/* Route publique - Connexion */}
              <Route path="/login" element={<Login />} />
              {/* Routes protégées */}
              <Route path="/*" element={
                <PrivateRoute>
                  <MainLayout>
                    <Routes>
                      <Route path="/" element={<DashboardPage />} />
                      {/* Pages fonctionnelles */}
                      <Route path="/clients" element={<ClientsPage />} />
                      <Route path="/factures" element={<FacturesPage />} />
                      <Route path="/proformas" element={<ProformasPage />} />
                      <Route path="/stock" element={<StockPage />} />
                      <Route path="/caisse" element={<CaissePage />} />
                      <Route path="/rapports" element={<ReportsPage />} />
                      <Route path="/entreprises" element={<EntreprisesPage />} />
                      <Route path="/parametres" element={<SettingsPage />} />
                      <Route path="/settings" element={<SettingsPage />} />
                      <Route path="/beneficiaires" element={<BeneficiairesPage />} />
                      <Route path="/utilisateurs" element={<UsersPage />} />
                      <Route path="/connexions-log" element={<ConnexionsLogPage />} />
                      {/* Configuration PDF */}
                      <Route path="/pdf-config" element={<PdfConfigPage />} />
                      {/* Tests et outils */}
                      <Route path="/test-calculs" element={<TestCalculs />} />
                      <Route path="/test-comptabilite-simple" element={<TestCalculSimple />} />
                      <Route path="/test-comptabilite" element={<TestCalculs />} />
                      <Route path="/test-comptabilite-debug" element={<TestCalculDebug />} />
                      <Route path="/simple-facture-test" element={<SimpleFactureTest />} />
                    </Routes>
                  </MainLayout>
                </PrivateRoute>
              } />
            </Routes>
            <Toaster position="top-right" />
          </div>
        </ErrorBoundary>
      </AuthProvider>
    </Router>
  );
};

export default AppRouter;