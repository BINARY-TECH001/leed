import test from 'node:test';
import assert from 'node:assert/strict';
import { prisma } from '../src/utils/prisma.js';
import { OpportunityService } from '../src/services/opportunity.service.js';
import {
  MockWhatsAppProvider,
  MetaWhatsAppCloudProvider,
  setWhatsAppProvider,
} from '../src/whatsapp/providers/index.js';
import { WhatsAppAccountService } from '../src/whatsapp/services/whatsappAccount.service.js';
import { WhatsAppWebhookService } from '../src/whatsapp/services/whatsappWebhook.service.js';
import { WhatsAppIntentService } from '../src/whatsapp/services/whatsappIntent.service.js';
import { WhatsAppConversationService } from '../src/whatsapp/services/whatsappConversation.service.js';
import { WhatsAppNotificationService } from '../src/whatsapp/services/whatsappNotification.service.js';
import '../src/connectors/index.js';

test('WhatsApp-First Personal Opportunity Agent Test Suite', async (t) => {
  await prisma.$connect();
  await OpportunityService.ensureSeeded();

  const mockProvider = new MockWhatsAppProvider();
  setWhatsAppProvider(mockProvider);

  // Setup test user
  const testEmail = `whatsapp_test_${Date.now()}@example.com`;
  const user = await prisma.user.create({
    data: {
      email: testEmail,
      name: 'WhatsApp Pilot User',
      profile: {
        create: {
          targetOutcome: 'Find Remote Staff Architect Opportunities',
          targetRoles: ['Staff Mobile Engineer', 'Distributed Systems Architect'],
          skills: {
            create: [
              { name: 'React Native', category: 'technical' },
              { name: 'TypeScript', category: 'technical' },
              { name: 'Expo', category: 'technical' },
              { name: 'CRDTs', category: 'technical' },
            ],
          },
        },
      },
    },
  });

  const testPhone = '+14155552671';

  await t.test('1. WhatsApp Provider Abstraction & Contract', async () => {
    mockProvider.clearHistory();

    const sendRes = await mockProvider.sendText(testPhone, 'Hello from Leed Agent');
    assert.equal(sendRes.success, true);
    assert.ok(sendRes.waMessageId?.startsWith('wamid.mock_'));
    assert.equal(sendRes.recipient, testPhone);

    const buttonRes = await mockProvider.sendInteractiveButtons(
      testPhone,
      'Choose an action for this opportunity',
      [
        { id: 'APPLY_1', title: 'Apply' },
        { id: 'SAVE_1', title: 'Save' },
      ],
      { headerText: 'New Discovery' }
    );
    assert.equal(buttonRes.success, true);

    const history = mockProvider.getSentMessages();
    assert.equal(history.length, 2);
    assert.equal(history[1].type, 'interactive_button');
    assert.equal(history[1].buttons?.length, 2);

    // Verify Meta Cloud Provider Phone Cleaning
    const metaProvider = new MetaWhatsAppCloudProvider();
    assert.equal((metaProvider as any).cleanRecipientNumber('+1 (415) 555-2671'), '14155552671');
  });

  await t.test('2. Two-Step Account Linking, Verification & Explicit Consent', async () => {
    mockProvider.clearHistory();

    // Step 2a: Request Link (Dispatches 6-digit code)
    const linkRes = await WhatsAppAccountService.linkPhoneNumber(user.id, testPhone);
    assert.equal(linkRes.success, true);
    assert.equal(linkRes.phoneNumber, testPhone);
    assert.ok(linkRes.verificationCode, 'Verification code should be generated in test mode');

    const lastMsg = mockProvider.getLastMessage();
    assert.ok(lastMsg?.text?.includes(linkRes.verificationCode!));

    // Step 2b: Rejection of invalid verification code
    const invalidRes = await WhatsAppAccountService.verifyCode(user.id, '000000');
    assert.equal(invalidRes.success, false);
    assert.equal(invalidRes.isVerified, false);

    // Step 2c: Verification of genuine code
    const verifyRes = await WhatsAppAccountService.verifyCode(user.id, linkRes.verificationCode!);
    assert.equal(verifyRes.success, true);
    assert.equal(verifyRes.isVerified, true);

    // Step 2d: Verify database state & explicit consent
    const status = await WhatsAppAccountService.getStatus(user.id);
    assert.equal(status.isConnected, true);
    assert.equal(status.isVerified, true);
    assert.equal(status.consentGiven, true);
    assert.ok(status.consentGivenAt);

    // Step 2e: Welcome greeting sent
    const welcomeMsg = mockProvider.getLastMessage();
    assert.ok(welcomeMsg?.text?.includes('Welcome to Leed'));
  });

  await t.test('3. Meta Webhook Security & Inbound Deduplication', async () => {
    // 3a. Hub Challenge Verification (GET /webhook)
    const validChallenge = WhatsAppWebhookService.verifyChallenge(
      'subscribe',
      'leed_webhook_verify_token_prod_2026',
      'challenge_code_987654'
    );
    assert.equal(validChallenge.isValid, true);
    assert.equal(validChallenge.challenge, 'challenge_code_987654');

    const invalidChallenge = WhatsAppWebhookService.verifyChallenge('subscribe', 'wrong_token', 'challenge_123');
    assert.equal(invalidChallenge.isValid, false);

    // 3b. Signature Verification (HMAC-SHA256)
    const payload = JSON.stringify({ event: 'test' });
    const secret = 'test_meta_secret_key';
    const crypto = await import('node:crypto');
    const signature = `sha256=${crypto.createHmac('sha256', secret).update(payload).digest('hex')}`;

    assert.equal(WhatsAppWebhookService.verifySignature(payload, signature, secret), true);
    assert.equal(WhatsAppWebhookService.verifySignature(payload, 'sha256=invalid', secret), false);

    // 3c. Payload Parsing
    const samplePayload = {
      entry: [
        {
          changes: [
            {
              value: {
                messages: [
                  {
                    from: '14155552671',
                    id: 'wamid.HBgLM...test_unique_1',
                    timestamp: '1729000000',
                    type: 'text',
                    text: { body: 'Show details' },
                  },
                ],
                statuses: [
                  {
                    id: 'wamid.outbound_99',
                    status: 'delivered',
                    recipient_id: '14155552671',
                    timestamp: '1729000005',
                  },
                ],
              },
            },
          ],
        },
      ],
    };

    const parsed = WhatsAppWebhookService.parsePayload(samplePayload);
    assert.equal(parsed.messages.length, 1);
    assert.equal(parsed.messages[0].text, 'Show details');
    assert.equal(parsed.statuses.length, 1);
    assert.equal(parsed.statuses[0].status, 'delivered');
  });

  await t.test('4. Notification Dispatch with Quiet Hours & Rate Limiting', async () => {
    mockProvider.clearHistory();

    // 4a. Quiet hours evaluation logic
    assert.equal(WhatsAppNotificationService.isQuietHours('22:00', '08:00', new Date('2026-10-15T23:30:00Z')), true);
    assert.equal(WhatsAppNotificationService.isQuietHours('22:00', '08:00', new Date('2026-10-15T14:00:00Z')), false);

    // Set quiet hours away from current test execution time so test dispatch succeeds
    await WhatsAppAccountService.updatePreferences(user.id, {
      quietHoursStart: '11:00',
      quietHoursEnd: '12:00',
      maxDailyNotifications: 3,
    });

    // 4b. Successful dispatch of a genuine opportunity match
    const dispatch = await WhatsAppNotificationService.notifyOpportunityMatch(user.id, 'opp-1');
    assert.equal(dispatch.dispatched, true);
    assert.ok(dispatch.waMessageId);

    const sentNotification = mockProvider.getLastMessage();
    assert.equal(sentNotification?.type, 'interactive_button');
    assert.ok(sentNotification?.text?.includes('Match Found!'));
    assert.ok(sentNotification?.buttons?.some((b) => b.id === 'APPLY_opp-1'));

    // 4c. Duplicate suppression: Attempting to notify same opportunity again must be suppressed
    const duplicateDispatch = await WhatsAppNotificationService.notifyOpportunityMatch(user.id, 'opp-1');
    assert.equal(duplicateDispatch.dispatched, false);
    assert.equal(duplicateDispatch.reason, 'duplicate_suppressed');
  });

  await t.test('5. Conversational Action Engine (Details, Save, Apply, Explain)', async () => {
    mockProvider.clearHistory();

    // 5a. Inbound "Details" Button Click
    const detailsOutcome = await WhatsAppConversationService.handleIncomingMessage({
      from: testPhone,
      waId: testPhone.replace(/\D/g, ''),
      waMessageId: `wamid.test_inbound_${Date.now()}_1`,
      timestamp: Date.now().toString(),
      type: 'button_reply',
      buttonId: 'DETAILS_opp-1',
      text: 'View details',
      rawPayload: {},
    });

    assert.ok(detailsOutcome);
    assert.equal(detailsOutcome.actionType, 'OPPORTUNITY_DETAILS');
    assert.equal(detailsOutcome.success, true);
    const detailsMsg = mockProvider.getLastMessage();
    assert.ok(detailsMsg?.text?.includes('Principal Mobile Architect'));

    // 5b. Inbound "Why does this match?" Natural Language Query
    const explainOutcome = await WhatsAppConversationService.handleIncomingMessage({
      from: testPhone,
      waId: testPhone.replace(/\D/g, ''),
      waMessageId: `wamid.test_inbound_${Date.now()}_2`,
      timestamp: Date.now().toString(),
      type: 'text',
      text: 'Why does this match my profile?',
      rawPayload: {},
    });

    assert.ok(explainOutcome);
    assert.equal(explainOutcome.actionType, 'EXPLAIN_MATCH');
    assert.equal(explainOutcome.success, true);
    assert.ok(explainOutcome.replyMessage.includes('Match Calibration'));

    // 5c. Inbound "Save" Command
    const saveOutcome = await WhatsAppConversationService.handleIncomingMessage({
      from: testPhone,
      waId: testPhone.replace(/\D/g, ''),
      waMessageId: `wamid.test_inbound_${Date.now()}_3`,
      timestamp: Date.now().toString(),
      type: 'text',
      text: 'Save',
      rawPayload: {},
    });

    assert.ok(saveOutcome);
    assert.equal(saveOutcome.actionType, 'SAVE_OPPORTUNITY');
    assert.equal(saveOutcome.success, true);

    // Verify stage in PostgreSQL database
    const savedOpp = await prisma.userOpportunity.findFirst({
      where: { userId: user.id, opportunityId: 'opp-1' },
    });
    assert.ok(savedOpp);
    assert.equal(savedOpp.stage, 'SAVED');

    // 5d. Inbound "Apply" Command (Level 1: Prepare tailored pitch & advance pipeline)
    const applyOutcome = await WhatsAppConversationService.handleIncomingMessage({
      from: testPhone,
      waId: testPhone.replace(/\D/g, ''),
      waMessageId: `wamid.test_inbound_${Date.now()}_4`,
      timestamp: Date.now().toString(),
      type: 'button_reply',
      buttonId: 'APPLY_opp-1',
      text: 'Apply',
      rawPayload: {},
    });

    assert.ok(applyOutcome);
    assert.equal(applyOutcome.actionType, 'PREPARE_APPLICATION');
    assert.equal(applyOutcome.success, true);
    assert.ok(applyOutcome.replyMessage.includes('Application Prepared'));
    assert.ok(applyOutcome.replyMessage.includes('Direct Official Submission Link'));

    // Verify database state updated to APPLIED
    const appliedOpp = await prisma.userOpportunity.findFirst({
      where: { userId: user.id, opportunityId: 'opp-1' },
    });
    assert.equal(appliedOpp?.stage, 'APPLIED');

    // Verify ActionExecutionRecord created with full evidence
    const actionRecord = await prisma.actionExecutionRecord.findFirst({
      where: { userId: user.id, opportunityId: 'opp-1', actionType: 'PREPARE_APPLICATION' },
    });
    assert.ok(actionRecord);
    assert.equal(actionRecord.level, 'prepare');
    assert.equal(actionRecord.status, 'completed');
    assert.ok((actionRecord.evidence as any)?.subject);

    // 5e. Inbound "Show saved"
    const listOutcome = await WhatsAppConversationService.handleIncomingMessage({
      from: testPhone,
      waId: testPhone.replace(/\D/g, ''),
      waMessageId: `wamid.test_inbound_${Date.now()}_5`,
      timestamp: Date.now().toString(),
      type: 'text',
      text: 'Show saved',
      rawPayload: {},
    });
    assert.ok(listOutcome);
    assert.equal(listOutcome.actionType, 'LIST_SAVED');

    // 5f. Inbound "Pause alerts"
    const pauseOutcome = await WhatsAppConversationService.handleIncomingMessage({
      from: testPhone,
      waId: testPhone.replace(/\D/g, ''),
      waMessageId: `wamid.test_inbound_${Date.now()}_6`,
      timestamp: Date.now().toString(),
      type: 'text',
      text: 'Pause alerts',
      rawPayload: {},
    });
    assert.ok(pauseOutcome);
    assert.equal(pauseOutcome.actionType, 'PAUSE_NOTIFICATIONS');

    const pausedStatus = await WhatsAppAccountService.getStatus(user.id);
    assert.equal(pausedStatus.status, 'paused');
  });

  // Cleanup test user
  await prisma.user.delete({ where: { id: user.id } });
});
