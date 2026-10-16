# LEED — WhatsApp-First Personal Opportunity Agent
## Architecture, Strategy & Implementation Plan

**Document Version:** 2.0.0  
**Date:** October 15, 2026  
**Status:** Complete (Verified in Production Test Harness)  
**Lead Architect:** Antigravity Autonomous Systems Engineering Team  
**Scope:** Evolving Leed into a reliable, source-first, AI-powered personal opportunity agent on WhatsApp synchronized seamlessly with Mobile (React Native / Expo SDK 57) and Web (TanStack Start / Nitro SSR).

---

## 1. Product Vision & Strategic Opportunity

Leed empowers ambitious professionals, researchers, students, and businesses to discover and act on high-value opportunities without constantly opening an application. Rather than building a passive job board or a standalone chatbot with fake search results, Leed is an **autonomous personal opportunity agent**:

1. **Continuous Discovery:** Scans real, authorized external sources (ATS systems, job boards, municipal business registries, open research grants, university fellowships).
2. **First-Class WhatsApp Interaction:** Pushes verified, highly relevant matches directly to users on WhatsApp with structured options (Apply, Save, Details, Why it matches).
3. **Conversational Action Engine:** Understands natural-language replies ("Apply using my latest CV", "Show details", "Find similar roles in Berlin paying at least €60k", "Pause alerts until Monday"), maintains conversation state, asks clarifications when needed, and executes authorized actions through backend services.
4. **Truthful Automation Framework:** Distinguishes between **Level 1 (Prepare)**, **Level 2 (Assist)**, and **Level 3 (Submit)**. Never fabricates submissions, clicks, or qualifications.
5. **Continuous Cross-Platform Synchronization:** Every action taken in WhatsApp updates the PostgreSQL database in real time, synchronizing immediately with the React Native mobile app and TanStack web dashboard.

---

## 2. Competitor Analysis & Differentiation (Reference: myjobb.ai)

[https://myjobb.ai/](https://myjobb.ai/) focuses on WhatsApp job alerts ("Jobs find you on WhatsApp") primarily for standard corporate employment.

### Key Differentiators for Leed:
| Dimension | Competitor Reference (myjobb.ai) | Leed Opportunity Agent |
| :--- | :--- | :--- |
| **Opportunity Categories** | Standard corporate jobs | **Multi-Category Discovery:** Jobs, Freelance/Contracts, Grants/Accelerators, Fellowships/Scholarships, B2B Commercial Prospects |
| **Provenance & Source Verifiability** | Aggregated listings without granular audit trails | **Source-First Verifiable Provenance:** Every record tracks original URL, content fingerprint, source observations, and verification status |
| **Ecosystem Integration** | WhatsApp-isolated chatbot | **Unified Monorepo Architecture:** Real-time bi-directional synchronization between WhatsApp, Mobile App, and Web SSR Dashboard |
| **Automation Integrity** | Generic "auto-apply" claims | **Truthful 3-Tier Action Engine:** Clear distinction between material preparation, interactive assistance, and verified submission |
| **Deterministic Intent Safety** | Black-box LLM prompt routing | **Typed Intent Model & Deterministic Validation:** AI proposes structured actions; deterministic backend enforces safety rules |

---

## 3. Verified Starting State (Milestones 1–8 Baseline)

The foundation built in Milestones 1–8 provides complete database persistence and verified external source connectivity:
- **Monorepo:** Turbo + npm workspaces (`apps/backend`, `apps/mobile`, `apps/web`, `packages/types`, `packages/utils`).
- **PostgreSQL Database:** Active Prisma schema with `Opportunity`, `SourceObservation`, `IngestionRun`, `OpportunityRadar`, `AgentRun`, `User`, `UserOpportunity`.
- **Live Connectors:**
  - `GreenhouseConnector`: Public ATS job postings.
  - `ArbeitnowConnector`: European and global tech jobs.
  - `OpenStreetMapConnector`: Overpass QL geographic business directory.
  - `GooglePlacesConnector`: Keyless-safe places integration.
  - `OpenGrantsConnector`: Verified non-dilutive research awards and fellowships.
- **Engine Services:**
  - `IngestionService`: SHA-256 fingerprinting, URL canonicalization, idempotent deduplication.
  - `QueryPlannerService`: Deterministic heuristic NLP parsing categories, locations, compensation, skills.
  - `FreshnessService`: URL liveness probes (HEAD/GET) and automated deadline expiry sweeps.
  - `RadarWorkerService`: Interval background scanner with Socket.IO notifications.
  - `AIService`: Skill matching and multi-tone outreach drafting.
- **Test Baseline:** 40/40 tests passing across 7 milestone test suites.

---

## 4. WhatsApp Architecture & Meta Cloud API Integration

WhatsApp is implemented as a first-class product channel using the official **Meta WhatsApp Business Platform Cloud API**:

```
+-----------------------------------------------------------------------------------+
|                            WhatsApp Channel Architecture                          |
+-----------------------------------------------------------------------------------+
                                        |
                 +----------------------+----------------------+
                 |                                             |
                 v                                             v
     [Meta Cloud API Webhook]                       [Outbound Dispatcher]
  (Incoming Text / Quick Replies)                  (Template & Interactive)
                 |                                             |
                 v                                             v
     [HMAC-SHA256 Verification]                     [WhatsAppProvider Adapter]
  (x-hub-signature-256 vs Secret)                 (MetaCloud / MockDryRun)
                 |                                             |
                 v                                             v
     [Idempotency & WAMID Dedup]                    [Delivery Status Tracker]
                 |                                (sent, delivered, read, failed)
                 v                                             |
     [User & Phone Resolution]                                 |
  (Verified WhatsAppAccount Link)                              |
                 |                                             |
                 v                                             |
     [Conversation Context Engine]                             |
  (activeOpportunityId & History)                              |
                 |                                             |
                 v                                             |
     [Typed Intent Parsing Service]                            |
  (Deterministic Validation + AI)                              |
                 |                                             |
                 v                                             |
     [Action Execution Router] --------------------------------+
(Prepare, Assist, Save, Preferences)
                 |
                 v
     [PostgreSQL + WebSocket Sync]
(Mobile App & Web Dashboard Synchronized)
```

### 4.1 Provider Abstraction Layer (`IWhatsAppProvider`)
Decouples opportunity discovery and conversation routing from specific messaging transports:
- `IWhatsAppProvider`: Interface defining `sendTextMessage`, `sendInteractiveButtons`, `sendInteractiveList`, `sendTemplateMessage`.
- `MetaWhatsAppCloudProvider`: Production provider calling official Meta Graph API v21.0 endpoints (`https://graph.facebook.com/v21.0/{PHONE_NUMBER_ID}/messages`).
- `MockWhatsAppProvider`: Deterministic in-memory provider for unit/integration testing and local offline development.

### 4.2 Webhook Security & Idempotency
- **Challenge Verification:** `GET /api/v1/whatsapp/webhook` verifies `hub.mode === 'subscribe'` and `hub.verify_token === process.env.WHATSAPP_VERIFY_TOKEN`, returning `hub.challenge`.
- **Signature Verification:** `POST /api/v1/whatsapp/webhook` verifies `x-hub-signature-256` HMAC-SHA256 digest using `META_APP_SECRET`.
- **Prompt Acknowledgment:** Handler immediately responds with HTTP 200 and processes messages asynchronously to satisfy Meta's 3-second timeout requirement.
- **Deduplication:** Tracks incoming Meta WAMIDs in PostgreSQL (`WhatsAppMessage.waMessageId`) to guarantee idempotent processing.

### 4.3 Number Verification & Account Association
- Users cannot claim ownership of an arbitrary WhatsApp number merely by texting the bot.
- Two-way secure association:
  1. User enters phone number in mobile or web app (`POST /api/v1/whatsapp/link`).
  2. Server generates a cryptographically random 6-digit verification code or secure deep-link token expiring in 15 minutes.
  3. User confirms via WhatsApp code entry (`POST /api/v1/whatsapp/verify`) or texts code to the official bot.
  4. Explicit opt-in consent is timestamped in `WhatsAppAccount.consentGivenAt`.

---

## 5. Conversational Action Engine & Typed Intent Routing

### 5.1 Supported Intent Types
```typescript
export type WhatsAppIntent =
  | 'OPPORTUNITY_DETAILS'       // "Show details", "Tell me more"
  | 'EXPLAIN_MATCH'             // "Why does this match my profile?"
  | 'SAVE_OPPORTUNITY'          // "Save", "Bookmark this"
  | 'PREPARE_APPLICATION'       // "Apply", "Prepare my application", "Pitch"
  | 'SUBMIT_APPLICATION'        // "Confirm submit", "Send it now"
  | 'CHECK_APPLICATION_STATUS'  // "What happened to my application?"
  | 'LIST_SAVED'                // "Show saved opportunities"
  | 'UPDATE_PREFERENCES'        // "Only send remote jobs", "Min salary $4000"
  | 'PAUSE_NOTIFICATIONS'       // "Pause alerts until Monday", "Stop alerts"
  | 'RESUME_NOTIFICATIONS'      // "Resume alerts"
  | 'HELP'                      // "Help", "What can you do?"
  | 'UNKNOWN';                  // Fallback for unclassified messages
```

### 5.2 Contextual Resolution
- When a match notification is sent to a user, the outbound message establishes the **`activeOpportunityId`** in `WhatsAppConversation`.
- Follow-up replies ("Apply", "Save", "Why does it match?") automatically resolve against the current active opportunity without forcing the user to repeat the ID or title.
- If ambiguous, the agent asks for clarification listing recent matches.

### 5.3 Truthful 3-Tier Action Engine
1. **Tier 1 — Prepare:**
   - Prepares tailored CV variant highlights and custom outreach drafts via `AIService.generatePitchAsync`.
   - Returns verified original application link and requirements checklist.
2. **Tier 2 — Assist:**
   - Validates user profile completeness against opportunity requirements.
   - Prompts for missing fields (e.g., expected compensation, years of experience) before advancing.
3. **Tier 3 — Submit:**
   - Only reports successful external submission when a verified direct integration exists.
   - For standard public portals, hands off the prepared packet to the user with direct tracking.
   - Never simulates or fakes application submissions.

---

## 6. Database Models (Prisma Schema Additions)

The Prisma schema is extended with models dedicated to WhatsApp messaging, conversation context, and action audits:

1. **`WhatsAppAccount`:**
   - `userId`: Relation to `User`.
   - `phoneNumber`: Unique E.164 phone string.
   - `isVerified`: Boolean.
   - `verificationCode`: 6-digit verification token.
   - `verificationExpiresAt`: Expiration timestamp.
   - `consentGiven`: Explicit opt-in flag.
   - `consentGivenAt`: Audit timestamp.
   - `status`: `'active' | 'paused' | 'disconnected'`.
   - `quietHoursStart` / `quietHoursEnd`: e.g., `"22:00"` to `"08:00"`.
   - `maxDailyNotifications`: Daily message ceiling (default: 5).
   - `notificationsSentToday`: Rate-limit counter.
2. **`WhatsAppConversation`:**
   - `userId`: Relation to `User`.
   - `waId`: Meta WhatsApp user identifier.
   - `activeOpportunityId`: Foreign key to currently active `Opportunity`.
   - `lastInteractionAt`: Timestamp.
   - `pendingAction`: Structured JSON storing multi-step clarification state.
3. **`WhatsAppMessage`:**
   - `conversationId`: Relation to `WhatsAppConversation`.
   - `direction`: `'inbound' | 'outbound'`.
   - `waMessageId`: Meta WAMID for deduplication.
   - `messageType`: `'text' | 'interactive' | 'template'`.
   - `content`: Message text.
   - `rawPayload`: Bounded JSON payload.
   - `deliveryStatus`: `'sent' | 'delivered' | 'read' | 'failed'`.
4. **`ActionExecutionRecord`:**
   - Stores action type, authorization state, execution evidence, and outcome report.

---

## 7. Implementation Phases & Milestones

### Phase 1 — Data Models & Provider Abstraction [Completed]
- [x] Extend Prisma schema with `WhatsAppAccount`, `WhatsAppConversation`, `WhatsAppMessage`, and `ActionExecutionRecord`.
- [x] Run Prisma migration / db push to update PostgreSQL.
- [x] Implement `IWhatsAppProvider` interface and `MockWhatsAppProvider` with message recording.
- [x] Implement `MetaWhatsAppCloudProvider` with Graph API v21.0 payload builders.
- [x] Create automated tests for provider contracts and payload formatting.

### Phase 2 — Account Linking, Verification & Consent [Completed]
- [x] Implement `WhatsAppAccountService` handling number registration, verification code generation, verification validation, and consent logging.
- [x] Implement REST endpoints:
  - `POST /api/v1/whatsapp/link`: Register phone number.
  - `POST /api/v1/whatsapp/verify`: Validate code and activate account.
  - `GET /api/v1/whatsapp/status`: Check connection and settings.
  - `PATCH /api/v1/whatsapp/preferences`: Configure quiet hours and frequency caps.
  - `POST /api/v1/whatsapp/disconnect`: Disconnect and revoke consent.
- [x] Add automated test suite for verification flows, code expiration, and consent auditability.

### Phase 3 — Webhook Ingestion, Security & Deduplication [Completed]
- [x] Implement `GET /api/v1/whatsapp/webhook` for Meta hub verification challenge.
- [x] Implement `POST /api/v1/whatsapp/webhook` with HMAC-SHA256 signature verification.
- [x] Implement inbound message deduplication using Meta WAMIDs.
- [x] Implement delivery status webhook handling (`sent`, `delivered`, `read`, `failed`).
- [x] Add automated tests for webhook challenge, signature validation, and replay prevention.

### Phase 4 — Conversational Intent & Action Execution [Completed]
- [x] Implement `WhatsAppIntentService` combining regex fast-paths, NLP heuristics, and structured intent mapping.
- [x] Implement `WhatsAppConversationService` maintaining persistent state and `activeOpportunityId`.
- [x] Implement `WhatsAppActionRouter` executing backend services:
  - View details (`OpportunityService.getById`).
  - Explain match (`AIService.calculateMatch`).
  - Save opportunity (`PipelineService.saveOpportunity`).
  - Prepare application (`AIService.generatePitchAsync` + `PipelineService.updateStage`).
  - Pause / Resume notifications (`WhatsAppAccountService.setStatus`).
- [x] Add automated tests for conversational commands, interactive button callbacks, and clarification prompts.

### Phase 5 — Matching & Notification Dispatch Engine [Completed]
- [x] Implement `WhatsAppNotificationService` dispatching newly discovered opportunities to opted-in users.
- [x] Enforce notification constraints:
  - Quiet hours evaluation.
  - Daily frequency caps (`maxDailyNotifications`).
  - Duplicate match suppression (never alert on the same opportunity twice).
- [x] Format rich WhatsApp match messages with interactive buttons (Apply, Save, Details).
- [x] Integrate notification dispatch into `RadarWorkerService` so live discoveries trigger WhatsApp notifications.
- [x] Add automated tests for notification dispatch, quiet hours filtering, and rate limits.

### Phase 6 — Mobile & Web Surface Synchronization [Completed]
- [x] Mobile app: Add WhatsApp connection card / settings screen in `apps/mobile/app/(tabs)/profile.tsx`.
- [x] Mobile app: Display verified WhatsApp status, consent badge, quiet hours controls, and pause/disconnect buttons.
- [x] Web dashboard: Display WhatsApp connection preview, notification channel controls, and action boundaries.
- [x] Ensure actions performed via WhatsApp immediately reflect in Mobile and Web views.

### Phase 7 — End-to-End Verification & Runbook [Completed]
- [x] End-to-end integration test demonstrating the complete loop:
  `Opportunity Discovered` -> `Matched to User` -> `WhatsApp Notification Sent` -> `User Replies "Apply"` -> `Application Prepared` -> `Database & Mobile App Synchronized`.
- [x] Operational runbook documenting Meta Cloud API onboarding, environment variables, webhook configuration, and test modes.

### Phase 8 — User Control Centre, Multi-Channel Notifications & Zero-Cost Launch Strategy [Completed]
- [x] Database Schema Expansion:
  - Extended `User` and `Profile` models (personal info, headline, career goals, study level, funding preferences, privacy & AI personalization toggles).
  - Added `TelegramAccount`, `EmailNotificationPreference`, `PushDeviceToken`, `NotificationPreference`, `ChannelDeliveryRecord`.
  - Pushed to PostgreSQL via `npx prisma db push` and generated Prisma Client.
- [x] Multi-Channel Provider Architecture:
  - `TelegramBotProvider`: 100% free developer tier, cryptographically secure 1-time linking tokens (`leed_link_<uuid>`), webhook callbacks, Markdown formatting, and inline action buttons.
  - `ResendEmailProvider`: Free tier (3,000 emails/month) with HTML templates and verification.
  - `ExpoPushProvider`: 100% free mobile and web push notifications with device token management.
  - `CostControlService`: Enforces zero paywalls for users, checks WhatsApp monthly budget cap (`$0.00` default), and automatically falls back to free channels upon budget exhaustion.
  - `NotificationDispatcherService`: Unified domain event dispatcher supporting quiet hours, duplicate suppression, and in-app Notification Centre logging.
- [x] Dedicated Connections Hub & Profile Services:
  - `ProfileService`: Profile completeness calculation (0–100%) with actionable recommendations, personal, professional, category-specific, and privacy update endpoints.
  - `ConnectionsService`: Unified status reporting for Telegram, WhatsApp, Email, and Push with test alert triggers.
  - `OnboardingService`: Progressive 9-step skippable workflow with initial real discovery scan.
- [x] Web & Mobile Client Integration:
  - Mobile: Added Telegram, Email, and Push connection cards in `apps/mobile/app/(tabs)/profile.tsx` with test alert buttons and 100% Free Launch Edition badge.
  - Web: Updated `settings.tsx` to display real multi-channel connections and zero-cost launch commitments.
- [x] Operator Runbook & Verification:
  - Created `docs/NOTIFICATION_CHANNEL_SETUP.md` with official signup links, verification dates, quotas, and testing steps.
  - Created `.env.example` with zero-cost launch defaults.
  - Added `ConfigValidator.validateAndReport()` startup check without secret leakage.
  - Added `apps/backend/tests/user_control_and_multichannel.test.ts` (10/10 tests passed).
  - Full suite verified: 56/56 tests passing across 9 test suites.

---

## 8. Environment Variables & Configuration

```env
# 1. Server & Security
NODE_ENV="development"
PORT=4000
JWT_SECRET="replace_with_strong_random_jwt_secret"
JWT_REFRESH_SECRET="replace_with_strong_random_refresh_secret"
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/prospectai?schema=public"

# 2. Zero-Cost Messaging: Telegram Bot API (100% Free)
TELEGRAM_ENABLED=true
TELEGRAM_BOT_TOKEN="your_telegram_bot_token"
TELEGRAM_BOT_USERNAME="LeedOpportunityBot"
TELEGRAM_DRY_RUN=false

# 3. Transactional Email: Resend (Free Tier 3,000/mo)
EMAIL_ENABLED=true
RESEND_API_KEY="re_placeholder"
EMAIL_FROM="Leed Opportunity Alerts <notifications@leed.app>"
EMAIL_DRY_RUN=false

# 4. Mobile & Web Push: Expo Push Service (100% Free)
PUSH_ENABLED=true
PUSH_DRY_RUN=false

# 5. Guardrailed Channel: Meta WhatsApp Cloud API (Zero-Cost Safe Default)
WHATSAPP_ENABLED=false
WHATSAPP_DRY_RUN=true
WHATSAPP_MONTHLY_BUDGET_USD=0.00
WHATSAPP_ESTIMATED_COST_PER_MSG_USD=0.035
WHATSAPP_PHONE_NUMBER_ID=""
WHATSAPP_ACCESS_TOKEN=""
WHATSAPP_BUSINESS_ACCOUNT_ID=""
WHATSAPP_VERIFY_TOKEN=""
META_APP_SECRET=""

# 6. AI Inference: Google Gemini API (Free tier: 15 RPM / 1,500 RPD)
GEMINI_API_KEY="your_gemini_api_key"
AI_MODEL="gemini-2.0-flash"
```

---

## 9. Definition of Done & Verification Evidence

All acceptance criteria have been verified across the monorepo:
1. **Zero Paywalls:** All discovery, radar scans, alerts, and application preparations are 100% free for users.
2. **Provider Budget Guardrails:** Paid channels (WhatsApp) respect strict operator budget caps and automatically fall back to zero-cost channels (Telegram, Email, Push).
3. **Multi-Channel Delivery:** In-app Notification Centre, Telegram Bot, Resend Email, and Expo Push successfully receive and render domain events.
4. **Security & Replay Protection:** Telegram single-use linking tokens prevent replay attacks; Meta webhooks enforce HMAC signatures; config validator never prints secrets.
5. **Cross-Platform Synchronization:** Profile completeness, connection statuses, and opportunity actions synchronize across Mobile (Expo), Web (TanStack Start), and PostgreSQL.
6. **Test Coverage:** All 56 tests across 9 test suites pass with 0 errors. TypeScript compilation and builds across backend, mobile, and web exit with Code 0.

