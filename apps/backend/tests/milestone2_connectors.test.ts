import test from 'node:test';
import assert from 'node:assert/strict';
import { IngestionService } from '../src/services/ingestion.service.js';
import { BaseConnector } from '../src/connectors/BaseConnector.js';
import { SourceRegistry } from '../src/connectors/SourceRegistry.js';
import type {
  ConnectorMetadata,
  DiscoveryParams,
  ConnectorDiscoveryResult,
  NormalizedOpportunityInput,
} from '../src/connectors/types.js';
import { prisma } from '../src/utils/prisma.js';

test('Milestone 2 — Provenance, Ingestion & Connector Framework Test Suite', async (t) => {
  await prisma.$connect();

  await t.test('1. URL Canonicalization & Tracking Stripping', () => {
    const raw1 = 'https://Example.COM/careers/staff-engineer/?utm_source=linkedin&utm_medium=cpc&ref=jobboard#apply-section';
    const canonical1 = IngestionService.canonicalizeUrl(raw1);
    assert.equal(canonical1, 'https://example.com/careers/staff-engineer');

    // Preserves necessary record identifiers
    const raw2 = 'https://boards.greenhouse.io/figma/jobs?gh_jid=4592019&utm_campaign=october';
    const canonical2 = IngestionService.canonicalizeUrl(raw2);
    assert.equal(canonical2, 'https://boards.greenhouse.io/figma/jobs?gh_jid=4592019');

    // Strips trailing slashes cleanly
    const raw3 = 'https://linear.app/careers/mobile-engineer/';
    const canonical3 = IngestionService.canonicalizeUrl(raw3);
    assert.equal(canonical3, 'https://linear.app/careers/mobile-engineer');
  });

  await t.test('2. Content Fingerprinting Determinism', () => {
    const hash1 = IngestionService.computeFingerprint({
      organization: 'Vercel, Inc.',
      title: 'Senior Edge AI Engineer',
      location: 'Remote, Worldwide',
    });
    const hash2 = IngestionService.computeFingerprint({
      organization: 'vercel inc',
      title: '  senior edge ai engineer  ',
      location: 'remote worldwide',
    });
    assert.equal(hash1, hash2, 'Fingerprint must be deterministic and normalize case/spacing');
    assert.equal(hash1.length, 64, 'SHA-256 output is 64 hex characters');
  });

  await t.test('3. Connector Contract & SourceRegistry Telemetry', async () => {
    const registry = SourceRegistry.getInstance();

    class MockTestConnector extends BaseConnector {
      readonly metadata: ConnectorMetadata = {
        id: 'mock_test_board',
        name: 'Mock Test Job Board',
        categories: ['job', 'contract'],
        homepageUrl: 'https://mocktest.dev',
        isConfigured: true,
        requiresAuth: false,
        rateLimitPerMinute: 60,
        description: 'Unit test verification connector',
      };

      async validateConfig(): Promise<boolean> {
        return true;
      }

      async discover(params: DiscoveryParams): Promise<ConnectorDiscoveryResult> {
        return {
          sourceId: this.metadata.id,
          records: [],
          hasMore: false,
        };
      }
    }

    const testConnector = new MockTestConnector();
    registry.register(testConnector);

    assert.ok(registry.get('mock_test_board'), 'Connector registered and queryable by ID');
    assert.ok(registry.getByCategory('job').length >= 1, 'Connector queryable by category');

    // Test health tracking
    testConnector.recordSuccess(15);
    const health = testConnector.getHealth();
    assert.equal(health.status, 'available');
    assert.equal(health.totalRecordsIngested, 15);
    assert.ok(health.lastSuccessfulCollectionAt, 'Timestamp recorded on success');

    // Test failure tracking
    testConnector.recordFailure('Rate limit exceeded', 'rate_limited');
    const failedHealth = testConnector.getHealth();
    assert.equal(failedHealth.status, 'rate_limited');
    assert.equal(failedHealth.consecutiveFailures, 1);
    assert.equal(failedHealth.errorMessage, 'Rate limit exceeded');

    // Test enable / disable
    registry.disable('mock_test_board');
    assert.equal(registry.isEnabled('mock_test_board'), false);
    assert.equal(registry.getByCategory('job').find((c) => c.metadata.id === 'mock_test_board'), undefined);

    registry.enable('mock_test_board');
    assert.equal(registry.isEnabled('mock_test_board'), true);
  });

  await t.test('4. IngestionService Idempotency & Multi-Source Corroboration', async () => {
    const runTimestamp = Date.now();
    const testUrlA = `https://careers.acme-corp-${runTimestamp}.io/jobs/senior-mobile-lead?ref=test`;
    const testUrlB = `https://careers.acme-corp-${runTimestamp}.io/jobs/principal-distributed-architect`;

    const sampleBatch: NormalizedOpportunityInput[] = [
      {
        externalId: `ext-acme-1-${runTimestamp}`,
        type: 'contract',
        title: `Senior Mobile Lead (${runTimestamp})`,
        organization: `Acme Corp ${runTimestamp}`,
        location: 'Remote · Global',
        isRemote: true,
        compensation: '$130/hr',
        compensationAmount: 130,
        source: 'Acme Careers API',
        sourceType: 'official_api',
        originalUrl: testUrlA,
        description: 'Lead mobile architecture with zero compromise on quality.',
        summary: 'Senior mobile lead contract.',
        requirements: [{ text: 'TypeScript', isMatched: true }],
        tags: ['React Native', 'Expo', 'Contract'],
        rawPayload: { apiVersion: 'v1', originalPostId: 101 },
      },
      {
        externalId: `ext-acme-2-${runTimestamp}`,
        type: 'job',
        title: `Principal Distributed Architect (${runTimestamp})`,
        organization: `Acme Corp ${runTimestamp}`,
        location: 'San Francisco, CA / Remote',
        isRemote: true,
        compensation: '$210,000/yr',
        compensationAmount: 210000,
        source: 'Acme Careers API',
        sourceType: 'official_api',
        originalUrl: testUrlB,
        description: 'Design distributed database synchronization.',
        summary: 'Principal distributed systems engineer.',
        requirements: [{ text: 'CRDT', isMatched: true }],
        tags: ['Distributed', 'TypeScript'],
        rawPayload: { apiVersion: 'v1', originalPostId: 102 },
      },
    ];

    // --- EXECUTION 1: First Ingestion ---
    const initialResult = await IngestionService.ingestBatch('acme_careers_api', sampleBatch);
    assert.equal(initialResult.newOpportunitiesCreated, 2, 'First ingestion creates 2 canonical records');
    assert.equal(initialResult.duplicatesUpdated, 0, 'No duplicates in first batch');
    assert.equal(initialResult.errors.length, 0, 'No errors during ingestion');

    // Verify IngestionRun was recorded
    const ingestionRunRecord = await prisma.ingestionRun.findUnique({
      where: { id: initialResult.runId },
    });
    assert.ok(ingestionRunRecord, 'IngestionRun persisted in PostgreSQL');
    assert.equal(ingestionRunRecord.status, 'completed');
    assert.equal(ingestionRunRecord.newOpportunitiesCount, 2);

    // Verify canonical opportunities exist in DB
    const oppA = await prisma.opportunity.findFirst({
      where: { canonicalUrl: IngestionService.canonicalizeUrl(testUrlA) },
      include: { sourceObservations: true },
    });
    assert.ok(oppA, 'Canonical opportunity A persisted');
    assert.equal(oppA.sourceObservations.length, 1, 'Opp A has 1 source observation');
    assert.equal(oppA.sourceObservations[0].sourceId, 'acme_careers_api');

    // --- EXECUTION 2: Ingest the EXACT same batch again (Idempotency Test) ---
    const duplicateResult = await IngestionService.ingestBatch('acme_careers_api', sampleBatch);
    assert.equal(duplicateResult.newOpportunitiesCreated, 0, 'Second run must NOT create duplicate opportunities');
    assert.equal(duplicateResult.duplicatesUpdated, 2, 'Second run successfully updates duplicates');

    // --- EXECUTION 3: Multi-Source Corroboration ---
    // A second independent source (e.g. Adzuna aggregator) finds the exact same job (same canonical URL)
    const corroboratingRecord: NormalizedOpportunityInput = {
      externalId: `adzuna-job-${runTimestamp}`,
      type: 'contract',
      title: `Senior Mobile Lead (${runTimestamp})`,
      organization: `Acme Corp ${runTimestamp}`,
      location: 'Remote · Global',
      isRemote: true,
      compensation: '$130/hr',
      compensationAmount: 130,
      source: 'Adzuna Aggregated Index',
      sourceType: 'aggregator_feed',
      originalUrl: testUrlA, // Same canonical URL!
      description: 'Lead mobile architecture with zero compromise on quality.',
      summary: 'Senior mobile lead contract.',
      requirements: [{ text: 'TypeScript', isMatched: true }],
      tags: ['React Native'],
      rawPayload: { aggregatorId: 'adz-999' },
    };

    const multiSourceResult = await IngestionService.ingestBatch('adzuna_index', [corroboratingRecord]);
    assert.equal(multiSourceResult.newOpportunitiesCreated, 0, 'Must not duplicate canonical opportunity');
    assert.equal(multiSourceResult.newObservationsAdded, 1, 'Must add a new corroborating SourceObservation');

    // Check opportunity A now has 2 independent source observations!
    const reloadedOppA = await prisma.opportunity.findUnique({
      where: { id: oppA.id },
      include: { sourceObservations: true },
    });
    assert.ok(reloadedOppA);
    assert.equal(reloadedOppA.sourceObservations.length, 2, 'Opportunity now corroborated by 2 independent sources!');

    const sourceIds = reloadedOppA.sourceObservations.map((s) => s.sourceId);
    assert.ok(sourceIds.includes('acme_careers_api'), 'Primary source observation preserved');
    assert.ok(sourceIds.includes('adzuna_index'), 'Corroborating source observation preserved');

    // Cleanup test opportunities and runs
    await prisma.sourceObservation.deleteMany({
      where: { opportunityId: oppA.id },
    });
    await prisma.opportunity.deleteMany({
      where: { id: { in: [oppA.id, (await prisma.opportunity.findFirst({ where: { canonicalUrl: IngestionService.canonicalizeUrl(testUrlB) } }))?.id || ''] } },
    });
    await prisma.ingestionRun.deleteMany({
      where: { sourceId: { in: ['acme_careers_api', 'adzuna_index'] } },
    });
  });

  await prisma.$disconnect();
});
