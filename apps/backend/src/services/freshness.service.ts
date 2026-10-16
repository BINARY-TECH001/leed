import { prisma } from '../utils/prisma.js';

export interface FreshnessCheckResult {
  opportunityId: string;
  isFresh: boolean;
  status: string;
  verificationStatus: string;
  reason?: string;
  statusCode?: number;
  checkedAt: Date;
}

export interface SweepSummary {
  scannedCount: number;
  expiredByDeadline: number;
  unreachableCount: number;
  verifiedActiveCount: number;
}

export class FreshnessService {
  /**
   * Probe an opportunity's canonical URL to check if the remote job/opportunity post is still live.
   */
  static async checkUrlLiveness(url: string, timeoutMs: number = 6000): Promise<{
    isReachable: boolean;
    statusCode?: number;
    error?: string;
  }> {
    try {
      // Use HEAD request to conserve bandwidth; fall back to GET if HEAD is rejected (405)
      let res = await fetch(url, {
        method: 'HEAD',
        headers: {
          'User-Agent': 'Leed-Freshness-Verifier/1.0.0 (https://leed.dev)',
        },
        signal: AbortSignal.timeout(timeoutMs),
      });

      if (res.status === 405) {
        // Method Not Allowed for HEAD, try GET
        res = await fetch(url, {
          method: 'GET',
          headers: {
            'User-Agent': 'Leed-Freshness-Verifier/1.0.0 (https://leed.dev)',
          },
          signal: AbortSignal.timeout(timeoutMs),
        });
      }

      const isReachable = res.status >= 200 && res.status < 400;
      return {
        isReachable,
        statusCode: res.status,
      };
    } catch (err: any) {
      return {
        isReachable: false,
        error: err.message,
      };
    }
  }

  /**
   * Verify an individual opportunity's freshness against deadline and remote HTTP availability.
   */
  static async verifyOpportunity(opportunityId: string): Promise<FreshnessCheckResult> {
    const opp = await prisma.opportunity.findUnique({
      where: { id: opportunityId },
    });

    if (!opp) {
      throw new Error(`Opportunity ${opportunityId} not found`);
    }

    const now = new Date();
    const currentMetadata = (opp.metadata as Record<string, any>) || {};

    // 1. Check if deadline has elapsed
    if (opp.deadline && new Date(opp.deadline) < now) {
      await prisma.opportunity.update({
        where: { id: opportunityId },
        data: {
          isVerified: false,
          status: 'ARCHIVED',
          lastVerifiedAt: now,
          expiresAt: now,
          metadata: {
            ...currentMetadata,
            verificationStatus: 'expired',
            lastFreshnessCheck: now.toISOString(),
            freshnessReason: 'Deadline elapsed',
          },
        },
      });

      return {
        opportunityId,
        isFresh: false,
        status: 'archived',
        verificationStatus: 'expired',
        reason: 'Application deadline has elapsed',
        checkedAt: now,
      };
    }

    // 2. Check canonical URL reachability
    const probe = await this.checkUrlLiveness(opp.canonicalUrl || opp.originalUrl);

    if (probe.statusCode === 404 || probe.statusCode === 410) {
      await prisma.opportunity.update({
        where: { id: opportunityId },
        data: {
          isVerified: false,
          status: 'ARCHIVED',
          lastVerifiedAt: now,
          metadata: {
            ...currentMetadata,
            verificationStatus: 'unreachable',
            lastFreshnessCheck: now.toISOString(),
            freshnessReason: `HTTP ${probe.statusCode} Gone/NotFound`,
          },
        },
      });

      return {
        opportunityId,
        isFresh: false,
        status: 'archived',
        verificationStatus: 'unreachable',
        statusCode: probe.statusCode,
        reason: `Source page returned HTTP ${probe.statusCode}`,
        checkedAt: now,
      };
    }

    // Opportunity remains active and verified
    await prisma.opportunity.update({
      where: { id: opportunityId },
      data: {
        isVerified: true,
        lastVerifiedAt: now,
        metadata: {
          ...currentMetadata,
          verificationStatus: 'verified',
          lastFreshnessCheck: now.toISOString(),
          freshnessReason: 'Verified live and reachable',
        },
      },
    });

    return {
      opportunityId,
      isFresh: true,
      status: opp.status.toLowerCase(),
      verificationStatus: 'verified',
      statusCode: probe.statusCode,
      checkedAt: now,
    };
  }

  /**
   * Batch sweep over opportunities to expire elapsed deadlines and verify active listings.
   */
  static async sweepStaleOpportunities(batchLimit: number = 25): Promise<SweepSummary> {
    const now = new Date();
    let expiredByDeadline = 0;
    let unreachableCount = 0;
    let verifiedActiveCount = 0;

    // 1. Instant DB sweep for elapsed deadlines
    const deadlineExpired = await prisma.opportunity.updateMany({
      where: {
        deadline: { lt: now },
        status: { not: 'ARCHIVED' },
      },
      data: {
        isVerified: false,
        status: 'ARCHIVED',
        lastVerifiedAt: now,
        expiresAt: now,
      },
    });
    expiredByDeadline = deadlineExpired.count;

    // 2. Sample candidate opportunities that need liveness checks
    const candidates = await prisma.opportunity.findMany({
      where: {
        status: { not: 'ARCHIVED' },
        isVerified: true,
      },
      take: batchLimit,
      orderBy: { discoveredAt: 'asc' },
    });

    for (const candidate of candidates) {
      try {
        const probe = await this.checkUrlLiveness(candidate.canonicalUrl || candidate.originalUrl);
        const meta = (candidate.metadata as Record<string, any>) || {};

        if (probe.statusCode === 404 || probe.statusCode === 410) {
          await prisma.opportunity.update({
            where: { id: candidate.id },
            data: {
              isVerified: false,
              status: 'ARCHIVED',
              lastVerifiedAt: now,
              metadata: {
                ...meta,
                verificationStatus: 'unreachable',
                lastFreshnessCheck: now.toISOString(),
                freshnessReason: `HTTP ${probe.statusCode}`,
              },
            },
          });
          unreachableCount++;
        } else {
          await prisma.opportunity.update({
            where: { id: candidate.id },
            data: {
              isVerified: true,
              lastVerifiedAt: now,
              metadata: {
                ...meta,
                verificationStatus: 'verified',
                lastFreshnessCheck: now.toISOString(),
                freshnessReason: 'Verified live',
              },
            },
          });
          verifiedActiveCount++;
        }
      } catch {
        // Safe continuation on network probe hiccups
      }
    }

    return {
      scannedCount: candidates.length,
      expiredByDeadline,
      unreachableCount,
      verifiedActiveCount,
    };
  }

  private static intervalHandle: NodeJS.Timeout | null = null;
  private static isSweeping = false;

  static start(intervalMs: number = 300000): void {
    if (this.intervalHandle) return;

    this.intervalHandle = setInterval(async () => {
      if (this.isSweeping) return;
      this.isSweeping = true;
      try {
        await this.sweepStaleOpportunities(15);
      } catch (err: any) {
        console.warn(`[FreshnessService] Sweep error: ${err.message}`);
      } finally {
        this.isSweeping = false;
      }
    }, intervalMs);
  }

  static stop(): void {
    if (this.intervalHandle) {
      clearInterval(this.intervalHandle);
      this.intervalHandle = null;
    }
  }
}
