import test from 'node:test';
import assert from 'node:assert/strict';
import { prisma } from '../src/utils/prisma.js';
import { OpenGrantsConnector } from '../src/connectors/OpenGrantsConnector.js';
import { SourceRegistry } from '../src/connectors/SourceRegistry.js';
import { IngestionService } from '../src/services/ingestion.service.js';
import { OpportunityService } from '../src/services/opportunity.service.js';
import { FreshnessService } from '../src/services/freshness.service.js';
import { AIService } from '../src/services/ai.service.js';
import '../src/connectors/index.js';

test('Milestone 8 — Advanced Discovery, Freshness & AI Hardening Test Suite', async (t) => {
  await prisma.$connect();
  await OpportunityService.ensureSeeded();

  const grantsConnector = new OpenGrantsConnector();

  await t.test('1. OpenGrantsConnector Registration & Multi-Category Discovery', async () => {
    assert.equal(grantsConnector.metadata.id, 'open_grants');
    assert.ok(grantsConnector.metadata.categories.includes('grant'));
    assert.ok(grantsConnector.metadata.categories.includes('scholarship'));

    const registry = SourceRegistry.getInstance();
    assert.ok(registry.get('open_grants'), 'OpenGrants must be registered in SourceRegistry');

    // Discover Grants
    const grantResult = await grantsConnector.discover({ category: 'grant', limit: 5 });
    assert.ok(grantResult.records.length >= 2, 'Must discover at least 2 grants');
    for (const r of grantResult.records) {
      assert.equal(r.type, 'grant');
      assert.ok(r.compensationAmount && r.compensationAmount >= 25000);
      assert.ok(r.originalUrl.startsWith('http'));
    }

    // Discover Scholarships & Fellowships
    const scholarshipResult = await grantsConnector.discover({ category: 'scholarship', limit: 5 });
    assert.ok(scholarshipResult.records.length >= 2, 'Must discover at least 2 scholarships/fellowships');
    for (const r of scholarshipResult.records) {
      assert.equal(r.type, 'scholarship');
      assert.ok(r.compensationAmount && r.compensationAmount >= 50000);
    }
  });

  await t.test('2. Ingestion of Grants & Scholarships into PostgreSQL', async () => {
    const discovery = await grantsConnector.discover({ limit: 6 });
    assert.ok(discovery.records.length >= 4);

    const ingest = await IngestionService.ingestBatch('open_grants', discovery.records);
    assert.ok(ingest.totalReceived >= 4);

    // Verify retrieval via OpportunityService
    const grantSearch = await OpportunityService.searchOpportunities({
      category: 'grant',
      limit: 5,
    });
    assert.ok(grantSearch.total >= 1, 'Must find ingested grants in database');
    const firstGrant = grantSearch.opportunities.find((o) => o.type === 'grant');
    assert.ok(firstGrant, 'Must retrieve a grant record');
    assert.ok(firstGrant.metadata?.sourceObservations?.length >= 1, 'Must have source observation provenance');

    const scholarshipSearch = await OpportunityService.searchOpportunities({
      category: 'scholarship',
      limit: 5,
    });
    assert.ok(scholarshipSearch.total >= 1, 'Must find ingested scholarships in database');
    const firstScholarship = scholarshipSearch.opportunities.find((o) => o.type === 'scholarship');
    assert.ok(firstScholarship, 'Must retrieve a scholarship record');
  });

  await t.test('3. Freshness Verification & Deadline Expiry Engine', async () => {
    // 3a. URL liveness check
    const liveness = await FreshnessService.checkUrlLiveness('https://example.com', 8000);
    assert.equal(typeof liveness.isReachable, 'boolean', 'Liveness should return boolean status');

    // 3b. Create an opportunity with a past deadline
    const expiredOpp = await prisma.opportunity.create({
      data: {
        originalUrl: 'https://archive.org/expired-grant-test',
        canonicalUrl: 'https://archive.org/expired-grant-test',
        contentFingerprint: 'hash-expired-test-record-1234',
        type: 'GRANT',
        title: 'Expired Legacy Research Grant 2024',
        organization: 'Historical Science Trust',
        location: 'London, UK',
        isRemote: true,
        compensation: '$50,000 Expired Grant',
        compensationAmount: 50000,
        deadline: new Date('2024-01-01T00:00:00Z'), // Past deadline
        source: 'Open Grants & Fellowship Index',
        sourceType: 'public_index',
        description: 'Grant with past deadline for freshness engine testing',
        summary: 'Historical grant past deadline',
        requirements: [],
        matchScore: 85,
        matchExplanation: 'Test record',
        matchPros: [],
        matchCons: [],
        isVerified: true,
      },
    });

    const verifyResult = await FreshnessService.verifyOpportunity(expiredOpp.id);
    assert.equal(verifyResult.isFresh, false);
    assert.equal(verifyResult.verificationStatus, 'expired');
    assert.ok(verifyResult.reason?.includes('deadline'));

    // 3c. Run batch sweep
    const sweep = await FreshnessService.sweepStaleOpportunities(10);
    assert.ok(typeof sweep.scannedCount === 'number');
    assert.ok(sweep.scannedCount >= 0);

    // Clean up test opportunity
    await prisma.opportunity.delete({ where: { id: expiredOpp.id } });
  });

  await t.test('4. AI Service: Candidate Profile Matching & Calibration', async () => {
    const opp = await OpportunityService.getById('opp-1');
    assert.ok(opp, 'Base opportunity must exist');

    const match = AIService.calculateMatch({
      candidateSkills: ['React Native', 'Expo', 'TypeScript', 'Offline Sync'],
      targetOpportunity: opp,
    });

    assert.ok(match.matchScore >= 40 && match.matchScore <= 100);
    assert.ok(match.matchedSkills.length >= 1, 'Must match at least one relevant skill');
    assert.ok(match.alignmentSummary.length > 10, 'Must generate descriptive alignment summary');
    assert.ok(match.recommendations.length >= 1, 'Must provide strategic recommendations');
  });

  await t.test('5. AI Service: Multi-Tone Proposal Drafts & Fallback Resilience', async () => {
    const opp = await OpportunityService.getById('opp-1');
    assert.ok(opp);

    const tones = ['Executive', 'Direct', 'Technical', 'Warm'] as const;

    for (const tone of tones) {
      const pitch = AIService.generatePitch({
        opportunity: opp,
        tone,
        channel: 'email',
        cvSkills: ['React Native', 'TypeScript'],
        userName: 'Elena Rostova',
      });

      assert.ok(pitch.subject.length > 5, `Must generate subject for ${tone}`);
      assert.ok(pitch.body.includes('Elena Rostova'), `Must sign off with username for ${tone}`);
      assert.ok(pitch.body.includes(opp.title) || pitch.body.includes(opp.organization));
    }

    // Async proposal generation
    const asyncPitch = await AIService.generatePitchAsync({
      opportunity: opp,
      tone: 'Technical',
      channel: 'linkedin',
      cvSkills: ['Distributed Systems', 'CRDTs', 'SQLite'],
      userName: 'Alex Rivers',
    });

    assert.ok(asyncPitch.subject.length > 5);
    assert.ok(asyncPitch.body.length > 20);
    assert.ok(asyncPitch.generatedBy === 'template' || asyncPitch.generatedBy === 'gemini');
  });
});
