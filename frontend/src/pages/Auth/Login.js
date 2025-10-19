/**
 * Page de connexion
 */
import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import './Login.css';

const Login = () => {
  const { login, isAuthenticated, loading } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);

  // Rediriger si déjà connecté
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    const result = await login(formData);
    if (result.success) {
      // La redirection sera gérée par le contexte d'authentification
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          {/* Logo */}
          <div className="flex justify-center">
            <img
              className="h-20 w-auto"
              src="/logos/heraclion-logo.png"
              alt="Heraclion"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            HERACLION
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Connectez-vous à votre compte
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            {/* Email */}
            <div>
              <label htmlFor="email" className="sr-only">
                Adresse email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Adresse email"
                value={formData.email}
                onChange={handleInputChange}
                disabled={loading}
              />
            </div>
            
            {/* Mot de passe */}
            <div className="relative">
              <label htmlFor="password" className="sr-only">
                Mot de passe
              </label>
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 pr-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Mot de passe"
                value={formData.password}
                onChange={handleInputChange}
                disabled={loading}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                ) : (
                  <EyeIcon className="h-5 w-5 text-gray-400" />
                )}
              </button>
            </div>
          </div>

          {/* Bouton de connexion */}
          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Connexion...
                </div>
              ) : (
                'Se connecter'
              )}
            </button>
          </div>

          {/* Comptes de test */}
          <div className="mt-6 p-4 bg-gray-100 rounded-md">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Comptes de test :</h3>
            <div className="text-xs text-gray-600 space-y-1">
              <div><strong>Admin:</strong> admin@heraclion.fr / admin123</div>
              <div><strong>Gestionnaire:</strong> gestionnaire@heraclion.fr / gestionnaire123</div>
              <div><strong>Comptable:</strong> comptable@heraclion.fr / comptable123</div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;