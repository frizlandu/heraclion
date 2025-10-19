/**
 * Interface de gestion de la configuration PDF
 * Permet de gérer les templates, logos et informations d'entreprise
 */
import React, { useState } from 'react';
import { 
  Cog6ToothIcon,
  SwatchIcon,
  BuildingOfficeIcon,
  PhotoIcon,
  EyeIcon,
  DocumentArrowDownIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  CloudArrowUpIcon
} from '@heroicons/react/24/outline';
import usePdfConfig from '../../hooks/usePdfConfig';
import '../../styles/PdfConfigManager.css';

const PdfConfigManager = () => {
  const {
    config,
    templates,
    logos,
    loading,
    activateTemplate,
    updateConfiguration,
    uploadLogo,
    activateLogo,
    deleteLogo,
    generatePreview
  } = usePdfConfig();

  const [activeTab, setActiveTab] = useState('templates');
  const [notification, setNotification] = useState(null);
  const [companyInfo, setCompanyInfo] = useState(config?.company || {});
  const [dragOver, setDragOver] = useState(false);

  // Synchroniser les infos d'entreprise avec le config
  React.useEffect(() => {
    if (config?.company) {
      setCompanyInfo(config.company);
    }
  }, [config]);

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleTemplateActivation = async (templateId) => {
    const result = await activateTemplate(templateId);
    showNotification(result.message, result.success ? 'success' : 'error');
  };

  const handleCompanyUpdate = async () => {
    const result = await updateConfiguration({ company: companyInfo });
    showNotification(result.message, result.success ? 'success' : 'error');
  };

  const handleLogoUpload = async (file) => {
    // Validation du fichier
    if (!file.type.startsWith('image/')) {
      showNotification('Veuillez sélectionner un fichier image', 'error');
      return;
    }
    
    if (file.size > 2 * 1024 * 1024) { // 2MB
      showNotification('Le fichier ne doit pas dépasser 2MB', 'error');
      return;
    }

    const result = await uploadLogo(file);
    showNotification(result.message, result.success ? 'success' : 'error');
  };

  const handleLogoActivation = async (filename) => {
    const result = await activateLogo(filename);
    showNotification(result.message, result.success ? 'success' : 'error');
  };

  const handleLogoDeletion = async (filename) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce logo ?')) return;
    
    const result = await deleteLogo(filename);
    showNotification(result.message, result.success ? 'success' : 'error');
  };

  const handlePreviewGeneration = async () => {
    const result = await generatePreview();
    showNotification(result.message, result.success ? 'success' : 'error');
  };

  // Gestion du drag & drop
  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleLogoUpload(files[0]);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <Cog6ToothIcon className="h-8 w-8 text-indigo-600 mr-3" />
          <h1 className="text-3xl font-bold text-gray-900">Configuration PDF</h1>
        </div>
        <p className="text-gray-600">
          Personnalisez l'apparence et le contenu de vos documents PDF
        </p>
      </div>

      {/* Notification */}
      {notification && (
        <div className={`mb-4 p-4 rounded-md flex items-center ${
          notification.type === 'success' 
            ? 'bg-green-50 text-green-800 border border-green-200'
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {notification.type === 'success' ? (
            <CheckCircleIcon className="h-5 w-5 mr-2" />
          ) : (
            <ExclamationTriangleIcon className="h-5 w-5 mr-2" />
          )}
          {notification.message}
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'templates', label: 'Templates', icon: SwatchIcon },
            { id: 'company', label: 'Entreprise', icon: BuildingOfficeIcon },
            { id: 'logos', label: 'Logos', icon: PhotoIcon },
            { id: 'preview', label: 'Aperçu', icon: EyeIcon }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="h-5 w-5 mr-2" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Templates Tab */}
      {activeTab === 'templates' && (
        <div>
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Templates disponibles</h2>
            <p className="text-gray-600">Choisissez le style de vos documents PDF</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((template) => (
              <div
                key={template.id}
                className={`relative border rounded-lg p-6 cursor-pointer transition-all ${
                  template.isActive
                    ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-500'
                    : 'border-gray-200 hover:border-indigo-300'
                }`}
                onClick={() => !template.isActive && handleTemplateActivation(template.id)}
              >
                {template.isActive && (
                  <div className="absolute top-2 right-2">
                    <CheckCircleIcon className="h-6 w-6 text-indigo-600" />
                  </div>
                )}
                
                <div className="mb-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">{template.name}</h3>
                  <p className="text-sm text-gray-600">{template.description}</p>
                </div>

                {/* Palette de couleurs */}
                <div className="flex space-x-2 mb-4">
                  {Object.entries(template.colors).slice(0, 4).map(([key, color]) => (
                    <div
                      key={key}
                      className="w-8 h-8 rounded-full border-2 border-white shadow-sm"
                      style={{ backgroundColor: color }}
                      title={`${key}: ${color}`}
                    />
                  ))}
                </div>

                {!template.isActive && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTemplateActivation(template.id);
                    }}
                    className="w-full py-2 px-4 border border-indigo-600 text-indigo-600 rounded-md hover:bg-indigo-50 transition-colors"
                  >
                    Activer ce template
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Company Tab */}
      {activeTab === 'company' && (
        <div>
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Informations entreprise</h2>
            <p className="text-gray-600">Configurez les informations de votre entreprise</p>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom de l'entreprise
                </label>
                <input
                  type="text"
                  value={companyInfo.name || ''}
                  onChange={(e) => setCompanyInfo({...companyInfo, name: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="HERACLION TRANSPORT"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Adresse
                </label>
                <input
                  type="text"
                  value={companyInfo.address || ''}
                  onChange={(e) => setCompanyInfo({...companyInfo, address: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="123 Rue de la Logistique"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ville
                </label>
                <input
                  type="text"
                  value={companyInfo.city || ''}
                  onChange={(e) => setCompanyInfo({...companyInfo, city: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="13000 Marseille"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Téléphone
                </label>
                <input
                  type="text"
                  value={companyInfo.phone || ''}
                  onChange={(e) => setCompanyInfo({...companyInfo, phone: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="04.XX.XX.XX.XX"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={companyInfo.email || ''}
                  onChange={(e) => setCompanyInfo({...companyInfo, email: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="contact@heraclion.fr"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  SIRET
                </label>
                <input
                  type="text"
                  value={companyInfo.siret || ''}
                  onChange={(e) => setCompanyInfo({...companyInfo, siret: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="123 456 789 00012"
                />
              </div>
            </div>

            <div className="mt-6">
              <button
                onClick={handleCompanyUpdate}
                className="btn btn-primary"
              >
                <CheckCircleIcon className="h-5 w-5" />
                Sauvegarder les informations
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Logos Tab */}
      {activeTab === 'logos' && (
        <div>
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Gestion des logos</h2>
            <p className="text-gray-600">Uploadez et gérez vos logos d'entreprise</p>
          </div>

          {/* Upload section */}
          <div className="bg-white p-6 rounded-lg border border-gray-200 mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Ajouter un logo</h3>
            
            <div 
              className={`file-drop-zone border-2 border-dashed rounded-lg p-8 transition-all ${
                dragOver ? 'border-indigo-500 bg-indigo-50 dragover' : 'border-gray-300'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <div className="text-center">
                <CloudArrowUpIcon className={`mx-auto h-12 w-12 ${
                  dragOver ? 'text-indigo-500' : 'text-gray-400'
                }`} />
                <div className="mt-4">
                  <label className="cursor-pointer">
                    <span className="mt-2 block text-sm font-medium text-gray-900">
                      {dragOver ? 'Relâchez pour uploader' : 'Cliquez pour uploader ou glissez votre logo ici'}
                    </span>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/png,image/jpg,image/jpeg"
                      onChange={(e) => e.target.files[0] && handleLogoUpload(e.target.files[0])}
                    />
                  </label>
                  <p className="mt-1 text-xs text-gray-500">
                    PNG, JPG ou JPEG jusqu'à 2MB - Recommandé: 200x80px
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Logos grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {logos.map((logo) => (
              <div key={logo.filename} className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="aspect-w-16 aspect-h-9 mb-3">
                  <img
                    src={logo.url}
                    alt={logo.name}
                    className="w-full h-24 object-contain bg-gray-50 rounded"
                  />
                </div>
                
                <h4 className="text-sm font-medium text-gray-900 mb-1 truncate">{logo.name}</h4>
                <p className="text-xs text-gray-500 mb-3">{logo.sizeKB}KB</p>
                
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleLogoActivation(logo.filename)}
                    className={`flex-1 text-xs py-2 px-3 rounded font-medium transition-colors ${
                      config?.activeLogo === logo.filename
                        ? 'bg-green-600 text-white'
                        : 'bg-indigo-600 text-white hover:bg-indigo-700'
                    }`}
                  >
                    {config?.activeLogo === logo.filename ? 'Actif' : 'Activer'}
                  </button>
                  <button
                    onClick={() => handleLogoDeletion(logo.filename)}
                    className="bg-red-600 text-white text-xs py-2 px-3 rounded hover:bg-red-700 font-medium"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>

          {logos.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <PhotoIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p>Aucun logo disponible. Uploadez votre premier logo ci-dessus.</p>
            </div>
          )}
        </div>
      )}

      {/* Preview Tab */}
      {activeTab === 'preview' && (
        <div>
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Aperçu PDF</h2>
            <p className="text-gray-600">Prévisualisez le rendu de vos documents PDF</p>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200 text-center">
            <DocumentArrowDownIcon className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aperçu PDF</h3>
            <p className="text-gray-600 mb-4">
              Générez un PDF de test pour voir le rendu avec vos paramètres actuels
            </p>
            
            <button 
              onClick={handlePreviewGeneration}
              className="btn btn-primary"
            >
              <DocumentArrowDownIcon className="h-5 w-5" />
              Générer un PDF d'aperçu
            </button>
            
            <div className="mt-4 text-sm text-gray-500">
              <p><strong>Template actuel:</strong> {config?.template || 'Aucun'}</p>
              <p><strong>Logo actif:</strong> {config?.activeLogo || 'Aucun'}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PdfConfigManager;