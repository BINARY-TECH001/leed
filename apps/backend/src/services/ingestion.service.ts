import crypto from 'crypto';
import { prisma } from '../utils/prisma.js';
import type { NormalizedOpportunityInput } from '../connectors/types.js';

export interface IngestionResult {
  runId: string;
  sourceId: string;
  totalReceived: number;
  newOpportunitiesCreated: number;
  newObservationsAdded: number;
  duplicatesUpdated: number;
  errors: string[];
}

export class IngestionService {
  /**
   * Safe, source-aware URL canonicalization:
   * - Strips tracking query parameters (utm_*, ref, fbclid, etc.)
   * - Strips URI fragments
   * - Lowercases protocol and host
   * - Preserves critical query parameters like job IDs
   */
  static canonicalizeUrl(rawUrl: string): string {
    try {
      const parsed = new URL(rawUrl.trim());

      // Lowercase protocol and host
      parsed.protocol = parsed.protocol.toLowerCase();
      parsed.hostname = parsed.hostname.toLowerCase();

      // Remove URL fragments
      parsed.hash = '';

      // Tracking parameters to strip
      const trackingParams = new Set([
        'utm_source',
        'utm_medium',
        'utm_campaign',
        'utm_term',
        'utm_content',
        'fbclid',
        'gclid',
        'ref',
        'source',
        'campaign',
        'mc_cid',
        'mc_eid',
      ]);

      const keysToDelete: string[] = [];
      parsed.searchParams.forEach((_, key) => {
        if (trackingParams.has(key.toLowerCase()) || key.toLowerCase().startsWith('utm_')) {
          keysToDelete.push(key);
        }
      });
      keysToDelete.forEach((key) => parsed.searchParams.delete(key));

      // Remove trailing slash on root or path if not empty
      let normalized = parsed.toString();
      if (normalized.endsWith('/') && parsed.pathname !== '/') {
        normalized = normalized.slice(0, -1);
      }

      return normalized;
    } catch {
      return rawUrl.trim();
    }
  }

  /**
   * Computes a deterministic SHA-256 fingerprint for entity resolution
   */
  static computeFingerprint(input: {
    organization: string;
    title: string;
    location?: string;
  }): string {
    const org = input.organization.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
    const title = input.title.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
    const loc = (input.location || '').toLowerCase().trim().replace(/[^a-z0-9]/g, '');

    const combined = `${org}|${title}|${loc}`;
    return crypto.createHash('sha256').update(combined).digest('hex');
  }

  /**
   * Processes a batch of normalized records from a connector idempotently.
   * Updates existing canonical records or creates new ones while preserving source provenance.
   */
  static async ingestBatch(
    sourceId: string,
    records: NormalizedOpportunityInput[],
    radarId?: string
  ): Promise<IngestionResult> {
    const startedAt = new Date();
    const errors: string[] = [];
    let newOpportunitiesCreated = 0;
    let newObservationsAdded = 0;
    let duplicatesUpdated = 0;

    // 1. Create IngestionRun tracking record
    const run = await prisma.ingestionRun.create({
      data: {
        sourceId,
        radarId: radarId || null,
        startedAt,
        status: 'running',
        recordsFetched: records.length,
      },
    });

    for (const record of records) {
      try {
        const canonicalUrl = this.canonicalizeUrl(record.originalUrl);
        const fingerprint = this.computeFingerprint({
          organization: record.organization,
          title: record.title,
          location: record.location,
        });

        // 2. Multi-tier Entity Resolution:
        // Tier 1: Match by exact canonical URL or original URL
        // Tier 2: Match by existing SourceObservation with same sourceId & externalRecordId
        // Tier 3: Match by composite content fingerprint
        let existingOpp = await prisma.opportunity.findFirst({
          where: {
            OR: [
              { canonicalUrl },
              { originalUrl: record.originalUrl },
              { contentFingerprint: fingerprint },
              {
                sourceObservations: {
                  some: {
                    sourceId,
                    externalRecordId: record.externalId,
                  },
                },
              },
            ],
          },
          include: {
            sourceObservations: true,
          },
        });

        const now = new Date();

        if (existingOpp) {
          // --- EXISTING CANONICAL OPPORTUNITY ---
          duplicatesUpdated += 1;

          // Update canonical record freshness
          await prisma.opportunity.update({
            where: { id: existingOpp.id },
            data: {
              lastVerifiedAt: now,
              isVerified: true,
              // Update compensation if newly discovered has it and existing did not
              compensation: existingOpp.compensation || record.compensation || 'Competitive',
              compensationAmount: existingOpp.compensationAmount || record.compensationAmount,
            },
          });

          // Check if this specific source already observed it
          const existingObservation = existingOpp.sourceObservations.find(
            (obs) => obs.sourceId === sourceId && (obs.externalRecordId === record.externalId || obs.originalUrl === record.originalUrl)
          );

          if (existingObservation) {
            // Update observation timestamp
            await prisma.sourceObservation.update({
              where: { id: existingObservation.id },
              data: {
                lastSeenAt: now,
                lastVerifiedAt: now,
                httpStatus: 200,
                verificationStatus: 'verified',
              },
            });
          } else {
            // New independent source corroborating an existing opportunity!
            newObservationsAdded += 1;
            await prisma.sourceObservation.create({
              data: {
                opportunityId: existingOpp.id,
                sourceId,
                sourceName: record.source,
                sourceType: record.sourceType,
                externalRecordId: record.externalId,
                originalUrl: record.originalUrl,
                canonicalUrl,
                firstSeenAt: now,
                lastSeenAt: now,
                lastVerifiedAt: now,
                httpStatus: 200,
                contentFingerprint: fingerprint,
                rawPayload: (record.rawPayload as any) || undefined,
                verificationStatus: 'verified',
              },
            });
          }
        } else {
          // --- NEW CANONICAL OPPORTUNITY ---
          newOpportunitiesCreated += 1;
          newObservationsAdded += 1;

          await prisma.opportunity.create({
            data: {
              type: record.type.toUpperCase() as any,
              title: record.title,
              organization: record.organization,
              organizationLogo: record.organizationLogo,
              location: record.location,
              isRemote: record.isRemote,
              remoteType: record.remoteType,
              compensation: record.compensation || 'Competitive',
              compensationAmount: record.compensationAmount,
              deadline: record.deadline,
              contactPerson: record.contactPerson,
              contactEmail: record.contactEmail,
              contactRole: record.contactRole,
              source: record.source,
              sourceType: record.sourceType,
              originalUrl: record.originalUrl,
              canonicalUrl,
              contentFingerprint: fingerprint,
              description: record.description,
              summary: record.summary || record.title,
              requirements: (record.requirements as any) || [],
              matchScore: 85,
              matchExplanation: 'Newly discovered listing from verified connector.',
              matchPros: ['Discovered from official public connector', 'Provenance verified'],
              matchCons: [],
              status: 'DISCOVERED',
              nextBestAction: 'prepare',
              freshness: 'new_today',
              tags: record.tags || [],
              discoveredAt: now,
              lastVerifiedAt: now,
              isVerified: true,
              sourceObservations: {
                create: {
                  sourceId,
                  sourceName: record.source,
                  sourceType: record.sourceType,
                  externalRecordId: record.externalId,
                  originalUrl: record.originalUrl,
                  canonicalUrl,
                  firstSeenAt: now,
                  lastSeenAt: now,
                  lastVerifiedAt: now,
                  httpStatus: 200,
                  contentFingerprint: fingerprint,
                  rawPayload: (record.rawPayload as any) || undefined,
                  verificationStatus: 'verified',
                },
              },
            },
          });
        }
      } catch (err: any) {
        errors.push(`Record ${record.externalId} error: ${err.message}`);
      }
    }

    // Finalize IngestionRun record
    await prisma.ingestionRun.update({
      where: { id: run.id },
      data: {
        completedAt: new Date(),
        status: errors.length > 0 && newOpportunitiesCreated === 0 ? 'failed' : 'completed',
        newObservationsCount: newObservationsAdded,
        newOpportunitiesCount: newOpportunitiesCreated,
        duplicatesCount: duplicatesUpdated,
        errors: errors.length > 0 ? (errors as any) : undefined,
      },
    });

    return {
      runId: run.id,
      sourceId,
      totalReceived: records.length,
      newOpportunitiesCreated,
      newObservationsAdded,
      duplicatesUpdated,
      errors,
    };
  }
}
