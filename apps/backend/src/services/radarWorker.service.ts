import { prisma } from '../utils/prisma.js';
import { RadarService } from './radar.service.js';

export class RadarWorkerService {
  private static intervalHandle: NodeJS.Timeout | null = null;
  private static isRunning = false;
  private static activeScans = new Set<string>();
  private static currentIntervalMs = 60000;

  /**
   * Starts the background radar scanner worker process
   */
  static start(intervalMs: number = 60000): void {
    if (this.intervalHandle) return;

    this.currentIntervalMs = intervalMs;
    this.intervalHandle = setInterval(async () => {
      await this.processDueRadars();
    }, intervalMs);

    // Initial pass (non-blocking)
    this.processDueRadars().catch(() => {});
  }

  /**
   * Stops the background worker process
   */
  static stop(): void {
    if (this.intervalHandle) {
      clearInterval(this.intervalHandle);
      this.intervalHandle = null;
    }
  }

  /**
   * Evaluates and executes any active radars whose nextRunAt timestamp has elapsed
   */
  static async processDueRadars(): Promise<{
    processedCount: number;
    errors: string[];
  }> {
    if (this.isRunning) {
      return { processedCount: 0, errors: [] };
    }

    this.isRunning = true;
    const errors: string[] = [];
    let processedCount = 0;

    try {
      const now = new Date();
      const dueRadars = await prisma.opportunityRadar.findMany({
        where: {
          status: 'active',
          nextRunAt: { lte: now },
        },
        take: 10,
      });

      for (const radar of dueRadars) {
        if (this.activeScans.has(radar.id)) continue;
        this.activeScans.add(radar.id);

        try {
          await RadarService.triggerScan(radar.userId, radar.id);
          processedCount++;
        } catch (err: any) {
          errors.push(`Radar ${radar.id} error: ${err.message}`);
        } finally {
          this.activeScans.delete(radar.id);
        }
      }
    } catch (err: any) {
      errors.push(`Worker error: ${err.message}`);
    } finally {
      this.isRunning = false;
    }

    return { processedCount, errors };
  }

  static getStatus(): {
    isActive: boolean;
    intervalMs: number;
    activeScansCount: number;
  } {
    return {
      isActive: this.intervalHandle !== null,
      intervalMs: this.currentIntervalMs,
      activeScansCount: this.activeScans.size,
    };
  }
}
