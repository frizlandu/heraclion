# Configuration PDF - Interface de Gestion

## Vue d'ensemble
Cette interface permet de gérer complètement la configuration des PDF générés par votre application Heraclion. Elle inclut la gestion des templates, logos et informations d'entreprise.

## Fonctionnalités

### 1. Gestion des Templates
- 3 templates prédefinis : Moderne, Classique, Minimaliste
- Activation en un clic
- Aperçu des couleurs de chaque template
- Synchronisation automatique avec le backend

### 2. Gestion des Logos
- Upload par drag & drop ou sélection de fichier
- Support PNG, JPG, JPEG (max 2MB)
- Aperçu des logos uploadés
- Activation/désactivation des logos
- Suppression sécurisée

### 3. Informations d'Entreprise
- Configuration du nom, adresse, téléphone, email
- SIRET et autres informations légales
- Sauvegarde automatique

### 4. Aperçu PDF
- Génération d'un PDF de test
- Téléchargement automatique
- Utilise la configuration actuelle

## Installation et Intégration

### 1. Dépendances React
```bash
npm install @heroicons/react
```

### 2. Intégration dans votre App.js
```jsx
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import PdfConfigRoutes from './routes/PdfConfigRoutes';

function App() {
  return (
    <BrowserRouter>
      <div className="App">
        <Routes>
          {/* Vos routes existantes */}
          <Route path="/pdf-config/*" element={<PdfConfigRoutes />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
```

### 3. Intégration dans votre Navigation
```jsx
import PdfConfigNavItem from './components/navigation/PdfConfigNavItem';
import { useNavigate, useLocation } from 'react-router-dom';

const Navigation = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav>
      {/* Vos éléments de navigation existants */}
      <PdfConfigNavItem
        onClick={() => navigate('/pdf-config')}
        isActive={location.pathname.startsWith('/pdf-config')}
      />
    </nav>
  );
};
```

### 4. CSS et Styles
Assurez-vous d'inclure Tailwind CSS dans votre projet ou ajustez les classes CSS selon votre système de design existant.

```jsx
// Dans votre composant principal ou App.js
import './styles/PdfConfigManager.css';
```

## Structure des Fichiers

```
frontend/src/
├── components/
│   ├── pdf/
│   │   └── PdfConfigManager.js       # Composant principal
│   └── navigation/
│       └── PdfConfigNavItem.js       # Élément de navigation
├── pages/
│   └── PdfConfigPage.js              # Page wrapper
├── hooks/
│   └── usePdfConfig.js               # Hook personnalisé
├── routes/
│   └── PdfConfigRoutes.js            # Configuration des routes
└── styles/
    └── PdfConfigManager.css          # Styles CSS
```

## API Backend

L'interface utilise les endpoints suivants :

- `GET /api/v1/pdf-config` - Configuration actuelle
- `PUT /api/v1/pdf-config` - Mise à jour de la configuration
- `GET /api/v1/pdf-config/templates` - Liste des templates
- `PUT /api/v1/pdf-config/templates/:id` - Activation d'un template
- `GET /api/v1/pdf-config/logos` - Liste des logos
- `POST /api/v1/pdf-config/logos/upload` - Upload d'un logo
- `PUT /api/v1/pdf-config/logos/:filename/activate` - Activation d'un logo
- `DELETE /api/v1/pdf-config/logos/:filename` - Suppression d'un logo
- `POST /api/v1/pdf-config/preview` - Génération d'aperçu PDF

## Configuration du Backend

Assurez-vous que votre serveur Express inclut :

```javascript
// Dans app.js
app.use('/api/v1/pdf-config', require('./routes/pdf-config'));
app.use('/logos', express.static('public/logos'));
app.use('/exports', express.static('public/exports'));
```

## Personnalisation

### Modifier les Templates
Éditez le fichier `backend/config/pdfConfig.js` pour ajouter ou modifier les templates.

### Styles Personnalisés
Modifiez le fichier `frontend/src/styles/PdfConfigManager.css` pour adapter l'interface à votre design.

### Validation des Fichiers
Ajustez les limites de taille et types de fichiers dans le hook `usePdfConfig.js`.

## Utilisation

1. **Accédez à l'interface** : Naviguez vers `/pdf-config`
2. **Sélectionnez un template** : Onglet "Templates"
3. **Configurez votre entreprise** : Onglet "Entreprise"
4. **Gérez vos logos** : Onglet "Logos"
5. **Testez la configuration** : Onglet "Aperçu"

## Dépannage

### Problèmes d'upload de logo
- Vérifiez que le dossier `backend/public/logos` existe et est accessible en écriture
- Assurez-vous que le middleware Multer est configuré

### Erreurs de configuration
- Vérifiez que le fichier `pdfConfig.json` peut être créé dans le dossier `backend/config`
- Contrôlez les permissions de fichiers

### Problèmes de génération PDF
- Vérifiez que PDFKit et ses dépendances sont installées
- Contrôlez les logs du serveur pour les erreurs spécifiques

## Support

Pour toute question ou problème :
1. Vérifiez les logs du navigateur (Console)
2. Contrôlez les logs du serveur backend
3. Assurez-vous que tous les services sont démarrés