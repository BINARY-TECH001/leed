/**
 * Startup Configuration & Integration Validator
 *
 * Inspects all configured provider channels and security environment variables,
 * reporting operational readiness without leaking secret or credential values.
 */
export interface IntegrationStatus {
  provider: string;
  category: string;
  status: 'READY' | 'MOCK / DRY-RUN' | 'DISABLED';
  costTier: string;
  notes: string;
}

export class ConfigValidator {
  static validateAndReport(): IntegrationStatus[] {
    const isProduction = process.env.NODE_ENV === 'production';
    const report: IntegrationStatus[] = [];

    // 1. Database
    const hasDb = Boolean(process.env.DATABASE_URL);
    report.push({
      provider: 'PostgreSQL Database',
      category: 'Data Storage',
      status: hasDb ? 'READY' : 'DISABLED',
      costTier: 'Open-Source / Free',
      notes: hasDb ? 'Database URL configured' : 'Missing DATABASE_URL',
    });

    // 2. Telegram Bot
    const hasTgToken = Boolean(process.env.TELEGRAM_BOT_TOKEN);
    const tgDryRun = process.env.TELEGRAM_DRY_RUN === 'true';
    report.push({
      provider: 'Telegram Bot API',
      category: 'Messaging',
      status: hasTgToken && !tgDryRun ? 'READY' : 'MOCK / DRY-RUN',
      costTier: '100% Free Developer Tier',
      notes: hasTgToken ? 'Bot token configured' : 'Using mock in-memory provider (zero-cost safe)',
    });

    // 3. Email (Resend)
    const hasResend = Boolean(process.env.RESEND_API_KEY);
    const emailDryRun = process.env.EMAIL_DRY_RUN === 'true';
    report.push({
      provider: 'Resend Transactional Email',
      category: 'Email',
      status: hasResend && !emailDryRun ? 'READY' : 'MOCK / DRY-RUN',
      costTier: 'Free Tier (3,000/mo)',
      notes: hasResend ? 'API key configured' : 'Using mock in-memory provider',
    });

    // 4. Push (Expo)
    const pushDryRun = process.env.PUSH_DRY_RUN === 'true' || process.env.NODE_ENV === 'test';
    report.push({
      provider: 'Expo Mobile & Web Push',
      category: 'Push Alerts',
      status: pushDryRun ? 'MOCK / DRY-RUN' : 'READY',
      costTier: '100% Free Infrastructure',
      notes: 'Push API ready for registered mobile & web tokens',
    });

    // 5. WhatsApp (Meta Cloud API)
    const waEnabled = process.env.WHATSAPP_ENABLED === 'true';
    const hasWaToken = Boolean(process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID);
    const waDryRun = process.env.WHATSAPP_DRY_RUN === 'true';
    const waBudget = parseFloat(process.env.WHATSAPP_MONTHLY_BUDGET_USD || '0.00');

    let waStatus: 'READY' | 'MOCK / DRY-RUN' | 'DISABLED' = 'DISABLED';
    if (waEnabled && hasWaToken && !waDryRun) {
      waStatus = 'READY';
    } else if (waEnabled && waDryRun) {
      waStatus = 'MOCK / DRY-RUN';
    }

    report.push({
      provider: 'Meta WhatsApp Cloud API',
      category: 'Messaging',
      status: waStatus,
      costTier: `Budget Guardrailed ($${waBudget.toFixed(2)}/mo cap)`,
      notes: waEnabled
        ? `WhatsApp enabled (Monthly budget cap: $${waBudget.toFixed(2)})`
        : 'WhatsApp disabled by default (Zero-cost launch mode)',
    });

    // 6. AI Inference (Google Gemini)
    const hasGemini = Boolean(process.env.GEMINI_API_KEY);
    report.push({
      provider: 'Google Gemini AI',
      category: 'Intelligence',
      status: hasGemini ? 'READY' : 'MOCK / DRY-RUN',
      costTier: 'Free Tier (15 RPM / 1,500 RPD)',
      notes: hasGemini ? 'Gemini 2.0 API configured' : 'Deterministic fallback mode active',
    });

    // Print summary to console
    console.log('\n======================================================');
    console.log('       LEED LAUNCH & INTEGRATION READINESS AUDIT      ');
    console.log('======================================================');
    for (const item of report) {
      const icon = item.status === 'READY' ? '✅' : item.status === 'MOCK / DRY-RUN' ? '🧪' : '⏸️';
      console.log(`${icon} [${item.category}] ${item.provider}`);
      console.log(`   Status: ${item.status} | Tier: ${item.costTier}`);
      console.log(`   Notes:  ${item.notes}`);
    }
    console.log('======================================================\n');

    // Production security check
    if (isProduction && !process.env.JWT_SECRET) {
      throw new Error('FATAL: JWT_SECRET environment variable is missing in production');
    }

    return report;
  }
}
