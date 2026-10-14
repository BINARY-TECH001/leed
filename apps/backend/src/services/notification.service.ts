import { getIO } from '../socket.js';

export interface NotificationPayload {
  userId: string;
  title: string;
  body: string;
  type: 'discovery' | 'pipeline' | 'followup' | 'system';
  data?: Record<string, any>;
}

export class NotificationService {
  static async sendToUser(payload: NotificationPayload): Promise<void> {
    try {
      const io = getIO();
      if (io) {
        io.to(`user:${payload.userId}`).emit('notification:new', {
          id: `notif-${Date.now()}`,
          ...payload,
          createdAt: new Date().toISOString(),
          isRead: false,
        });
      }
    } catch {
      // Socket server may not be initialized yet
    }
  }

  static async broadcastCrawlerDiscovery(radarTitle: string, count: number): Promise<void> {
    try {
      const io = getIO();
      if (io) {
        io.emit('crawler:discovery', {
          radarTitle,
          count,
          timestamp: new Date().toISOString(),
        });
      }
    } catch {
      // Graceful
    }
  }
}
