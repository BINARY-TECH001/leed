import { test } from 'node:test';
import assert from 'node:assert/strict';
import { prisma } from '../src/utils/prisma.js';
import { ProfileService } from '../src/services/profile.service.js';
import { ConnectionsService } from '../src/services/connections.service.js';
import { OnboardingService } from '../src/services/onboarding.service.js';
import { NotificationDispatcherService } from '../src/notifications/services/notificationDispatcher.service.js';
import { CostControlService } from '../src/notifications/services/costControl.service.js';
import { ConfigValidator } from '../src/utils/configValidator.js';
import { setTelegramProvider, setPushProvider, setEmailProvider } from '../src/notifications/providers/index.js';
import { TelegramBotProvider } from '../src/notifications/providers/TelegramBotProvider.js';
import { ExpoPushProvider } from '../src/notifications/providers/ExpoPushProvider.js';
import { ResendEmailProvider } from '../src/notifications/providers/ResendEmailProvider.js';

test('User Control Centre, Multi-Channel Notifications & Zero-Cost Launch Suite', async (t) => {
  const testUserEmail = `ctrl_test_${Date.now()}@leed.dev`;
  let testUserId: string;

  // Setup mock providers for testing
  const mockTelegram = new TelegramBotProvider();
  const mockPush = new ExpoPushProvider();
  const mockEmail = new ResendEmailProvider();
  setTelegramProvider(mockTelegram);
  setPushProvider(mockPush);
  setEmailProvider(mockEmail);

  await t.test('1. User Registration & Initial Profile Completeness Calculation', async () => {
    const user = await prisma.user.create({
      data: {
        email: testUserEmail,
        name: 'Alex Developer',
        profile: {
          create: {
            targetOutcome: 'Looking for verified opportunities',
            targetCategories: ['JOB', 'GRANT'],
            targetRoles: ['Software Engineer'],
            onboardingCompleted: false,
          },
        },
      },
      include: { profile: true },
    });

    testUserId = user.id;
    assert.ok(testUserId, 'User ID should be generated');

    const profileData = await ProfileService.getFullProfile(testUserId);
    assert.equal(profileData.personal.email, testUserEmail);
    assert.ok(profileData.completeness.score >= 20, 'Base completeness score should be at least 20%');
    assert.ok(profileData.completeness.missingRecommendations.length > 0, 'Should have missing recommendations');
  });

  await t.test('2. Updating Personal, Professional & Category-Specific Preferences', async () => {
    await ProfileService.updatePersonal(testUserId, {
      preferredDisplayName: 'Alex D.',
      country: 'Germany',
      city: 'Berlin',
      timezone: 'Europe/Berlin',
      preferredLanguage: 'en',
    });

    await ProfileService.updateProfessional(testUserId, {
      headline: 'Staff Platform & Systems Engineer',
      currentRole: 'Senior Engineer',
      careerGoals: 'Evolving decentralized opportunity discovery systems',
      salaryCurrency: 'EUR',
      minCompensation: '€95,000',
      targetFundingAmount: '€150,000',
      grantPreferences: { focusArea: 'Climate AI & Clean Energy' },
    });

    await ProfileService.updateOpportunityPreferences(testUserId, {
      targetCategories: ['JOB', 'GRANT'],
      minMatchScore: 75,
      excludedKeywords: ['crypto', 'gambling'],
      excludedOrganizations: ['Unverified Broker Ltd'],
    });

    const updatedProfile = await ProfileService.getFullProfile(testUserId);
    assert.equal(updatedProfile.personal.preferredDisplayName, 'Alex D.');
    assert.equal(updatedProfile.personal.country, 'Germany');
    assert.equal(updatedProfile.professional.headline, 'Staff Platform & Systems Engineer');
    assert.equal(updatedProfile.professional.salaryCurrency, 'EUR');
    assert.equal(updatedProfile.categorySpecific.targetFundingAmount, '€150,000');
    assert.equal(updatedProfile.opportunityPreferences.minMatchScore, 75);
    assert.ok(updatedProfile.opportunityPreferences.excludedKeywords.includes('crypto'));
  });

  await t.test('3. Dedicated Connections Status Aggregation', async () => {
    const connectionsStatus = await ConnectionsService.getConnectionsStatus(testUserId);
    assert.equal(connectionsStatus.totalAvailable, 4, 'Should track 4 core channels (Telegram, WhatsApp, Email, Push)');
    assert.ok(connectionsStatus.channels.some((c) => c.id === 'telegram'));
    assert.ok(connectionsStatus.channels.some((c) => c.id === 'whatsapp'));
    assert.ok(connectionsStatus.channels.some((c) => c.id === 'email'));
    assert.ok(connectionsStatus.channels.some((c) => c.id === 'push'));
  });

  await t.test('4. Telegram Single-Use Token Generation, Verification & Replay Prevention', async () => {
    // 1. Generate linking token
    const linkData = await ConnectionsService.generateTelegramLinkingToken(testUserId);
    assert.ok(linkData.linkingToken.startsWith('leed_link_'), 'Token should have proper prefix');
    assert.ok(linkData.botDeepLink.includes('start='), 'Deep link should include token');

    // 2. Validate valid callback
    const callbackResult = await ConnectionsService.handleTelegramStartCallback(
      linkData.linkingToken,
      '123456789',
      'alex_tg'
    );
    assert.equal(callbackResult.success, true);

    // 3. Replay attack attempt: Token should be expired/erased
    const replayResult = await ConnectionsService.handleTelegramStartCallback(
      linkData.linkingToken,
      '999999999',
      'attacker_tg'
    );
    assert.equal(replayResult.success, false, 'Replay with used token must fail');

    // 4. Verify account state in DB
    const account = await prisma.telegramAccount.findUnique({ where: { userId: testUserId } });
    assert.equal(account?.isVerified, true);
    assert.equal(account?.telegramChatId, '123456789');
    assert.equal(account?.telegramUsername, 'alex_tg');
    assert.equal(account?.status, 'active');
  });

  await t.test('5. Push Device Token Registration & Multi-Device Support', async () => {
    await ConnectionsService.registerPushToken(testUserId, 'ExponentPushToken[device-abc-123]', 'ios', 'iPhone 15 Pro');
    await ConnectionsService.registerPushToken(testUserId, 'ExponentPushToken[device-def-456]', 'android', 'Pixel 8');

    const devices = await prisma.pushDeviceToken.findMany({ where: { userId: testUserId, isActive: true } });
    assert.equal(devices.length, 2, 'Should register 2 active devices');

    // Unregister one device
    await ConnectionsService.unregisterPushToken('ExponentPushToken[device-abc-123]');
    const remaining = await prisma.pushDeviceToken.findMany({ where: { userId: testUserId, isActive: true } });
    assert.equal(remaining.length, 1);
  });

  await t.test('6. Unified NotificationDispatcher: Multi-Channel Event Routing', async () => {
    // Configure user notification preference to daytime quiet hours for test
    await prisma.notificationPreference.upsert({
      where: { userId: testUserId },
      create: {
        userId: testUserId,
        quietHoursStart: '03:00',
        quietHoursEnd: '04:00', // Non-quiet window for test execution
        duplicateSuppressionHours: 24,
      },
      update: {
        quietHoursStart: '03:00',
        quietHoursEnd: '04:00',
      },
    });

    const dispatchResult = await NotificationDispatcherService.dispatch({
      eventType: 'OPPORTUNITY_MATCHED',
      userId: testUserId,
      title: 'Senior Distributed Systems Architect',
      body: 'Verified remote opportunity matching your Scala, Go, and TypeScript skills.',
      priority: 'HIGH_PRIORITY_MATCH' as any,
      opportunityId: 'opp-multi-test',
      suggestedActions: [
        { id: 'APPLY', label: 'Apply' },
        { id: 'SAVE', label: 'Save' },
      ],
    });

    assert.ok(dispatchResult.inAppNotificationId, 'Must create In-App notification record');
    assert.ok(dispatchResult.channels.length >= 2, 'Should attempt multiple active channels');

    // Verify in-app notification exists in DB
    const inApp = await prisma.notification.findUnique({
      where: { id: dispatchResult.inAppNotificationId },
    });
    assert.equal(inApp?.title, 'Senior Distributed Systems Architect');
    assert.equal(inApp?.isRead, false);
  });

  await t.test('7. Zero-Cost Launch & Cost Control Guardrails', async () => {
    // Test that WhatsApp monthly budget cap is strictly respected
    CostControlService.setConfig({
      whatsAppMonthlyBudgetUsd: 0.0, // Zero-cost budget
      whatsAppEnabled: true,
      whatsAppEstimatedCostPerMessageUsd: 0.035,
    });

    const budgetStatus = await CostControlService.canDispatchWhatsApp();
    assert.equal(budgetStatus.allowed, false, 'Dispatch must be rejected when monthly budget is $0.00');
    assert.ok(budgetStatus.reason?.includes('budget exhausted'), 'Reason should report budget exhaustion');

    // Restore budget to normal test value
    CostControlService.setConfig({
      whatsAppMonthlyBudgetUsd: 10.0,
      whatsAppEnabled: true,
    });
    const permittedStatus = await CostControlService.canDispatchWhatsApp();
    assert.equal(permittedStatus.allowed, true);
  });

  await t.test('8. Progressive Onboarding State & Progression', async () => {
    const initialState = await OnboardingService.getOnboardingState(testUserId);
    assert.equal(initialState.totalSteps, 9);

    const step2State = await OnboardingService.updateStep(testUserId, 2, {
      categories: ['job', 'contract'],
      roleOrFocus: 'AI Systems Architect',
      locations: ['Remote', 'Berlin'],
    });

    assert.equal(step2State.currentStep, 3);
    assert.ok(step2State.selectedCategories.includes('job'));

    const completeState = await OnboardingService.completeOnboarding(testUserId);
    assert.equal(completeState.success, true);
  });

  await t.test('9. ConfigValidator Security Audit (Zero Secret Leakage)', () => {
    const report = ConfigValidator.validateAndReport();
    assert.ok(report.length >= 5, 'Should audit at least 5 core services');
    for (const item of report) {
      assert.ok(item.provider, 'Provider must have name');
      assert.ok(item.status, 'Provider must have status');
      // Ensure no raw secrets leaked in notes
      assert.equal(item.notes.includes('AIzaSy'), false, 'Never leak API keys');
      assert.equal(item.notes.includes('EAAB'), false, 'Never leak Meta tokens');
    }
  });

  // Cleanup test user
  await prisma.user.delete({ where: { id: testUserId } });
});
