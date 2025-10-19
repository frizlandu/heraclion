/**
 * Menu utilisateur dans le header
 */
import React, { Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { ChevronDownIcon, UserIcon, Cog6ToothIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/20/solid';
import { useAuth } from '../../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const UserMenu = ({ user }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <Menu as="div" className="ml-3 relative">
      <div>
        <Menu.Button className="max-w-xs bg-white flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
          <span className="sr-only">Ouvrir le menu utilisateur</span>
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center">
              <UserIcon className="h-5 w-5 text-indigo-600" />
            </div>
            <span className="hidden md:block text-sm font-medium text-gray-700">
              {user?.nom || 'Utilisateur'}
            </span>
            <ChevronDownIcon className="h-4 w-4 text-gray-400" />
          </div>
        </Menu.Button>
      </div>
      
      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none">
          <div className="px-4 py-2 border-b border-gray-200">
            <p className="text-sm font-medium text-gray-900">{user?.nom}</p>
            <p className="text-sm text-gray-500">{user?.email}</p>
            <p className="text-xs text-indigo-600 font-medium">{user?.role}</p>
          </div>
          
          <Menu.Item>
            {({ active }) => (
              <button
                onClick={() => navigate('/profile')}
                className={`${
                  active ? 'bg-gray-100' : ''
                } flex items-center w-full px-4 py-2 text-sm text-gray-700`}
              >
                <UserIcon className="h-4 w-4 mr-3" />
                Mon profil
              </button>
            )}
          </Menu.Item>
          
          <Menu.Item>
            {({ active }) => (
              <button
                onClick={() => navigate('/parametres')}
                className={`${
                  active ? 'bg-gray-100' : ''
                } flex items-center w-full px-4 py-2 text-sm text-gray-700`}
              >
                <Cog6ToothIcon className="h-4 w-4 mr-3" />
                Paramètres
              </button>
            )}
          </Menu.Item>
          
          <Menu.Item>
            {({ active }) => (
              <button
                onClick={handleLogout}
                className={`${
                  active ? 'bg-gray-100' : ''
                } flex items-center w-full px-4 py-2 text-sm text-gray-700`}
              >
                <ArrowRightOnRectangleIcon className="h-4 w-4 mr-3" />
                Se déconnecter
              </button>
            )}
          </Menu.Item>
        </Menu.Items>
      </Transition>
    </Menu>
  );
};

export default UserMenu;