import { getWebSocketServer } from '../lib/websocket.js';
import { logger } from '../lib/logger.js';

export interface CurrencyUpdate {
  userId: string | number;
  spiritCrystals: number;
  voidShards: number;
  pactSeals: number;
  change?: {
    spiritCrystals?: number;
    voidShards?: number;
    pactSeals?: number;
  };
}

export interface BannerUpdate {
  bannerId: string | number;
  action: 'created' | 'updated' | 'deleted' | 'activated' | 'deactivated';
  banner?: any;
}

export interface MonsterUpdate {
  userId: string | number;
  monster: any;
  action: 'obtained' | 'updated' | 'evolved';
}

export class NotificationService {
  /**
   * Broadcast currency update to a specific user
   */
  public static broadcastCurrencyUpdate(update: CurrencyUpdate): void {
    try {
      const wsServer = getWebSocketServer();
      wsServer.sendToUser(update.userId, {
        type: 'currency_update',
        payload: {
          spiritCrystals: update.spiritCrystals,
          voidShards: update.voidShards,
          pactSeals: update.pactSeals,
          change: update.change,
          timestamp: new Date().toISOString()
        }
      });

      logger.debug({ userId: update.userId, change: update.change }, 'Currency update broadcast');
    } catch (error) {
      // WebSocket server might not be initialized or user not connected
      logger.debug({ error, userId: update.userId }, 'Failed to broadcast currency update');
    }
  }

  /**
   * Broadcast banner update to all connected users
   */
  public static broadcastBannerUpdate(update: BannerUpdate): void {
    try {
      const wsServer = getWebSocketServer();
      wsServer.broadcast({
        type: 'banner_update',
        payload: {
          bannerId: update.bannerId,
          action: update.action,
          banner: update.banner,
          timestamp: new Date().toISOString()
        }
      });

      logger.debug({ bannerId: update.bannerId, action: update.action }, 'Banner update broadcast');
    } catch (error) {
      logger.debug({ error, bannerId: update.bannerId }, 'Failed to broadcast banner update');
    }
  }

  /**
   * Notify user about new monster obtained
   */
  public static notifyMonsterObtained(update: MonsterUpdate): void {
    try {
      const wsServer = getWebSocketServer();
      wsServer.sendToUser(update.userId, {
        type: 'monster_obtained',
        payload: {
          monster: update.monster,
          action: update.action,
          timestamp: new Date().toISOString()
        }
      });

      logger.debug({ userId: update.userId, monsterId: update.monster.id }, 'Monster obtained notification sent');
    } catch (error) {
      logger.debug({ error, userId: update.userId }, 'Failed to send monster obtained notification');
    }
  }

  /**
   * Send a generic notification to a user
   */
  public static notifyUser(userId: number, type: string, payload: any): void {
    try {
      const wsServer = getWebSocketServer();
      wsServer.sendToUser(userId, {
        type,
        payload: {
          ...payload,
          timestamp: new Date().toISOString()
        }
      });

      logger.debug({ userId, type }, 'Generic notification sent');
    } catch (error) {
      logger.debug({ error, userId, type }, 'Failed to send generic notification');
    }
  }

  /**
   * Broadcast a system-wide announcement
   */
  public static broadcastAnnouncement(message: string, severity: 'info' | 'warning' | 'error' = 'info'): void {
    try {
      const wsServer = getWebSocketServer();
      wsServer.broadcast({
        type: 'announcement',
        payload: {
          message,
          severity,
          timestamp: new Date().toISOString()
        }
      });

      logger.info({ message, severity }, 'System announcement broadcast');
    } catch (error) {
      logger.error({ error, message }, 'Failed to broadcast announcement');
    }
  }

  /**
   * Notify guild members about guild-related events
   */
  public static notifyGuild(guildId: number, type: string, payload: any): void {
    // This would require tracking guild memberships
    // For now, we'll log it as a placeholder
    logger.debug({ guildId, type }, 'Guild notification (not implemented yet)');
  }
}
