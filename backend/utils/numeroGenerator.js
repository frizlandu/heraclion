const { logger } = require('../middleware/logger');

/**
 * Générateur de numéros automatiques pour les documents
 */
class NumeroGenerator {
  /**
   * Génère un numéro de document automatiquement
   * @param {number} entrepriseId - ID de l'entreprise
   * @param {string} documentType - Type de document
   * @param {Date} date - Date du document
   * @returns {Promise<string>} Numéro généré
   */
  async generateNumero(entrepriseId, documentType, date) {
    try {
      // Cette fonction utilise directement les triggers PostgreSQL
      // Elle n'est appelée que si le numéro n'est pas généré automatiquement
      logger.info('Génération numéro demandée', {
        entrepriseId,
        documentType,
        date
      });

      // Normalement, les triggers PostgreSQL gèrent cela automatiquement
      // Cette fonction est un fallback si nécessaire
      const year = new Date(date).getFullYear();
      const month = String(new Date(date).getMonth() + 1).padStart(2, '0');
      const timestamp = Date.now().toString().slice(-4);

      let prefix = 'DOC';
      let typePrefix = '';

      // Déterminer le préfixe selon le type
      switch (documentType) {
        case 'facture_transport':
          typePrefix = '/T/';
          break;
        case 'facture_non_transport':
          typePrefix = '/';
          break;
        case 'proforma_transport':
          prefix = 'PROFORMA DOC';
          typePrefix = '/T/';
          break;
        case 'proforma_non_transport':
          prefix = 'PROFORMA DOC';
          typePrefix = '/';
          break;
        default:
          typePrefix = '/';
      }

      // Format générique: PREFIX/XXXX/[T/]MM/YYYY
      const numero = `${prefix}/${timestamp}${typePrefix}${month}/${year}`;

      logger.info('Numéro généré en fallback', {
        entrepriseId,
        documentType,
        numero
      });

      return numero;
    } catch (error) {
      logger.error('Erreur génération numéro', {
        error: error.message,
        entrepriseId,
        documentType,
        date
      });
      throw error;
    }
  }

  /**
   * Valide le format d'un numéro de document
   * @param {string} numero - Numéro à valider
   * @param {string} documentType - Type de document attendu
   * @returns {boolean} Validité du numéro
   */
  validateNumero(numero, documentType) {
    if (!numero || typeof numero !== 'string') {
      return false;
    }

    try {
      const patterns = {
        facture_transport: /^[A-Z]+\/\d{4}\/T\/\d{2}\/\d{4}$/,
        facture_non_transport: /^[A-Z]+\/\d{4}\/\d{2}\/\d{4}$/,
        proforma_transport: /^PROFORMA [A-Z]+\/\d{4}\/T\/\d{2}\/\d{4}$/,
        proforma_non_transport: /^PROFORMA [A-Z]+\/\d{4}\/\d{2}\/\d{4}$/
      };

      const pattern = patterns[documentType];
      if (!pattern) {
        logger.warn('Type de document non reconnu pour validation', {
          documentType,
          numero
        });
        return false;
      }

      const isValid = pattern.test(numero);
      
      if (!isValid) {
        logger.warn('Numéro invalide', {
          numero,
          documentType,
          expectedPattern: pattern.toString()
        });
      }

      return isValid;
    } catch (error) {
      logger.error('Erreur validation numéro', {
        error: error.message,
        numero,
        documentType
      });
      return false;
    }
  }

  /**
   * Parse un numéro de document pour extraire ses composants
   * @param {string} numero - Numéro à parser
   * @returns {Object} Composants du numéro
   */
  parseNumero(numero) {
    try {
      if (!numero || typeof numero !== 'string') {
        throw new Error('Numéro invalide');
      }

      let prefix = '';
      let sequence = '';
      let isTransport = false;
      let month = '';
      let year = '';
      let isProforma = false;

      // Vérifier si c'est un proforma
      if (numero.startsWith('PROFORMA ')) {
        isProforma = true;
        numero = numero.substring(9); // Retirer "PROFORMA "
      }

      const parts = numero.split('/');
      
      if (parts.length >= 4) {
        prefix = parts[0];
        sequence = parts[1];
        
        // Vérifier si c'est un document de transport
        if (parts[2] === 'T') {
          isTransport = true;
          month = parts[3];
          year = parts[4];
        } else {
          isTransport = false;
          month = parts[2];
          year = parts[3];
        }
      }

      const result = {
        prefix,
        sequence: parseInt(sequence) || 0,
        isTransport,
        month: parseInt(month) || 0,
        year: parseInt(year) || 0,
        isProforma,
        isValid: this.validateNumero(
          (isProforma ? 'PROFORMA ' : '') + numero,
          this.getDocumentType(isProforma, isTransport)
        )
      };

      logger.debug('Numéro parsé', {
        original: (isProforma ? 'PROFORMA ' : '') + numero,
        parsed: result
      });

      return result;
    } catch (error) {
      logger.error('Erreur parsing numéro', {
        error: error.message,
        numero
      });
      
      return {
        prefix: '',
        sequence: 0,
        isTransport: false,
        month: 0,
        year: 0,
        isProforma: false,
        isValid: false,
        error: error.message
      };
    }
  }

  /**
   * Détermine le type de document basé sur les caractéristiques
   * @param {boolean} isProforma - Est-ce un proforma
   * @param {boolean} isTransport - Est-ce un document de transport
   * @returns {string} Type de document
   */
  getDocumentType(isProforma, isTransport) {
    if (isProforma) {
      return isTransport ? 'proforma_transport' : 'proforma_non_transport';
    } else {
      return isTransport ? 'facture_transport' : 'facture_non_transport';
    }
  }

  /**
   * Génère le prochain numéro basé sur un numéro existant
   * @param {string} lastNumero - Dernier numéro utilisé
   * @returns {string} Prochain numéro
   */
  getNextNumero(lastNumero) {
    try {
      const parsed = this.parseNumero(lastNumero);
      
      if (!parsed.isValid) {
        throw new Error('Dernier numéro invalide');
      }

      const nextSequence = String(parsed.sequence + 1).padStart(4, '0');
      const typePrefix = parsed.isTransport ? '/T/' : '/';
      const month = String(parsed.month).padStart(2, '0');
      
      let nextNumero = `${parsed.prefix}/${nextSequence}${typePrefix}${month}/${parsed.year}`;
      
      if (parsed.isProforma) {
        nextNumero = `PROFORMA ${nextNumero}`;
      }

      logger.debug('Prochain numéro généré', {
        lastNumero,
        nextNumero
      });

      return nextNumero;
    } catch (error) {
      logger.error('Erreur génération prochain numéro', {
        error: error.message,
        lastNumero
      });
      throw error;
    }
  }

  /**
   * Génère un numéro temporaire unique
   * @param {string} prefix - Préfixe du numéro
   * @returns {string} Numéro temporaire
   */
  generateTempNumero(prefix = 'TEMP') {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 4).toUpperCase();
    return `${prefix}/${timestamp}/${random}`;
  }

  /**
   * Vérifie si un numéro est temporaire
   * @param {string} numero - Numéro à vérifier
   * @returns {boolean} Est temporaire
   */
  isTempNumero(numero) {
    return numero && numero.includes('TEMP/');
  }
}

// Créer une instance singleton
const numeroGenerator = new NumeroGenerator();

module.exports = numeroGenerator;