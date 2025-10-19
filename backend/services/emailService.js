const nodemailer = require('nodemailer');
const { logger } = require('../middleware/logger');

class EmailService {
  constructor() {
    this.transporter = null;
    this.init();
  }

  /**
   * Initialise le transporteur email
   */
  async init() {
    try {
      this.transporter = nodemailer.createTransporter({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
        tls: {
          rejectUnauthorized: false
        }
      });

      // Vérifier la connexion
      await this.transporter.verify();
      logger.info('Service email initialisé avec succès');
    } catch (error) {
      logger.error('Erreur initialisation service email', { error: error.message });
      throw error;
    }
  }

  /**
   * Envoie un email générique
   * @param {Object} options - Options d'envoi
   * @returns {Promise<Object>} Résultat de l'envoi
   */
  async sendEmail(options) {
    try {
      const {
        to,
        subject,
        html,
        text,
        attachments = [],
        cc,
        bcc
      } = options;

      const mailOptions = {
        from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
        to,
        subject,
        html,
        text: text || this.stripHtml(html),
        attachments,
        cc,
        bcc
      };

      const result = await this.transporter.sendMail(mailOptions);

      logger.info('Email envoyé avec succès', {
        to,
        subject,
        messageId: result.messageId
      });

      return {
        success: true,
        messageId: result.messageId,
        to,
        subject
      };
    } catch (error) {
      logger.error('Erreur envoi email', {
        error: error.message,
        to: options.to,
        subject: options.subject
      });
      
      throw new Error(`Erreur envoi email: ${error.message}`);
    }
  }

  /**
   * Envoie un email de facture
   * @param {Object} facture - Données de la facture
   * @param {Object} client - Données du client
   * @param {string} pdfPath - Chemin du PDF
   * @returns {Promise<Object>} Résultat de l'envoi
   */
  async sendFactureEmail(facture, client, pdfPath) {
    const subject = `Facture ${facture.numero_facture} - ${facture.entreprise_nom}`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2c3e50;">Nouvelle Facture</h2>
        
        <p>Bonjour ${client.nom},</p>
        
        <p>Veuillez trouver ci-joint votre facture :</p>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <strong>Numéro de facture :</strong> ${facture.numero_facture}<br>
          <strong>Date :</strong> ${new Date(facture.date_facture).toLocaleDateString('fr-FR')}<br>
          <strong>Montant TTC :</strong> ${facture.total_general}€
        </div>

        <p>Pour toute question concernant cette facture, n'hésitez pas à nous contacter.</p>
        
        <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px; color: #666; font-size: 12px;">
          <p><strong>${facture.entreprise_nom}</strong><br>
          Email: ${process.env.FROM_EMAIL}</p>
        </div>
      </div>
    `;

    return this.sendEmail({
      to: client.email,
      subject,
      html,
      attachments: pdfPath ? [{
        filename: `facture_${facture.numero_facture}.pdf`,
        path: pdfPath
      }] : []
    });
  }

  /**
   * Envoie un email de proforma
   * @param {Object} proforma - Données du proforma
   * @param {Object} client - Données du client
   * @param {string} pdfPath - Chemin du PDF
   * @returns {Promise<Object>} Résultat de l'envoi
   */
  async sendProformaEmail(proforma, client, pdfPath) {
    const subject = `Proforma ${proforma.numero_proforma} - ${proforma.entreprise_nom}`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2c3e50;">Nouveau Proforma</h2>
        
        <p>Bonjour ${client.nom},</p>
        
        <p>Veuillez trouver ci-joint votre proforma :</p>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <strong>Numéro de proforma :</strong> ${proforma.numero_proforma}<br>
          <strong>Date :</strong> ${new Date(proforma.date_proforma).toLocaleDateString('fr-FR')}<br>
          <strong>Montant TTC :</strong> ${proforma.total_general}€
        </div>

        <p>Ce proforma est valable 30 jours à compter de sa date d'émission.</p>
        
        <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px; color: #666; font-size: 12px;">
          <p><strong>${proforma.entreprise_nom}</strong><br>
          Email: ${process.env.FROM_EMAIL}</p>
        </div>
      </div>
    `;

    return this.sendEmail({
      to: client.email,
      subject,
      html,
      attachments: pdfPath ? [{
        filename: `proforma_${proforma.numero_proforma}.pdf`,
        path: pdfPath
      }] : []
    });
  }

  /**
   * Envoie un email de relance de paiement
   * @param {Object} facture - Données de la facture
   * @param {Object} client - Données du client
   * @param {number} nbRelances - Numéro de la relance
   * @returns {Promise<Object>} Résultat de l'envoi
   */
  async sendRelanceEmail(facture, client, nbRelances = 1) {
    const subject = `Relance ${nbRelances} - Facture ${facture.numero_facture} impayée`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #e74c3c;">Relance de Paiement ${nbRelances > 1 ? `(${nbRelances}ème relance)` : ''}</h2>
        
        <p>Bonjour ${client.nom},</p>
        
        <p>Nous constatons que la facture suivante n'a pas encore été réglée :</p>
        
        <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <strong>Numéro de facture :</strong> ${facture.numero_facture}<br>
          <strong>Date d'émission :</strong> ${new Date(facture.date_facture).toLocaleDateString('fr-FR')}<br>
          <strong>Date d'échéance :</strong> ${facture.date_echeance ? new Date(facture.date_echeance).toLocaleDateString('fr-FR') : 'Non définie'}<br>
          <strong>Montant TTC :</strong> ${facture.total_general}€
        </div>

        <p>Nous vous remercions de bien vouloir procéder au règlement dans les plus brefs délais.</p>
        
        <p>Si ce règlement a déjà été effectué, veuillez ne pas tenir compte de ce message.</p>
        
        <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px; color: #666; font-size: 12px;">
          <p><strong>${facture.entreprise_nom}</strong><br>
          Email: ${process.env.FROM_EMAIL}</p>
        </div>
      </div>
    `;

    return this.sendEmail({
      to: client.email,
      subject,
      html
    });
  }

  /**
   * Envoie un email d'alerte stock bas
   * @param {Object} stock - Données du stock
   * @param {Array} users - Utilisateurs à notifier
   * @returns {Promise<Array>} Résultats des envois
   */
  async sendStockAlertEmail(stock, users) {
    const subject = `Alerte Stock - ${stock.designation}`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #f39c12;">Alerte Stock Bas</h2>
        
        <p>Le stock suivant est en dessous du seuil minimum :</p>
        
        <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <strong>Article :</strong> ${stock.designation}<br>
          <strong>Référence :</strong> ${stock.reference}<br>
          <strong>Stock actuel :</strong> ${stock.quantite_stock}<br>
          <strong>Stock minimum :</strong> ${stock.quantite_min}
        </div>

        <p>Veuillez procéder au réapprovisionnement.</p>
        
        <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px; color: #666; font-size: 12px;">
          <p>Système de Gestion Héraclion</p>
        </div>
      </div>
    `;

    const promises = users.map(user => 
      this.sendEmail({
        to: user.email,
        subject,
        html
      })
    );

    return Promise.allSettled(promises);
  }

  /**
   * Supprime le HTML d'un texte
   * @param {string} html - Texte HTML
   * @returns {string} Texte sans HTML
   */
  stripHtml(html) {
    return html ? html.replace(/<[^>]*>/g, '') : '';
  }

  /**
   * Teste la configuration email
   * @returns {Promise<boolean>} Succès du test
   */
  async testConnection() {
    try {
      await this.transporter.verify();
      logger.info('Test connexion email réussi');
      return true;
    } catch (error) {
      logger.error('Test connexion email échoué', { error: error.message });
      return false;
    }
  }
}

// Créer une instance singleton
const emailService = new EmailService();

module.exports = emailService;