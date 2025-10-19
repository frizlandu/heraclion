# 🎨 Interface de Configuration PDF - HERACLION TRANSPORT

## ✨ Fonctionnalités Réalisées

### 🏗️ Architecture Complète
- **Backend API** : Endpoints complets pour la gestion PDF
- **Interface React** : Composants modernes avec hooks personnalisés
- **Système de Templates** : 3 templates prédefinis (Moderne, Classique, Minimaliste)
- **Gestion des Logos** : Upload, activation, suppression avec drag & drop
- **Configuration Entreprise** : Informations centralisées
- **Aperçu PDF** : Génération de PDF de test

### 📂 Structure des Fichiers Créés

#### Backend
```
backend/
├── config/
│   ├── pdfConfig.js              # Système de configuration centralisé
│   └── pdfConfig.json            # Fichier de configuration (généré automatiquement)
├── routes/
│   └── pdf-config.js             # API REST complète
├── services/
│   ├── exportService.js          # Service PDF mis à jour avec templates
│   └── logoManager.js            # Gestionnaire de logos
├── public/
│   └── logos/                    # Dossier pour les logos uploadés
└── test-pdf-config-api.js        # Script de test de l'API
```

#### Frontend
```
frontend/src/
├── components/
│   ├── pdf/
│   │   └── PdfConfigManager.js   # Composant principal d'interface
│   └── navigation/
│       └── PdfConfigNavItem.js   # Élément de navigation
├── pages/
│   └── PdfConfigPage.js          # Page wrapper
├── hooks/
│   └── usePdfConfig.js           # Hook personnalisé pour la logique
├── routes/
│   └── PdfConfigRoutes.js        # Configuration des routes
├── styles/
│   └── PdfConfigManager.css      # Styles CSS personnalisés
├── examples/
│   └── AppWithPdfConfig.js       # Exemple d'intégration
└── docs/
    └── PDF_CONFIG_GUIDE.md       # Guide d'utilisation complet
```

## 🚀 Démarrage Rapide

### 1. Installation des Dépendances

```bash
# Backend (si pas déjà fait)
cd backend
npm install multer

# Frontend (dépendances déjà présentes)
cd ../frontend
# @heroicons/react et react-router-dom déjà installés
```

### 2. Démarrer les Services

```bash
# Terminal 1: Backend
cd backend
npm start

# Terminal 2: Frontend  
cd frontend
npm start
```

### 3. Tester l'API (optionnel)

```bash
cd backend
node test-pdf-config-api.js
```

### 4. Accéder à l'Interface

Naviguez vers : `http://localhost:3000/pdf-config`

## 📋 Fonctionnalités de l'Interface

### 🎨 Onglet Templates
- **Sélection visuelle** : Aperçu des couleurs et styles
- **Activation en un clic** : Template actif mis en surbrillance
- **3 Templates disponibles** :
  - 🟦 **Moderne** : Design contemporain, bleu professionnel
  - 🟫 **Classique** : Style traditionnel, couleurs sobres  
  - 🟪 **Minimaliste** : Épuré et simple

### 🏢 Onglet Entreprise
- **Informations complètes** : Nom, adresse, contact
- **Validation** : Champs requis et formats
- **Sauvegarde automatique** : Synchronisation avec les PDFs

### 🖼️ Onglet Logos
- **Upload intuitif** : Drag & drop + sélection de fichier
- **Formats supportés** : PNG, JPG, JPEG (max 2MB)
- **Prévisualisation** : Aperçu avant activation
- **Gestion complète** : Activation/désactivation/suppression

### 👁️ Onglet Aperçu
- **PDF de test** : Génération avec données fictives
- **Téléchargement automatique** : Fichier prêt à consulter
- **Configuration actuelle** : Utilise template et logo actifs

## 🔗 Intégration dans votre App

### Ajout à la Navigation

```jsx
import PdfConfigNavItem from './components/navigation/PdfConfigNavItem';
import { useNavigate, useLocation } from 'react-router-dom';

// Dans votre composant de navigation
<PdfConfigNavItem
  onClick={() => navigate('/pdf-config')}
  isActive={location.pathname.startsWith('/pdf-config')}
/>
```

### Ajout des Routes

```jsx
import PdfConfigPage from './pages/PdfConfigPage';

// Dans votre Router
<Route path="/pdf-config" element={<PdfConfigPage />} />
```

## 🛠️ Personnalisation

### Modifier les Templates

Éditez `backend/config/pdfConfig.js` :

```javascript
templates: {
  monTemplate: {
    name: 'Mon Template',
    description: 'Description personnalisée',
    colors: {
      primary: '#your-color',
      secondary: '#your-secondary'
    },
    fonts: {
      primary: 'Helvetica',
      size: { title: 16, body: 10 }
    }
  }
}
```

### Personnaliser les Styles

Modifiez `frontend/src/styles/PdfConfigManager.css` selon votre charte graphique.

## 📊 API Endpoints

- `GET /api/v1/pdf-config` - Configuration actuelle
- `PUT /api/v1/pdf-config` - Mise à jour configuration  
- `GET /api/v1/pdf-config/templates` - Liste templates
- `PUT /api/v1/pdf-config/templates/:id` - Activer template
- `GET /api/v1/pdf-config/logos` - Liste logos
- `POST /api/v1/pdf-config/logos/upload` - Upload logo
- `PUT /api/v1/pdf-config/logos/:file/activate` - Activer logo
- `DELETE /api/v1/pdf-config/logos/:file` - Supprimer logo
- `POST /api/v1/pdf-config/preview` - Générer aperçu PDF

## 🎯 Utilisation

1. **Accédez à `/pdf-config`** dans votre navigateur
2. **Sélectionnez un template** dans l'onglet "Templates"
3. **Configurez votre entreprise** dans l'onglet "Entreprise"
4. **Uploadez votre logo** dans l'onglet "Logos"
5. **Testez le rendu** dans l'onglet "Aperçu"

## 🔧 Dépannage

### Problème d'upload de logo
- Vérifiez que le dossier `backend/public/logos` existe
- Contrôlez les permissions d'écriture

### Erreur de génération PDF
- Assurez-vous que PDFKit est installé : `npm install pdfkit`
- Vérifiez les logs du serveur

### Interface ne charge pas
- Contrôlez que le backend est démarré sur le bon port
- Vérifiez la console du navigateur pour les erreurs

## ✅ Tests de Validation

Lancez le script de test pour vérifier que tout fonctionne :

```bash
cd backend
node test-pdf-config-api.js
```

Le script testera tous les endpoints et génèrera un PDF d'aperçu.

---

## 🎉 Résultat Final

Vous disposez maintenant d'une **interface complète et professionnelle** pour :
- ✨ Personnaliser l'apparence des PDFs
- 🎨 Gérer des templates visuels
- 🖼️ Uploader et gérer des logos
- 🏢 Configurer les informations d'entreprise  
- 👁️ Prévisualiser le rendu final

L'interface est **entièrement intégrée** à votre application existante et **prête à utiliser** !

---

*Interface développée pour HERACLION TRANSPORT - Solution complète de personnalisation PDF* 🚛