import type {
  WhatsAppInboundMessage,
  ParsedWhatsAppIntent,
  WhatsAppIntentType,
} from '../types/index.js';

export class WhatsAppIntentService {
  /**
   * Parses an inbound message or button reply into a typed, validated intent.
   */
  static parseIntent(
    msg: WhatsAppInboundMessage,
    activeOpportunityId?: string
  ): ParsedWhatsAppIntent {
    const text = (msg.text || '').trim();
    const buttonId = msg.buttonId;

    // 1. Interactive Button Reply Fast-Path
    if (buttonId) {
      if (buttonId.startsWith('APPLY_')) {
        const oppId = buttonId.replace('APPLY_', '');
        return {
          intent: 'PREPARE_APPLICATION',
          confidence: 1.0,
          opportunityId: oppId,
          rawText: text,
          requiresConfirmation: false,
        };
      }

      if (buttonId.startsWith('SAVE_')) {
        const oppId = buttonId.replace('SAVE_', '');
        return {
          intent: 'SAVE_OPPORTUNITY',
          confidence: 1.0,
          opportunityId: oppId,
          rawText: text,
          requiresConfirmation: false,
        };
      }

      if (buttonId.startsWith('DETAILS_')) {
        const oppId = buttonId.replace('DETAILS_', '');
        return {
          intent: 'OPPORTUNITY_DETAILS',
          confidence: 1.0,
          opportunityId: oppId,
          rawText: text,
          requiresConfirmation: false,
        };
      }

      if (buttonId.startsWith('EXPLAIN_')) {
        const oppId = buttonId.replace('EXPLAIN_', '');
        return {
          intent: 'EXPLAIN_MATCH',
          confidence: 1.0,
          opportunityId: oppId,
          rawText: text,
          requiresConfirmation: false,
        };
      }
    }

    const lower = text.toLowerCase();

    // 2. Help Commands
    if (lower === 'help' || lower === 'commands' || lower === 'menu' || lower === 'start' || lower === 'hi' || lower === 'hello') {
      return {
        intent: 'HELP',
        confidence: 0.99,
        rawText: text,
        requiresConfirmation: false,
      };
    }

    // 3. Pause & Resume Alerts
    if (lower.includes('pause') || lower.includes('stop alerts') || lower.includes('quiet') || lower.includes('mute')) {
      return {
        intent: 'PAUSE_NOTIFICATIONS',
        confidence: 0.95,
        rawText: text,
        requiresConfirmation: false,
      };
    }

    if (lower.includes('resume') || lower.includes('unpause') || lower.includes('restart alerts')) {
      return {
        intent: 'RESUME_NOTIFICATIONS',
        confidence: 0.95,
        rawText: text,
        requiresConfirmation: false,
      };
    }

    // 4. Saved List
    if (lower.includes('saved') || lower.includes('my bookmarks') || lower.includes('list saved')) {
      return {
        intent: 'LIST_SAVED',
        confidence: 0.95,
        rawText: text,
        requiresConfirmation: false,
      };
    }

    // 5. Application Status
    if (lower.includes('status') || lower.includes('what happened') || lower.includes('pending applications')) {
      return {
        intent: 'CHECK_APPLICATION_STATUS',
        confidence: 0.9,
        opportunityId: activeOpportunityId,
        rawText: text,
        requiresConfirmation: false,
      };
    }

    // 6. Direct Application / Prepare Pitch
    if (
      lower === 'apply' ||
      lower.startsWith('apply for') ||
      lower.startsWith('apply using') ||
      lower.includes('submit application') ||
      lower.includes('prepare application') ||
      lower.includes('pitch')
    ) {
      return {
        intent: 'PREPARE_APPLICATION',
        confidence: 0.92,
        opportunityId: activeOpportunityId,
        rawText: text,
        requiresConfirmation: false,
      };
    }

    // 7. Save Opportunity
    if (lower === 'save' || lower === 'bookmark' || lower.startsWith('save this') || lower.includes('bookmark this')) {
      return {
        intent: 'SAVE_OPPORTUNITY',
        confidence: 0.92,
        opportunityId: activeOpportunityId,
        rawText: text,
        requiresConfirmation: false,
      };
    }

    // 8. Why it Matches / Explanation
    if (lower.includes('why') || lower.includes('match') || lower.includes('fit') || lower.includes('explanation')) {
      return {
        intent: 'EXPLAIN_MATCH',
        confidence: 0.9,
        opportunityId: activeOpportunityId,
        rawText: text,
        requiresConfirmation: false,
      };
    }

    // 9. Details / View
    if (lower.includes('detail') || lower.includes('more info') || lower.includes('tell me more') || lower === 'view') {
      return {
        intent: 'OPPORTUNITY_DETAILS',
        confidence: 0.9,
        opportunityId: activeOpportunityId,
        rawText: text,
        requiresConfirmation: false,
      };
    }

    // 10. Preference Updates
    if (lower.includes('only remote') || lower.includes('remote only') || lower.includes('salary') || lower.includes('filter')) {
      return {
        intent: 'UPDATE_PREFERENCES',
        confidence: 0.85,
        rawText: text,
        requiresConfirmation: false,
      };
    }

    // 11. Fallback Unknown Intent
    return {
      intent: 'UNKNOWN',
      confidence: 0.3,
      opportunityId: activeOpportunityId,
      rawText: text,
      requiresConfirmation: false,
    };
  }
}
