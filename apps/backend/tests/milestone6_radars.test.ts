import test from 'node:test';
import assert from 'node:assert/strict';
import { prisma } from '../src/utils/prisma.js';
import { RadarService, calculateNextRun } from '../src/services/radar.service.js';
import { RadarWorkerService } from '../src/services/radarWorker.service.js';
import { OpportunityService } from '../src/services/opportunity.service.js';
import '../src/connectors/index.js';
import bcrypt from 'bcryptjs';

test('Milestone 6 — Scheduled Radars & Background Workers Test Suite', async (t) => {
  await prisma.$connect();
  await OpportunityService.ensureSeeded();

  // Setup test user
  const testEmail = `radar.test.${Date.now()}@prospectai.dev`;
  const passwordHash = await bcrypt.hash('RadarPass123!', 10);
  const user = await prisma.user.create({
    data: {
      email: testEmail,
      name: 'Radar Worker Tester',
      passwordHash,
      role: 'USER',
    },
  });

  t.after(async () => {
    RadarWorkerService.stop();
    await prisma.user.delete({ where: { id: user.id } }).catch(() => {});
  });

  await t.test('1. calculateNextRun Scheduling Cadence Logic', () => {
    // 1a. Daily (+24h)
    const baseDate = new Date('2026-10-14T08:00:00Z');
    const nextDaily = calculateNextRun('daily', baseDate);
    assert.equal(nextDaily.toISOString(), '2026-10-15T08:00:00.000Z');

    // 1b. Weekly (+7 days)
    const nextWeekly = calculateNextRun('weekly', baseDate);
    assert.equal(nextWeekly.toISOString(), '2026-10-21T08:00:00.000Z');

    // 1c. Weekdays: Friday -> Monday
    const friday = new Date('2026-10-16T08:00:00Z'); // 2026-10-16 is Friday
    const nextAfterFriday = calculateNextRun('weekdays', friday);
    assert.equal(nextAfterFriday.toISOString(), '2026-10-19T08:00:00.000Z');
  });

  let createdRadarId: string;

  await t.test('2. Radar Creation with Structured Target Criteria', async () => {
    const radar = await RadarService.createRadar(user.id, {
      title: 'Remote React Native Architecture Contracts',
      prompt: 'Remote React Native contracts paying at least $100/hr',
      category: 'contract',
      frequency: 'daily',
      autonomyLevel: 'approve',
    });

    assert.ok(radar.id, 'Radar must receive a generated UUID');
    assert.equal(radar.title, 'Remote React Native Architecture Contracts');
    assert.equal(radar.category, 'contract');
    assert.equal(radar.status, 'active');
    assert.equal(radar.totalFound, 0);

    createdRadarId = radar.id;
  });

  await t.test('3. Real Radar Scan Execution, AgentRun Logging & In-App Notification', async () => {
    const scanResult = await RadarService.triggerScan(user.id, createdRadarId);

    assert.ok(scanResult.radar, 'Scan must return updated radar');
    assert.ok(scanResult.totalCount >= 1, 'Scan must discover matching contracts');
    assert.ok(scanResult.qualifiedCount >= 1, 'Must find qualifying contracts matching criteria');
    assert.ok(scanResult.agentRunId, 'Scan must generate an AgentRun record');

    // Verify AgentRun log in PostgreSQL
    const agentRun = await prisma.agentRun.findUnique({
      where: { id: scanResult.agentRunId },
    });
    assert.ok(agentRun, 'AgentRun must be persisted in database');
    assert.equal(agentRun.radarId, createdRadarId);
    assert.ok(agentRun.sourcesScannedCount >= 1, 'Sources scanned must be >= 1');
    assert.ok(agentRun.qualifiedCount >= 1, 'Qualified count must be >= 1');
    assert.ok(agentRun.summary.includes('qualifying'), 'Summary must contain evaluation details');

    // Verify in-app Notification persisted in PostgreSQL
    const notifications = await prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });
    assert.ok(notifications.length >= 1, 'User must receive an in-app notification for discovery');
    assert.ok(notifications[0].title.includes('Radar Discovery'));
    assert.equal(notifications[0].type, 'radar_discovery');
  });

  await t.test('4. Background RadarWorker Due Processing', async () => {
    // Set nextRunAt in the past so the worker picks it up
    await prisma.opportunityRadar.update({
      where: { id: createdRadarId },
      data: {
        nextRunAt: new Date(Date.now() - 10000), // 10s ago
      },
    });

    const result = await RadarWorkerService.processDueRadars();
    assert.ok(result.processedCount >= 1, 'Worker must process the due radar');
    assert.equal(result.errors.length, 0, 'Worker must complete without errors');

    // Verify nextRunAt has been advanced into the future
    const updatedRadar = await prisma.opportunityRadar.findUnique({
      where: { id: createdRadarId },
    });
    assert.ok(updatedRadar, 'Radar must exist');
    assert.ok(
      updatedRadar.nextRunAt.getTime() > Date.now(),
      'nextRunAt must be advanced into the future after worker execution'
    );
  });
});
