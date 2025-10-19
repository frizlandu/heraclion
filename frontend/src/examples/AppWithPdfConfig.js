/**
 * Exemple d'intégration complète de l'interface PDF Config
 * dans une application React existante
 */
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';

// Composants existants (exemples)
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import Factures from './pages/Factures';

// Nouveaux composants PDF Config
import PdfConfigPage from './pages/PdfConfigPage';
import PdfConfigNavItem from './components/navigation/PdfConfigNavItem';

// Layout principal
import Header from './components/layout/Header';

const App = () => {
  return (
    <Router>
      <div className="flex h-screen bg-gray-100">
        {/* Sidebar avec navigation */}
        <div className="w-64 bg-white shadow-sm">
          <div className="p-6">
            <h1 className="text-xl font-bold text-gray-800">HERACLION</h1>
          </div>
          
          <nav className="mt-6">
            <div className="px-4 space-y-2">
              {/* Navigation existante */}
              <NavItem to="/dashboard" icon="🏠" label="Tableau de bord" />
              <NavItem to="/clients" icon="👥" label="Clients" />
              <NavItem to="/factures" icon="📄" label="Factures" />
              
              {/* Nouveau: Configuration PDF */}
              <PdfConfigNavItem 
                onClick={() => window.location.href = '/pdf-config'}
                className="mt-4 border-t border-gray-200 pt-4"
              />
            </div>
          </nav>
        </div>

        {/* Contenu principal */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          
          <main className="flex-1 overflow-x-hidden overflow-y-auto">
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/clients" element={<Clients />} />
              <Route path="/factures" element={<Factures />} />
              
              {/* Route pour la configuration PDF */}
              <Route path="/pdf-config" element={<PdfConfigPage />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
};

// Composant de navigation simple
const NavItem = ({ to, icon, label }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <button
      onClick={() => navigate(to)}
      className={`
        flex items-center w-full px-3 py-2 text-sm font-medium rounded-md
        ${isActive 
          ? 'bg-indigo-100 text-indigo-700' 
          : 'text-gray-600 hover:bg-gray-50'
        }
      `}
    >
      <span className="mr-3 text-lg">{icon}</span>
      {label}
    </button>
  );
};

export default App;