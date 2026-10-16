import test from 'node:test';
import assert from 'node:assert/strict';
import { GreenhouseConnector } from '../src/connectors/GreenhouseConnector.js';
import { ArbeitnowConnector } from '../src/connectors/ArbeitnowConnector.js';
import { IngestionService } from '../src/services/ingestion.service.js';
import { OpportunityService } from '../src/services/opportunity.service.js';
import { prisma } from '../src/utils/prisma.js';

test('Milestone 3 — Live External Sources & Ingestion Test Suite', async (t) => {
  await prisma.$connect();

  const greenhouse = new GreenhouseConnector(['figma']);
  const arbeitnow = new ArbeitnowConnector();

  await t.test('1. Greenhouse Connector Configuration & Live Reachability', async () => {
    const isConfigValid = await greenhouse.validateConfig();
    assert.equal(isConfigValid, true, 'Greenhouse public board endpoint is reachable and valid');
  });

  await t.test('2. Greenhouse Live Discovery & Field Normalization', async () => {
    const result = await greenhouse.discover({ limit: 3 });
    assert.equal(result.sourceId, 'greenhouse');
    assert.ok(result.records.length > 0, 'Greenhouse returned live public job records');

    const sample = result.records[0];
    assert.ok(sample.externalId.startsWith('gh-figma-'), 'External ID contains board and job ID');
    assert.ok(sample.title.length > 0, 'Job title is extracted');
    assert.equal(sample.organization, 'Figma');
    assert.ok(sample.originalUrl.includes('boards.greenhouse.io') || sample.originalUrl.includes('figma.com'), 'Original URL is valid');
    assert.equal(sample.source, 'Greenhouse (Figma)');
    assert.equal(sample.sourceType, 'official_ats_api');
    assert.ok(sample.rawPayload?.greenhouseJobId, 'Raw payload preserves original greenhouse job ID');
  });

  await t.test('3. Arbeitnow Connector Configuration & Live Reachability', async () => {
    const isConfigValid = await arbeitnow.validateConfig();
    assert.equal(isConfigValid, true, 'Arbeitnow public API endpoint is reachable');
  });

  await t.test('4. Arbeitnow Live Discovery & Field Normalization', async () => {
    const result = await arbeitnow.discover({ limit: 3, remoteOnly: true });
    assert.equal(result.sourceId, 'arbeitnow');
    assert.ok(result.records.length > 0, 'Arbeitnow returned live job records');

    const sample = result.records[0];
    assert.ok(sample.externalId.startsWith('arbeitnow-'), 'External ID has arbeitnow prefix');
    assert.ok(sample.title.length > 0, 'Job title is populated');
    assert.ok(sample.organization.length > 0, 'Company name is populated');
    assert.equal(sample.isRemote, true, 'Remote filter honored');
    assert.ok(sample.originalUrl.startsWith('http'), 'Original URL is valid HTTP link');
    assert.equal(sample.source, 'Arbeitnow Job Board');
    assert.equal(sample.sourceType, 'public_job_board_api');
  });

  await t.test('5. Ingestion of Live Discovered Records into PostgreSQL', async () => {
    // Collect 2 real records from Greenhouse and 2 from Arbeitnow
    const ghRes = await greenhouse.discover({ limit: 2 });
    const arbRes = await arbeitnow.discover({ limit: 2 });

    const combinedLiveRecords = [...ghRes.records, ...arbRes.records];
    assert.ok(combinedLiveRecords.length >= 2, 'Collected live records for database persistence');

    // Ingest via IngestionService
    const ingestResult = await IngestionService.ingestBatch('live_test_run', combinedLiveRecords);
    assert.ok(ingestResult.totalReceived >= 2);
    assert.equal(ingestResult.errors.length, 0, 'Live records ingested with zero errors');

    // Query canonical database for the newly ingested records
    const testRecordUrls = combinedLiveRecords.map((r) => IngestionService.canonicalizeUrl(r.originalUrl));
    const persistedOpps = await prisma.opportunity.findMany({
      where: {
        canonicalUrl: { in: testRecordUrls },
      },
      include: {
        sourceObservations: true,
      },
    });

    assert.ok(persistedOpps.length >= 2, 'Live opportunities verified persisted in PostgreSQL');

    for (const opp of persistedOpps) {
      assert.ok(opp.title, 'Persisted record has title');
      assert.ok(opp.organization, 'Persisted record has organization');
      assert.ok(opp.sourceObservations.length >= 1, 'Persisted record has source observation with provenance');
      assert.equal(opp.sourceObservations[0].httpStatus, 200, 'Observation records HTTP 200 verification');
    }

    // Verify search can find these live opportunities
    const searchCheck = await OpportunityService.searchOpportunities({
      query: persistedOpps[0].organization,
    });
    assert.ok(searchCheck.total >= 1, 'Live opportunity retrievable via OpportunityService search');

    // Clean up test live records
    const oppIds = persistedOpps.map((o) => o.id);
    await prisma.sourceObservation.deleteMany({
      where: { opportunityId: { in: oppIds } },
    });
    await prisma.opportunity.deleteMany({
      where: { id: { in: oppIds } },
    });
    await prisma.ingestionRun.deleteMany({
      where: { sourceId: 'live_test_run' },
    });
  });

  await prisma.$disconnect();
});
