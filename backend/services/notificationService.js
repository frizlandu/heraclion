const BaseModel = require('../models/base/BaseModel');
const { logger } = require('../middleware/logger');

class NotificationService {
  constructor() {
    this.notificationModel = new BaseModel('notifications');
  }

  /**
   * Crée une notification
   * @param {Object} data - Données de la notification
   * @returns {Promise<Object>} Notification créée
   */
  async createNotification(data) {
    try {
      const notification = await this.notificationModel.create({
        type_notification: data.type,
        titre: data.titre,
        message: data.message,
        utilisateur_id: data.utilisateur_id,
        data: data.data ? JSON.stringify(data.data) : null,
        lu: false,
        created_at: new Date()
      });

      logger.info('Notification créée', {
        id: notification.id,
        type: data.type,
        utilisateur_id: data.utilisateur_id
      });

      return notification;
    } catch (error) {
      logger.error('Erreur création notification', {
        error: error.message,
        data
      });
      throw error;
    }
  }

  /**
   * Crée des notifications pour plusieurs utilisateurs
   * @param {Object} data - Données de la notification
   * @param {Array} userIds - IDs des utilisateurs
   * @returns {Promise<Array>} Notifications créées
   */
  async createBulkNotifications(data, userIds) {
    const promises = userIds.map(userId => 
      this.createNotification({
        ...data,
        utilisateur_id: userId
      })
    );

    return Promise.allSettled(promises);
  }

  /**
   * Récupère les notifications d'un utilisateur
   * @param {number} userId - ID de l'utilisateur
   * @param {Object} options - Options de pagination
   * @returns {Promise<Object>} Notifications avec pagination
   */
  async getUserNotifications(userId, options = {}) {
    const { limit = 20, offset = 0, unreadOnly = false } = options;

    let whereClause = 'utilisateur_id = $1';
    let params = [userId];

    if (unreadOnly) {
      whereClause += ' AND lu = false';
    }

    const notifications = await this.notificationModel.findAll({
      where: whereClause,
      whereParams: params,
      limit,
      offset,
      orderBy: 'created_at',
      orderDirection: 'DESC'
    });

    const total = await this.notificationModel.count(whereClause, params);

    return {
      notifications: notifications.map(notif => ({
        ...notif,
        data: notif.data ? JSON.parse(notif.data) : null
      })),
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    };
  }

  /**
   * Marque une notification comme lue
   * @param {number} notificationId - ID de la notification
   * @param {number} userId - ID de l'utilisateur
   * @returns {Promise<Object>} Notification mise à jour
   */
  async markAsRead(notificationId, userId) {
    const notification = await this.notificationModel.findById(notificationId);
    
    if (!notification) {
      throw new Error('Notification non trouvée');
    }

    if (notification.utilisateur_id !== userId) {
      throw new Error('Accès non autorisé à cette notification');
    }

    return this.notificationModel.update(notificationId, { lu: true });
  }

  /**
   * Marque toutes les notifications d'un utilisateur comme lues
   * @param {number} userId - ID de l'utilisateur
   * @returns {Promise<number>} Nombre de notifications mises à jour
   */
  async markAllAsRead(userId) {
    const query = `
      UPDATE notifications 
      SET lu = true, updated_at = CURRENT_TIMESTAMP 
      WHERE utilisateur_id = $1 AND lu = false
    `;
    
    const result = await this.notificationModel.query(query, [userId]);
    return result.rowCount;
  }

  /**
   * Supprime une notification
   * @param {number} notificationId - ID de la notification
   * @param {number} userId - ID de l'utilisateur
   * @returns {Promise<boolean>} Succès de la suppression
   */
  async deleteNotification(notificationId, userId) {
    const notification = await this.notificationModel.findById(notificationId);
    
    if (!notification) {
      throw new Error('Notification non trouvée');
    }

    if (notification.utilisateur_id !== userId) {
      throw new Error('Accès non autorisé à cette notification');
    }

    return this.notificationModel.delete(notificationId);
  }

  /**
   * Compte les notifications non lues d'un utilisateur
   * @param {number} userId - ID de l'utilisateur
   * @returns {Promise<number>} Nombre de notifications non lues
   */
  async getUnreadCount(userId) {
    return this.notificationModel.count(
      'utilisateur_id = $1 AND lu = false',
      [userId]
    );
  }

  // ========== NOTIFICATIONS MÉTIER ==========

  /**
   * Notification de création de facture
   * @param {Object} facture - Données de la facture
   * @param {Array} userIds - IDs des utilisateurs à notifier
   */
  async notifyFactureCreated(facture, userIds) {
    const data = {
      type: 'FACTURE_CREATED',
      titre: 'Nouvelle facture créée',
      message: `La facture ${facture.numero_facture} a été créée pour un montant de ${facture.total_general}€`,
      data: {
        factureId: facture.id,
        numeroFacture: facture.numero_facture,
        montant: facture.total_general
      }
    };

    return this.createBulkNotifications(data, userIds);
  }

  /**
   * Notification de paiement de facture
   * @param {Object} facture - Données de la facture
   * @param {Array} userIds - IDs des utilisateurs à notifier
   */
  async notifyFacturePaid(facture, userIds) {
    const data = {
      type: 'FACTURE_PAID',
      titre: 'Facture payée',
      message: `La facture ${facture.numero_facture} a été marquée comme payée`,
      data: {
        factureId: facture.id,
        numeroFacture: facture.numero_facture,
        montant: facture.total_general
      }
    };

    return this.createBulkNotifications(data, userIds);
  }

  /**
   * Notification de facture en retard
   * @param {Object} facture - Données de la facture
   * @param {Array} userIds - IDs des utilisateurs à notifier
   */
  async notifyFactureOverdue(facture, userIds) {
    const data = {
      type: 'FACTURE_OVERDUE',
      titre: 'Facture en retard',
      message: `La facture ${facture.numero_facture} est en retard de paiement`,
      data: {
        factureId: facture.id,
        numeroFacture: facture.numero_facture,
        montant: facture.total_general,
        dateEcheance: facture.date_echeance
      }
    };

    return this.createBulkNotifications(data, userIds);
  }

  /**
   * Notification de stock bas
   * @param {Object} stock - Données du stock
   * @param {Array} userIds - IDs des utilisateurs à notifier
   */
  async notifyStockLow(stock, userIds) {
    const data = {
      type: 'STOCK_LOW',
      titre: 'Stock bas',
      message: `Le stock de "${stock.designation}" est bas (${stock.quantite_stock} restant)`,
      data: {
        stockId: stock.id,
        reference: stock.reference,
        designation: stock.designation,
        quantiteStock: stock.quantite_stock,
        quantiteMin: stock.quantite_min
      }
    };

    return this.createBulkNotifications(data, userIds);
  }

  /**
   * Notification de nouveau client
   * @param {Object} client - Données du client
   * @param {Array} userIds - IDs des utilisateurs à notifier
   */
  async notifyNewClient(client, userIds) {
    const data = {
      type: 'CLIENT_CREATED',
      titre: 'Nouveau client',
      message: `Un nouveau client "${client.nom}" a été ajouté`,
      data: {
        clientId: client.id,
        nom: client.nom,
        email: client.email
      }
    };

    return this.createBulkNotifications(data, userIds);
  }

  /**
   * Notification de sauvegarde système
   * @param {string} status - Statut de la sauvegarde (success/error)
   * @param {Array} adminIds - IDs des administrateurs
   */
  async notifySystemBackup(status, adminIds, details = {}) {
    const isSuccess = status === 'success';
    const data = {
      type: 'SYSTEM_BACKUP',
      titre: isSuccess ? 'Sauvegarde réussie' : 'Échec de sauvegarde',
      message: isSuccess 
        ? 'La sauvegarde automatique a été effectuée avec succès'
        : 'La sauvegarde automatique a échoué',
      data: {
        status,
        timestamp: new Date().toISOString(),
        ...details
      }
    };

    return this.createBulkNotifications(data, adminIds);
  }

  /**
   * Nettoie les anciennes notifications
   * @param {number} daysOld - Nombre de jours (par défaut 30)
   * @returns {Promise<number>} Nombre de notifications supprimées
   */
  async cleanupOldNotifications(daysOld = 30) {
    const query = `
      DELETE FROM notifications 
      WHERE created_at < NOW() - INTERVAL '${daysOld} days'
      AND lu = true
    `;
    
    const result = await this.notificationModel.query(query);
    
    logger.info('Nettoyage notifications anciennes', {
      daysOld,
      deletedCount: result.rowCount
    });

    return result.rowCount;
  }

  /**
   * Récupère les statistiques des notifications
   * @param {number} userId - ID de l'utilisateur (optionnel)
   * @returns {Promise<Object>} Statistiques
   */
  async getStats(userId = null) {
    let whereClause = '';
    let params = [];

    if (userId) {
      whereClause = 'WHERE utilisateur_id = $1';
      params = [userId];
    }

    const query = `
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE lu = false) as non_lues,
        COUNT(*) FILTER (WHERE lu = true) as lues,
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '24 hours') as derniere_24h,
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') as derniere_semaine
      FROM notifications
      ${whereClause}
    `;

    const result = await this.notificationModel.query(query, params);
    return result.rows[0];
  }
}

// Créer une instance singleton
const notificationService = new NotificationService();

module.exports = notificationService;