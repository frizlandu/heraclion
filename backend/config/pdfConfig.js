// Configuration personnalisable pour la génération de PDFs
// Permet de personnaliser l'apparence et le contenu des PDFs générés

const path = require('path');

/**
 * Configuration par défaut pour les PDFs
 */
const defaultConfig = {
  // === INFORMATIONS ENTREPRISE ===
  company: {
    name: 'HERACLION TRANSPORT',
    address: '123 Rue de la Logistique',
    city: '13000 Marseille',
    phone: '04.XX.XX.XX.XX',
    email: 'contact@heraclion-transport.fr',
    website: 'www.heraclion-transport.fr',
    siret: '123 456 789 00012',
    tva: 'FR12345678901',
    logo: null // Chemin vers le logo (optionnel)
  },

  // === TEMPLATES DISPONIBLES ===
  templates: {
    moderne: {
      name: 'Moderne',
      description: 'Design moderne avec couleurs vives',
      colors: {
        primary: '#3B82F6',      // Bleu moderne
        secondary: '#1E40AF',    // Bleu foncé
        accent: '#10B981',       // Vert accent
        background: '#F8FAFC',   // Gris très clair
        text: '#1F2937',         // Gris foncé
        success: '#059669',      // Vert
        warning: '#D97706',      // Orange
        error: '#DC2626'         // Rouge
      }
    },
    classique: {
      name: 'Classique',
      description: 'Design traditionnel en nuances de bleu',
      colors: {
        primary: '#1E3A8A',      // Bleu classique
        secondary: '#1E40AF',    // Bleu moyen
        accent: '#3B82F6',       // Bleu clair
        background: '#F1F5F9',   // Gris bleuté clair
        text: '#0F172A',         // Noir bleuté
        success: '#166534',      // Vert foncé
        warning: '#92400E',      // Brun
        error: '#991B1B'         // Rouge foncé
      }
    },
    minimaliste: {
      name: 'Minimaliste',
      description: 'Design épuré en noir et blanc',
      colors: {
        primary: '#000000',      // Noir
        secondary: '#374151',    // Gris foncé
        accent: '#6B7280',       // Gris moyen
        background: '#FFFFFF',   // Blanc
        text: '#111827',         // Noir texte
        success: '#374151',      // Gris pour success
        warning: '#6B7280',      // Gris pour warning
        error: '#000000'         // Noir pour error
      }
    }
  },

  // === CONFIGURATION ACTUELLE ===
  current: {
    template: 'moderne', // Template actif
    
    // === MISE EN PAGE ===
    layout: {
      pageSize: 'A4',
      margins: {
        top: 50,
        bottom: 50,
        left: 40,
        right: 40
      },
      fonts: {
        title: { size: 20, weight: 'bold' },
        subtitle: { size: 16, weight: 'bold' },
        header: { size: 14, weight: 'bold' },
        body: { size: 12, weight: 'normal' },
        small: { size: 10, weight: 'normal' },
        tiny: { size: 8, weight: 'normal' }
      }
    },

    // === SECTIONS DU PDF ===
    sections: {
      header: {
        enabled: true,
        showLogo: true,
        showCompanyInfo: true,
        showDocumentInfo: true,
        height: 120
      },
      clientInfo: {
        enabled: true,
        showEmail: true,
        showPhone: true,
        backgroundColor: true
      },
      table: {
        enabled: true,
        alternateRows: true,
        borderStyle: 'solid',
        headerBackground: true,
        showBorders: true
      },
      totals: {
        enabled: true,
        showBackground: true,
        showBorders: true,
        position: 'right' // 'right', 'center', 'left'
      },
      footer: {
        enabled: true,
        showPageNumbers: true,
        showCompanyInfo: true,
        showNotes: true,
        height: 80
      }
    },

    // === FORMATAGE ===
    formatting: {
      currency: {
        symbol: '€',
        position: 'after', // 'before', 'after'
        decimals: 2,
        locale: 'fr-FR'
      },
      dates: {
        format: 'DD/MM/YYYY',
        locale: 'fr-FR'
      },
      numbers: {
        decimals: 2,
        thousandsSeparator: ' ',
        decimalSeparator: ','
      }
    },

    // === TEXTES PERSONNALISABLES ===
    texts: {
      documentTypes: {
        facture: 'FACTURE',
        proforma: 'FACTURE PROFORMA',
        devis: 'DEVIS'
      },
      labels: {
        clientInfo: 'Facturé à :',
        documentInfo: 'Informations document',
        itemDetails: 'Détail des prestations',
        totals: 'Récapitulatif',
        totalHT: 'Total HT :',
        totalTVA: 'Total TVA :',
        totalTTC: 'TOTAL TTC :',
        paymentTerms: 'Conditions de paiement :',
        notes: 'Notes :'
      },
      footer: {
        paymentTerms: '30 jours net à réception de facture',
        legalNotice: 'En cas de retard de paiement, des pénalités de retard seront appliquées.'
      }
    }
  }
};

/**
 * Gestionnaire de configuration PDF
 */
class PdfConfig {
  constructor() {
    this.config = { ...defaultConfig };
  }

  /**
   * Obtient la configuration actuelle
   * @returns {Object} Configuration complète
   */
  getConfig() {
    return this.config;
  }

  /**
   * Obtient la configuration du template actuel
   * @returns {Object} Configuration du template
   */
  getCurrentTemplate() {
    const templateName = this.config.current.template;
    return this.config.templates[templateName];
  }

  /**
   * Change le template actuel
   * @param {string} templateName - Nom du template
   */
  setTemplate(templateName) {
    if (this.config.templates[templateName]) {
      this.config.current.template = templateName;
      return true;
    }
    return false;
  }

  /**
   * Met à jour les informations de l'entreprise
   * @param {Object} companyInfo - Nouvelles informations entreprise
   */
  updateCompany(companyInfo) {
    this.config.company = { ...this.config.company, ...companyInfo };
  }

  /**
   * Met à jour la configuration actuelle
   * @param {Object} updates - Mises à jour de configuration
   */
  updateConfig(updates) {
    this.config.current = this.mergeDeep(this.config.current, updates);
  }

  /**
   * Ajoute un template personnalisé
   * @param {string} name - Nom du template
   * @param {Object} template - Configuration du template
   */
  addCustomTemplate(name, template) {
    this.config.templates[name] = template;
  }

  /**
   * Obtient les couleurs du template actuel
   * @returns {Object} Couleurs du template
   */
  getColors() {
    return this.getCurrentTemplate().colors;
  }

  /**
   * Obtient le formatage monétaire
   * @param {number} amount - Montant à formater
   * @returns {string} Montant formaté
   */
  formatCurrency(amount) {
    const { currency, numbers } = this.config.current.formatting;
    const formatted = new Intl.NumberFormat(currency.locale, {
      minimumFractionDigits: currency.decimals,
      maximumFractionDigits: currency.decimals
    }).format(amount || 0);

    return currency.position === 'before' 
      ? `${currency.symbol}${formatted}`
      : `${formatted}${currency.symbol}`;
  }

  /**
   * Obtient le formatage des dates
   * @param {Date|string} date - Date à formater
   * @returns {string} Date formatée
   */
  formatDate(date) {
    if (!date) return '';
    const dateObj = date instanceof Date ? date : new Date(date);
    return dateObj.toLocaleDateString(this.config.current.formatting.dates.locale);
  }

  /**
   * Fusion profonde d'objets
   * @param {Object} target - Objet cible
   * @param {Object} source - Objet source
   * @returns {Object} Objet fusionné
   */
  mergeDeep(target, source) {
    const result = { ...target };
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this.mergeDeep(target[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
    return result;
  }

  /**
   * Sauvegarde la configuration dans un fichier
   * @param {string} filePath - Chemin du fichier
   */
  saveToFile(filePath) {
    const fs = require('fs');
    try {
      fs.writeFileSync(filePath, JSON.stringify(this.config, null, 2), 'utf8');
      return true;
    } catch (error) {
      console.error('Erreur sauvegarde config PDF:', error);
      return false;
    }
  }

  /**
   * Charge la configuration depuis un fichier
   * @param {string} filePath - Chemin du fichier
   */
  loadFromFile(filePath) {
    const fs = require('fs');
    try {
      if (fs.existsSync(filePath)) {
        const data = fs.readFileSync(filePath, 'utf8');
        this.config = JSON.parse(data);
        return true;
      }
    } catch (error) {
      console.error('Erreur chargement config PDF:', error);
    }
    return false;
  }
}

// Instance singleton
const pdfConfig = new PdfConfig();

// Tenter de charger la configuration depuis un fichier
const configPath = path.join(__dirname, 'pdf-config.json');
pdfConfig.loadFromFile(configPath);

module.exports = pdfConfig;