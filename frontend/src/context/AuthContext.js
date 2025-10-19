/**
 * Contexte d'authentification pour React
 */
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { authAPI } from '../services/api/authAPI';
import toast from 'react-hot-toast';

// États possibles
const authReducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN_START':
      return {
        ...state,
        loading: true,
        error: null
      };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        loading: false,
        isAuthenticated: true,
        user: action.payload.user,
        token: action.payload.token,
        error: null
      };
    case 'LOGIN_FAILURE':
      return {
        ...state,
        loading: false,
        isAuthenticated: false,
        user: null,
        token: null,
        error: action.payload
      };
    case 'LOGOUT':
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        token: null,
        loading: false,
        error: null
      };
    case 'SET_USER':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true
      };
    default:
      return state;
  }
};

// État initial
const initialState = {
  isAuthenticated: false,
  user: null,
  token: null,
  loading: false,
  error: null
};

// Création du contexte
const AuthContext = createContext();

// Provider du contexte
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Vérifier l'authentification au chargement
  useEffect(() => {
    const token = authAPI.getToken();
    const user = authAPI.getCurrentUser();
    
    if (token && user) {
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: { user, token }
      });
    }
  }, []);

  // Fonction de connexion
  const login = async (credentials) => {
    try {
      dispatch({ type: 'LOGIN_START' });
      
      const response = await authAPI.login(credentials);
      
      if (response.success && response.data) {
        const { user, token } = response.data;
        
        // Sauvegarder les données d'authentification
        authAPI.saveAuthData({ user, token });
        
        dispatch({
          type: 'LOGIN_SUCCESS',
          payload: { user, token }
        });
        
        toast.success(`Bienvenue ${user.nom} !`);
        return { success: true };
      } else {
        throw new Error(response.message || 'Erreur de connexion');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Erreur de connexion';
      
      dispatch({
        type: 'LOGIN_FAILURE',
        payload: errorMessage
      });
      
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Fonction de déconnexion
  const logout = async () => {
    try {
      await authAPI.logout();
      dispatch({ type: 'LOGOUT' });
      toast.success('Déconnexion réussie');
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
      // Forcer la déconnexion même en cas d'erreur
      dispatch({ type: 'LOGOUT' });
    }
  };

  // Récupérer le profil utilisateur
  const getProfile = async () => {
    try {
      const response = await authAPI.getProfile();
      if (response.success && response.data) {
        dispatch({
          type: 'SET_USER',
          payload: response.data
        });
        return response.data;
      }
    } catch (error) {
      console.error('Erreur lors de la récupération du profil:', error);
      // Si le token est invalide, déconnecter l'utilisateur
      if (error.response?.status === 401) {
        dispatch({ type: 'LOGOUT' });
      }
    }
  };

  const value = {
    ...state,
    login,
    logout,
    getProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook pour utiliser le contexte
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth doit être utilisé dans un AuthProvider');
  }
  return context;
};

export default AuthContext;