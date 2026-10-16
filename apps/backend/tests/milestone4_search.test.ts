import test from 'node:test';
import assert from 'node:assert/strict';
import { QueryPlannerService } from '../src/services/queryPlanner.service.js';
import { OpportunityService } from '../src/services/opportunity.service.js';
import { prisma } from '../src/utils/prisma.js';

test('Milestone 4 — Real Search & Query Planning Test Suite', async (t) => {
  await prisma.$connect();
  await OpportunityService.ensureSeeded();

  await t.test('1. Deterministic Query Planning (Without AI Dependency)', () => {
    // 1a. Contract query with hourly rate and tech stack
    const plan1 = QueryPlannerService.planDeterministic('Find remote React Native contracts paying at least $120/hr');
    assert.equal(plan1.category, 'contract', 'Should detect contract category');
    assert.equal(plan1.isRemote, true, 'Should detect remote intent');
    assert.equal(plan1.minCompensation, 120, 'Should extract $120/hr floor');
    assert.equal(plan1.compensationType, 'hourly', 'Should identify hourly comp type');
    assert.ok(plan1.skills.includes('react native'), 'Should extract react native skill');
    assert.equal(plan1.interpretedBy, 'deterministic_heuristic');
    assert.ok(plan1.intentBadges.some((b) => b.includes('CONTRACT')));
    assert.ok(plan1.intentBadges.some((b) => b.includes('Remote Work Verified')));
    assert.ok(plan1.intentBadges.some((b) => b.includes('$120/hr')));

    // 1b. Full-time job with annual salary and organization
    const plan2 = QueryPlannerService.planDeterministic('Senior staff AI engineer full-time job at Vercel paying $180k');
    assert.equal(plan2.category, 'job', 'Should detect job category');
    assert.equal(plan2.minCompensation, 180000, 'Should parse 180k as 180,000');
    assert.equal(plan2.compensationType, 'annual');
    assert.ok(plan2.organizations?.includes('vercel'), 'Should extract Vercel organization');
    assert.ok(plan2.skills.includes('ai'), 'Should extract AI skill');

    // 1c. Non-dilutive grant query with fixed funding
    const plan3 = QueryPlannerService.planDeterministic('Grants for open source cryptography with $50,000 funding');
    assert.equal(plan3.category, 'grant', 'Should detect grant category');
    assert.equal(plan3.minCompensation, 50000, 'Should extract $50,000 grant funding');
    assert.equal(plan3.compensationType, 'fixed');

    // 1d. Location extraction
    const plan4 = QueryPlannerService.planDeterministic('Frontend jobs in San Francisco paying $150k');
    assert.equal(plan4.location, 'San Francisco', 'Should extract San Francisco location');
  });

  await t.test('2. Query Planner Robustness & Graceful Fallback with AI Toggled', async () => {
    // 2a. With AI disabled explicitly, should execute deterministic parser
    const planOffline = await QueryPlannerService.plan(
      'Remote SQLite offline sync freelance project paying 25k',
      { enableAI: false }
    );
    assert.equal(planOffline.category, 'freelance');
    assert.equal(planOffline.isRemote, true);
    assert.equal(planOffline.interpretedBy, 'deterministic_heuristic');
    assert.ok(planOffline.skills.includes('sqlite'));

    // 2b. With AI enabled but without valid GEMINI_API_KEY, should gracefully fall back
    const originalKey = process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_API_KEY;

    const planFallback = await QueryPlannerService.plan(
      'Principal Mobile Architect contracts',
      { enableAI: true }
    );
    assert.equal(planFallback.category, 'contract');
    assert.equal(planFallback.interpretedBy, 'deterministic_heuristic');
    assert.ok(planFallback.confidence > 0.9);

    if (originalKey) {
      process.env.GEMINI_API_KEY = originalKey;
    }
  });

  await t.test('3. Database Deterministic Search Filtering', async () => {
    // 3a. Search by category
    const contracts = await OpportunityService.searchOpportunities({ category: 'contract' });
    assert.ok(contracts.total >= 1, 'Should find at least 1 contract');
    for (const opp of contracts.opportunities) {
      assert.equal(opp.type, 'contract', 'All results must match queried category');
    }

    // 3b. Search by remote only
    const remoteOnly = await OpportunityService.searchOpportunities({ remoteOnly: true });
    assert.ok(remoteOnly.total >= 1, 'Should return remote opportunities');
    for (const opp of remoteOnly.opportunities) {
      assert.equal(opp.isRemote, true, 'All returned records must be remote');
    }

    // 3c. Search by compensation rate floor
    const highComp = await OpportunityService.searchOpportunities({ minCompRate: 100000 });
    assert.ok(highComp.total >= 1, 'Should find opportunities paying >= $100k');
    for (const opp of highComp.opportunities) {
      assert.ok(
        (opp.compensationAmount || 0) >= 100000,
        `Compensation amount ${opp.compensationAmount} must be >= 100000`
      );
    }

    // 3d. Token-based keywords search across fields
    const reactNativeOpps = await OpportunityService.searchOpportunities({
      keywords: ['react native'],
    });
    assert.ok(reactNativeOpps.total >= 1, 'Should find opportunities matching React Native');
    for (const opp of reactNativeOpps.opportunities) {
      const match =
        opp.title.toLowerCase().includes('react native') ||
        opp.description.toLowerCase().includes('react native') ||
        opp.tags.some((t) => t.toLowerCase().includes('react native'));
      assert.ok(match, 'Result must contain React Native in title, description, or tags');
    }
  });

  await t.test('4. Deterministic Ranking, Pagination & Provenance Attachment', async () => {
    // 4a. Pagination test
    const page1 = await OpportunityService.searchOpportunities({ page: 1, limit: 2 });
    assert.equal(page1.opportunities.length, 2, 'Page 1 should contain exactly 2 items');
    assert.equal(page1.page, 1);
    assert.equal(page1.limit, 2);
    assert.ok(page1.total > 2, 'Total items should exceed page size');

    const page2 = await OpportunityService.searchOpportunities({ page: 2, limit: 2 });
    assert.equal(page2.opportunities.length, 2, 'Page 2 should contain 2 items');
    assert.notEqual(
      page1.opportunities[0].id,
      page2.opportunities[0].id,
      'Page 1 and Page 2 must return different items'
    );

    // 4b. Sorting by compensation descending
    const compSorted = await OpportunityService.searchOpportunities({ sort: 'comp', limit: 10 });
    for (let i = 0; i < compSorted.opportunities.length - 1; i++) {
      const current = compSorted.opportunities[i].compensationAmount || 0;
      const next = compSorted.opportunities[i + 1].compensationAmount || 0;
      assert.ok(current >= next, `Compensation descending: ${current} >= ${next}`);
    }

    // 4c. Provenance attachment check
    const oppWithProvenance = page1.opportunities[0];
    assert.ok(oppWithProvenance.metadata?.sourceObservations, 'Must contain sourceObservations in metadata');
    assert.ok(Array.isArray(oppWithProvenance.metadata.sourceObservations));
    assert.ok(oppWithProvenance.metadata.sourceObservations.length >= 1, 'Must have at least one provenance record');
    const obs = oppWithProvenance.metadata.sourceObservations[0];
    assert.ok(obs.sourceName, 'Provenance must have sourceName');
    assert.ok(obs.originalUrl, 'Provenance must have originalUrl');
  });
});
