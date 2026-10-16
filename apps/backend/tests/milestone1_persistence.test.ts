import test from 'node:test';
import assert from 'node:assert/strict';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../src/utils/prisma.js';
import { OpportunityService } from '../src/services/opportunity.service.js';
import { PipelineService } from '../src/services/pipeline.service.js';
import { RadarService } from '../src/services/radar.service.js';

const JWT_SECRET = process.env.JWT_SECRET || 'prospectai_jwt_super_secret_key_2026_dev';

test('Milestone 1 — Persistence, Security & Domain Isolation Test Suite', async (t) => {
  // Unique test run identifiers
  const testRunId = Date.now();
  const userAEmail = `test.user.a.${testRunId}@leed.dev`;
  const userBEmail = `test.user.b.${testRunId}@leed.dev`;
  const rawPassword = 'SecurePassword123!';

  let userAId = '';
  let userBId = '';

  await t.test('1. Database Connection & Prerequisite Check', async () => {
    await prisma.$connect();
    const count = await prisma.user.count();
    assert.ok(count >= 0, 'Database is connected and users table is accessible');
  });

  await t.test('2. User Registration & Password Hashing Persistence', async () => {
    const hashedPassword = await bcrypt.hash(rawPassword, 10);

    const userA = await prisma.user.create({
      data: {
        email: userAEmail,
        name: 'Test Engineer Alpha',
        passwordHash: hashedPassword,
        role: 'USER',
        profile: {
          create: {
            targetOutcome: 'High-comp contract work',
            targetCategories: ['CONTRACT', 'JOB'],
            targetRoles: ['Mobile Architect'],
            targetIndustries: ['Fintech'],
            targetLocations: ['Remote'],
            onboardingCompleted: true,
          },
        },
      },
      include: { profile: true },
    });

    userAId = userA.id;
    assert.ok(userA.id, 'User A persisted with UUID');
    assert.equal(userA.email, userAEmail);
    assert.notEqual(userA.passwordHash, rawPassword, 'Password must be hashed');
    assert.ok(userA.profile, 'User profile persisted');

    // Verify bcrypt password verification
    const isMatch = await bcrypt.compare(rawPassword, userA.passwordHash!);
    assert.equal(isMatch, true, 'Bcrypt verify matches original password');

    const isWrongMatch = await bcrypt.compare('WrongPassword456!', userA.passwordHash!);
    assert.equal(isWrongMatch, false, 'Bcrypt rejects incorrect password');

    // Create User B for cross-user isolation verification
    const userB = await prisma.user.create({
      data: {
        email: userBEmail,
        name: 'Test Engineer Beta',
        passwordHash: hashedPassword,
        role: 'USER',
      },
    });
    userBId = userB.id;
    assert.ok(userB.id, 'User B persisted');
  });

  await t.test('3. Duplicate Email Constraint Enforcement', async () => {
    let duplicateRejected = false;
    try {
      await prisma.user.create({
        data: {
          email: userAEmail,
          name: 'Impostor',
          passwordHash: 'hash',
        },
      });
    } catch {
      duplicateRejected = true;
    }
    assert.equal(duplicateRejected, true, 'Database unique constraint prevents duplicate emails');
  });

  await t.test('4. Canonical Opportunities Persistence & Hydration', async () => {
    await OpportunityService.ensureSeeded();

    const result = await OpportunityService.searchOpportunities({});
    assert.ok(result.total >= 6, 'Canonical opportunities seeded and retrievable');

    const firstOpp = result.opportunities[0];
    assert.ok(firstOpp.id, 'Opportunity has valid ID');
    assert.ok(firstOpp.title, 'Opportunity has valid title');
    assert.ok(firstOpp.originalUrl.startsWith('http'), 'Opportunity preserves original URL');

    // Verify source observation provenance
    const oppDetails = await OpportunityService.getById(firstOpp.id);
    assert.ok(oppDetails, 'Fetched single opportunity by ID');
    assert.ok(
      Array.isArray(oppDetails.metadata?.sourceObservations),
      'Opportunity has sourceObservations array'
    );
    assert.ok(
      oppDetails.metadata.sourceObservations.length >= 1,
      'Opportunity has at least one verified source observation'
    );
  });

  await t.test('5. Multi-User Pipeline Isolation (Decoupled User State)', async () => {
    const oppList = await OpportunityService.searchOpportunities({});
    const canonicalOpp = oppList.opportunities[0];

    // User A saves the canonical opportunity
    const userARecord = await PipelineService.updateStage(
      userAId,
      canonicalOpp.id,
      'saved',
      'User A private evaluation notes'
    );
    assert.equal(userARecord.opportunityId, canonicalOpp.id);
    assert.equal(userARecord.stage, 'saved');

    // User B applies to the exact same canonical opportunity
    const userBRecord = await PipelineService.updateStage(
      userBId,
      canonicalOpp.id,
      'applied',
      'User B custom proposal'
    );
    assert.equal(userBRecord.opportunityId, canonicalOpp.id);
    assert.equal(userBRecord.stage, 'applied');

    // Verify isolation: User A sees their own stage (saved), User B sees their stage (applied)
    const pipelineA = await PipelineService.getPipeline(userAId);
    const pipelineB = await PipelineService.getPipeline(userBId);

    const oppAState = pipelineA.records.find((r) => r.opportunityId === canonicalOpp.id);
    const oppBState = pipelineB.records.find((r) => r.opportunityId === canonicalOpp.id);

    assert.ok(oppAState, 'User A has pipeline record');
    assert.ok(oppBState, 'User B has pipeline record');
    assert.equal(oppAState.stage, 'saved', 'User A stage is isolated as saved');
    assert.equal(oppBState.stage, 'applied', 'User B stage is isolated as applied');
    assert.equal(oppAState.notes, 'User A private evaluation notes');
    assert.equal(oppBState.notes, 'User B custom proposal');
  });

  await t.test('6. User Radar Scans & Real Persistence', async () => {
    const userRadars = await RadarService.getRadars(userAId);
    assert.ok(userRadars.length >= 1, 'Default user radars hydrated in PostgreSQL');

    const firstRadar = userRadars[0];
    const scanResult = await RadarService.triggerScan(userAId, firstRadar.id);

    assert.ok(scanResult.radar, 'Scan returns updated radar');
    assert.ok(scanResult.totalCount >= 0, 'Total found count is based on actual records');
    assert.ok(scanResult.newDiscoveriesCount >= 0, 'Discoveries count recorded');

    // Verify AgentRun audit record in database
    const agentRuns = await prisma.agentRun.findMany({
      where: { radarId: firstRadar.id },
    });
    assert.ok(agentRuns.length >= 1, 'AgentRun audit history persisted in PostgreSQL');
  });

  await t.test('7. Cleanup of Test Fixtures', async () => {
    await prisma.user.deleteMany({
      where: {
        id: { in: [userAId, userBId] },
      },
    });
    const checkDeleted = await prisma.user.findUnique({ where: { id: userAId } });
    assert.equal(checkDeleted, null, 'Test users cleaned up safely');
    await prisma.$disconnect();
  });
});
