# LEED — Notification Channel Setup & Operator Runbook
## Zero-Cost Launch Strategy & Multi-Channel Provider Guide

**Document Version:** 2.1.0  
**Verification Date:** October 15, 2026  
**Audience:** Platform Engineers, DevOps, System Administrators  
**Launch Philosophy:** Free for all users at launch. Zero paywalls, zero subscriptions, zero credit fees. Built upon free APIs, open-source infrastructure, and developer free tiers.

---

### 1. Executive Summary & Zero-Cost Architecture

Leed operates on a **zero-cost launch strategy**:
- **Telegram Bot API:** 100% free for developers. Provides interactive buttons, Markdown formatting, instant push alerts, and conversational workflows with zero per-message cost.
- **Transactional Email (Resend):** Free tier provides 3,000 emails/month (up to 100 emails/day), sufficient for user onboarding, account verification, and transaction updates.
- **Mobile & Web Push (Expo & Web Push):** 100% free infrastructure for sending real-time background and lock-screen alerts to iOS, Android, and desktop browsers.
- **Meta WhatsApp Cloud API:** Kept in **Dry-Run / Disabled mode by default** (`WHATSAPP_ENABLED=false` or `WHATSAPP_DRY_RUN=true`). Configured with a strict operator monthly budget cap (`WHATSAPP_MONTHLY_BUDGET_USD="0.00"`). When the budget is reached or unconfigured, outbound dispatch is skipped safely (`skipped_budget`) and automatically falls back to 100% free channels (Telegram, Email, Push, In-App Notification Centre).

---

### 2. Provider Breakdown & Verification Matrix

| Channel | Provider | Pricing / Quota (as of Oct 2026) | Verification Status | Official Documentation |
| :--- | :--- | :--- | :--- | :--- |
| **Telegram** | Telegram Bot API | **100% Free** (No message fees) | Verified Active | [Telegram Bot Documentation](https://core.telegram.org/bots/api) |
| **Email** | Resend | **Free Tier:** 3,000 emails/month | Verified Active | [Resend Pricing & Documentation](https://resend.com/docs) |
| **Push Alerts** | Expo Push Service / W3C Push | **100% Free** | Verified Active | [Expo Push Notifications](https://docs.expo.dev/push-notifications/overview/) |
| **WhatsApp** | Meta WhatsApp Business Platform | Per-conversation charges apply. Default: $0.00 cap / Dry-run | Verified Guardrailed | [Meta WhatsApp Cloud API](https://developers.facebook.com/docs/whatsapp/cloud-api) |
| **AI Inference** | Google Gemini API (`gemini-2.0-flash`) | **Free Tier:** 15 RPM / 1,500 RPD | Verified Active | [Google AI Studio Pricing](https://ai.google.dev/pricing) |

---

### 3. Channel 1: Telegram Bot API (Primary Interactive Free Channel)

Telegram is our recommended interactive chat channel because it supports full conversational buttons, real-time message editing, and webhook callbacks without incurring per-message fees.

#### A. Setup & Registration
1. In the Telegram application, start a chat with [@BotFather](https://t.me/BotFather).
2. Send `/newbot` and follow instructions to choose a display name (e.g., `Leed Opportunity Agent`) and username (e.g., `LeedOpportunityBot`).
3. BotFather will provide an HTTP API access token (e.g., `1234567890:ABC-DEF1234ghIkl-zyx57W2v1u123ew11`).
4. Set the webhook URL on Telegram:
   ```bash
   curl -F "url=https://your-domain.com/api/v1/connections/telegram/webhook" https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/setWebhook
   ```

#### B. Cryptographic Account Linking Flow
1. User clicks **Connect Telegram** in Leed mobile or web settings.
2. Leed generates a single-use token `leed_link_<uuid>` with a 15-minute TTL.
3. User is directed to `https://t.me/LeedOpportunityBot?start=leed_link_<uuid>`.
4. User taps **Start** in Telegram. Telegram sends `/start leed_link_<uuid>` to Leed's webhook.
5. Leed validates the token, marks the account verified, and destroys the token to prevent replay attacks.

#### C. Environment Variables
```env
TELEGRAM_ENABLED=true
TELEGRAM_BOT_TOKEN="your_telegram_bot_token"
TELEGRAM_BOT_USERNAME="LeedOpportunityBot"
TELEGRAM_DRY_RUN=false
```

---

### 4. Channel 2: Email (Resend Free Tier)

#### A. Setup & Registration
1. Sign up at [https://resend.com](https://resend.com).
2. Go to **API Keys** and click **Create API Key** with `Sending access`.
3. Add and verify your custom sending domain (e.g. `leed.app`) using DNS TXT and MX records. (For testing, Resend provides `onboarding@resend.dev` to your registered email).

#### B. Quotas & Limits
- Free Tier: 3,000 emails/month (100 emails/day).
- If limit is reached, Leed gracefully logs delivery failure and falls back to In-App and Push.

#### C. Environment Variables
```env
EMAIL_ENABLED=true
RESEND_API_KEY="re_123456789_abcdefg"
EMAIL_FROM="Leed Opportunity Alerts <notifications@leed.app>"
EMAIL_DRY_RUN=false
```

---

### 5. Channel 3: Mobile & Web Push Notifications

#### A. Architecture
- **Mobile (React Native Expo):** Uses Expo Push Notifications client. The app requests device permissions via `Notifications.getPermissionsAsync()` and registers token with `POST /api/v1/connections/push/register`.
- **Web Push:** Standard W3C Service Worker Web Push API.

#### B. Cost & Quotas
- 100% Free. No per-message delivery charge from Expo or Apple/Google.

#### C. Environment Variables
```env
PUSH_ENABLED=true
PUSH_DRY_RUN=false
```

---

### 6. Channel 4: Meta WhatsApp Cloud API (Guardrailed Paid Channel)

WhatsApp messages are conversation-priced by Meta. Leed provides strict cost controls to guarantee users are never charged and operators never face surprise billing.

#### A. Cost Guardrail Controls
- `WHATSAPP_ENABLED`: Set to `false` for zero-cost launch. Set to `true` only when operator has verified payment and budget.
- `WHATSAPP_MONTHLY_BUDGET_USD`: Strict monthly cap (e.g., `10.00`). If current month spend reaches this cap, outbound dispatch is skipped (`skipped_budget`) and Leed automatically falls back to Telegram, Email, and Push.
- `WHATSAPP_DRY_RUN`: When `true`, records messages in memory without making outbound HTTP requests to Meta.

#### B. Environment Variables
```env
WHATSAPP_ENABLED=false
WHATSAPP_DRY_RUN=true
WHATSAPP_MONTHLY_BUDGET_USD=0.00
WHATSAPP_ESTIMATED_COST_PER_MSG_USD=0.035
WHATSAPP_PHONE_NUMBER_ID=""
WHATSAPP_ACCESS_TOKEN=""
WHATSAPP_BUSINESS_ACCOUNT_ID=""
WHATSAPP_VERIFY_TOKEN=""
META_APP_SECRET=""
```

---

### 7. Startup Configuration Validation

Leed runs `ConfigValidator.validateAndReport()` automatically on server launch. It displays an audit table:
```
======================================================
       LEED LAUNCH & INTEGRATION READINESS AUDIT      
======================================================
✅ [Data Storage] PostgreSQL Database
   Status: READY | Tier: Open-Source / Free
   Notes:  Database URL configured
✅ [Messaging] Telegram Bot API
   Status: READY | Tier: 100% Free Developer Tier
   Notes:  Bot token configured
✅ [Email] Resend Transactional Email
   Status: READY | Tier: Free Tier (3,000/mo)
   Notes:  API key configured
✅ [Push Alerts] Expo Mobile & Web Push
   Status: READY | Tier: 100% Free Infrastructure
   Notes:  Push API ready for registered mobile & web tokens
⏸️ [Messaging] Meta WhatsApp Cloud API
   Status: DISABLED | Tier: Budget Guardrailed ($0.00/mo cap)
   Notes:  WhatsApp disabled by default (Zero-cost launch mode)
✅ [Intelligence] Google Gemini AI
   Status: READY | Tier: Free Tier (15 RPM / 1,500 RPD)
   Notes:  Gemini 2.0 API configured
======================================================
```
*Note: Tokens and secret values are never printed in logs or exposed in APIs.*

---

### 8. Testing Outbound Deliveries

To trigger an instant test notification through the REST API:
```bash
curl -X POST https://your-domain.com/api/v1/connections/test \
  -H "Authorization: Bearer <JWT_ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"channel": "telegram"}'
```
Valid channels: `telegram`, `whatsapp`, `email`, `push`, `in_app`.
