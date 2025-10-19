// Gestionnaire de logos et images pour les PDFs
const fs = require('fs');
const path = require('path');

/**
 * Gestionnaire de logos et ressources visuelles
 */
class LogoManager {
  constructor() {
    this.logoDir = path.join(__dirname, '..', 'public', 'logos');
    this.ensureLogoDir();
  }

  /**
   * S'assure que le dossier logos existe
   */
  ensureLogoDir() {
    if (!fs.existsSync(this.logoDir)) {
      fs.mkdirSync(this.logoDir, { recursive: true });
    }
  }

  /**
   * Obtient la liste des logos disponibles
   * @returns {Array} Liste des logos avec leurs informations
   */
  getAvailableLogos() {
    try {
      const files = fs.readdirSync(this.logoDir);
      const logos = [];

      files.forEach(file => {
        const ext = path.extname(file).toLowerCase();
        if (['.png', '.jpg', '.jpeg'].includes(ext)) {
          const filePath = path.join(this.logoDir, file);
          const stats = fs.statSync(filePath);
          
          logos.push({
            name: path.basename(file, ext),
            filename: file,
            path: filePath,
            extension: ext,
            size: stats.size,
            sizeKB: Math.round(stats.size / 1024),
            lastModified: stats.mtime
          });
        }
      });

      return logos;
    } catch (error) {
      console.error('Erreur lecture logos:', error);
      return [];
    }
  }

  /**
   * Obtient un logo spécifique
   * @param {string} filename - Nom du fichier logo
   * @returns {Object|null} Informations du logo ou null
   */
  getLogo(filename) {
    const logos = this.getAvailableLogos();
    return logos.find(logo => logo.filename === filename) || null;
  }

  /**
   * Vérifie si un logo existe
   * @param {string} filename - Nom du fichier
   * @returns {boolean} True si le logo existe
   */
  logoExists(filename) {
    if (!filename) return false;
    const logoPath = path.join(this.logoDir, filename);
    return fs.existsSync(logoPath);
  }

  /**
   * Obtient le chemin complet d'un logo
   * @param {string} filename - Nom du fichier
   * @returns {string|null} Chemin complet ou null
   */
  getLogoPath(filename) {
    if (this.logoExists(filename)) {
      return path.join(this.logoDir, filename);
    }
    return null;
  }

  /**
   * Copie un fichier logo dans le dossier des logos
   * @param {string} sourcePath - Chemin source
   * @param {string} newName - Nouveau nom (optionnel)
   * @returns {Object} Résultat de l'opération
   */
  addLogo(sourcePath, newName = null) {
    try {
      if (!fs.existsSync(sourcePath)) {
        return { success: false, error: 'Fichier source introuvable' };
      }

      const sourceExt = path.extname(sourcePath).toLowerCase();
      if (!['.png', '.jpg', '.jpeg'].includes(sourceExt)) {
        return { success: false, error: 'Format non supporté. Utilisez PNG, JPG ou JPEG.' };
      }

      const filename = newName || path.basename(sourcePath);
      const targetPath = path.join(this.logoDir, filename);

      // Vérifier si le fichier existe déjà
      if (fs.existsSync(targetPath)) {
        return { success: false, error: 'Un logo avec ce nom existe déjà' };
      }

      fs.copyFileSync(sourcePath, targetPath);

      return {
        success: true,
        logo: this.getLogo(filename),
        message: 'Logo ajouté avec succès'
      };

    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Supprime un logo
   * @param {string} filename - Nom du fichier à supprimer
   * @returns {Object} Résultat de l'opération
   */
  removeLogo(filename) {
    try {
      const logoPath = this.getLogoPath(filename);
      if (!logoPath) {
        return { success: false, error: 'Logo non trouvé' };
      }

      fs.unlinkSync(logoPath);
      return { success: true, message: 'Logo supprimé avec succès' };

    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Obtient les dimensions recommandées pour les logos
   * @returns {Object} Dimensions recommandées
   */
  getRecommendedDimensions() {
    return {
      header: {
        maxWidth: 200,
        maxHeight: 80,
        recommended: '200x80px'
      },
      footer: {
        maxWidth: 100,
        maxHeight: 40,
        recommended: '100x40px'
      },
      watermark: {
        maxWidth: 300,
        maxHeight: 300,
        recommended: '300x300px'
      }
    };
  }

  /**
   * Crée un logo par défaut si aucun n'existe
   * @returns {string} Nom du fichier créé
   */
  createDefaultLogo() {
    const defaultLogoName = 'default-logo.png';
    const defaultLogoPath = path.join(this.logoDir, defaultLogoName);

    if (!fs.existsSync(defaultLogoPath)) {
      // Créer un logo par défaut simple (rectangle avec texte)
      // Note: Dans une vraie application, vous utiliseriez une bibliothèque comme Sharp ou Canvas
      const defaultLogoContent = this.generateSimpleLogo();
      
      try {
        fs.writeFileSync(defaultLogoPath, defaultLogoContent);
        return defaultLogoName;
      } catch (error) {
        console.error('Erreur création logo par défaut:', error);
        return null;
      }
    }

    return defaultLogoName;
  }

  /**
   * Génère un logo simple par défaut
   * @returns {Buffer} Contenu du logo
   */
  generateSimpleLogo() {
    // Pour une implémentation simple, on retourne un buffer vide
    // Dans une vraie application, vous généreriez une image avec du texte
    return Buffer.alloc(0);
  }

  /**
   * Valide les dimensions d'une image
   * @param {string} imagePath - Chemin de l'image
   * @param {string} context - Contexte d'utilisation ('header', 'footer', etc.)
   * @returns {Object} Résultat de la validation
   */
  validateImageDimensions(imagePath, context = 'header') {
    try {
      // Note: Pour une vraie validation des dimensions, 
      // vous utiliseriez une bibliothèque comme Sharp ou get-image-dimensions
      const stats = fs.statSync(imagePath);
      const recommendations = this.getRecommendedDimensions()[context];

      return {
        valid: true,
        size: stats.size,
        sizeKB: Math.round(stats.size / 1024),
        recommendations,
        warnings: stats.size > 100000 ? ['Image très volumineuse (> 100KB)'] : []
      };

    } catch (error) {
      return {
        valid: false,
        error: error.message
      };
    }
  }
}

// Instance singleton
const logoManager = new LogoManager();

module.exports = logoManager;