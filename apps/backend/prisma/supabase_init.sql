-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "AutonomyLevel" AS ENUM ('ASSIST', 'APPROVE', 'AUTOMATE');

-- CreateEnum
CREATE TYPE "OpportunityType" AS ENUM ('JOB', 'FREELANCE', 'LEAD', 'CONTRACT', 'SCHOLARSHIP', 'GRANT', 'PARTNER', 'CONSULTING');

-- CreateEnum
CREATE TYPE "OpportunityStatus" AS ENUM ('DISCOVERED', 'SAVED', 'IGNORED', 'APPLIED', 'CONTACTED', 'REPLIED', 'INTERVIEWING', 'WON', 'LOST', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "AttentionPriority" AS ENUM ('URGENT', 'ACTION_REQUIRED', 'IMPORTANT', 'RECOMMENDED', 'INFO');

-- CreateEnum
CREATE TYPE "FollowUpStatus" AS ENUM ('DUE', 'UPCOMING', 'WAITING', 'SENT', 'REPLIED', 'ABANDONED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "name" TEXT NOT NULL,
    "preferredDisplayName" TEXT,
    "avatarUrl" TEXT,
    "phone" TEXT,
    "phoneVerified" BOOLEAN NOT NULL DEFAULT false,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "country" TEXT,
    "city" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "preferredLanguage" TEXT NOT NULL DEFAULT 'en',
    "status" TEXT NOT NULL DEFAULT 'active',
    "role" TEXT NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "headline" TEXT,
    "currentRole" TEXT,
    "careerGoals" TEXT,
    "bio" TEXT,
    "targetOutcome" TEXT NOT NULL,
    "targetCategories" "OpportunityType"[],
    "targetRoles" TEXT[],
    "targetIndustries" TEXT[],
    "targetLocations" TEXT[],
    "remotePreference" TEXT NOT NULL DEFAULT 'remote_only',
    "minCompensation" TEXT,
    "salaryCurrency" TEXT NOT NULL DEFAULT 'USD',
    "targetFundingAmount" TEXT,
    "studyLevel" TEXT,
    "yearsOfExperience" INTEGER NOT NULL DEFAULT 0,
    "autonomyLevel" "AutonomyLevel" NOT NULL DEFAULT 'APPROVE',
    "minMatchScore" INTEGER NOT NULL DEFAULT 60,
    "excludedKeywords" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "excludedOrganizations" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "aiPersonalizationEnabled" BOOLEAN NOT NULL DEFAULT true,
    "dataRetentionMonths" INTEGER NOT NULL DEFAULT 12,
    "onboardingStep" INTEGER NOT NULL DEFAULT 1,
    "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false,
    "scholarshipPreferences" JSONB,
    "grantPreferences" JSONB,
    "businessProspectPreferences" JSONB,
    "learnedPreferences" JSONB,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "goals" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "targetMetric" DOUBLE PRECISION NOT NULL,
    "currentMetric" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "metricUnit" TEXT NOT NULL,
    "targetDate" TIMESTAMP(3) NOT NULL,
    "category" "OpportunityType" NOT NULL,
    "stage" TEXT NOT NULL DEFAULT 'discovery',
    "progressPercentage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "goals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skills" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "yearsExperience" INTEGER,
    "isTopSkill" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "skills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "experiences" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "highlights" TEXT[],

    CONSTRAINT "experiences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documents" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "fileUrl" TEXT,
    "fileSize" TEXT,
    "extractedText" TEXT,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "opportunities" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "type" "OpportunityType" NOT NULL,
    "title" TEXT NOT NULL,
    "organization" TEXT NOT NULL,
    "organizationLogo" TEXT,
    "location" TEXT NOT NULL,
    "isRemote" BOOLEAN NOT NULL DEFAULT true,
    "remoteType" TEXT,
    "compensation" TEXT NOT NULL,
    "compensationAmount" DOUBLE PRECISION,
    "deadline" TIMESTAMP(3),
    "contactPerson" TEXT,
    "contactEmail" TEXT,
    "contactRole" TEXT,
    "source" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "originalUrl" TEXT NOT NULL,
    "canonicalUrl" TEXT,
    "description" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "requirements" JSONB NOT NULL,
    "matchScore" INTEGER NOT NULL,
    "matchExplanation" TEXT NOT NULL,
    "matchPros" TEXT[],
    "matchCons" TEXT[],
    "status" "OpportunityStatus" NOT NULL DEFAULT 'DISCOVERED',
    "nextBestAction" TEXT NOT NULL DEFAULT 'prepare',
    "freshness" TEXT NOT NULL DEFAULT 'new_today',
    "tags" TEXT[],
    "discoveredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastInteractedAt" TIMESTAMP(3),
    "lastVerifiedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "isVerified" BOOLEAN NOT NULL DEFAULT true,
    "contentFingerprint" TEXT,
    "notes" TEXT,
    "metadata" JSONB,

    CONSTRAINT "opportunities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_opportunities" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "opportunityId" TEXT NOT NULL,
    "stage" "OpportunityStatus" NOT NULL DEFAULT 'SAVED',
    "appliedAt" TIMESTAMP(3),
    "followUpDate" TIMESTAMP(3),
    "followUpObjective" TEXT,
    "notes" TEXT,
    "customPitch" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_opportunities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "source_observations" (
    "id" TEXT NOT NULL,
    "opportunityId" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "sourceName" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "externalRecordId" TEXT,
    "originalUrl" TEXT NOT NULL,
    "canonicalUrl" TEXT,
    "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastVerifiedAt" TIMESTAMP(3),
    "httpStatus" INTEGER,
    "contentFingerprint" TEXT,
    "rawPayload" JSONB,
    "retentionPolicy" TEXT NOT NULL DEFAULT 'standard',
    "verificationStatus" TEXT NOT NULL DEFAULT 'verified',
    "metadata" JSONB,

    CONSTRAINT "source_observations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ingestion_runs" (
    "id" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "radarId" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'running',
    "recordsFetched" INTEGER NOT NULL DEFAULT 0,
    "newObservationsCount" INTEGER NOT NULL DEFAULT 0,
    "newOpportunitiesCount" INTEGER NOT NULL DEFAULT 0,
    "duplicatesCount" INTEGER NOT NULL DEFAULT 0,
    "errors" JSONB,
    "metadata" JSONB,

    CONSTRAINT "ingestion_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "opportunity_radars" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "category" "OpportunityType" NOT NULL,
    "frequency" TEXT NOT NULL DEFAULT 'weekdays',
    "scheduleDescription" TEXT NOT NULL,
    "timeOfDay" TEXT NOT NULL DEFAULT '08:00 AM',
    "status" TEXT NOT NULL DEFAULT 'active',
    "lastRunAt" TIMESTAMP(3),
    "nextRunAt" TIMESTAMP(3),
    "totalFound" INTEGER NOT NULL DEFAULT 0,
    "newSinceLastCheck" INTEGER NOT NULL DEFAULT 0,
    "autonomyLevel" "AutonomyLevel" NOT NULL DEFAULT 'APPROVE',
    "targetCriteria" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "opportunity_radars_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agent_runs" (
    "id" TEXT NOT NULL,
    "radarId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "sourcesScannedCount" INTEGER NOT NULL DEFAULT 0,
    "rawFoundCount" INTEGER NOT NULL DEFAULT 0,
    "duplicatesRemovedCount" INTEGER NOT NULL DEFAULT 0,
    "qualifiedCount" INTEGER NOT NULL DEFAULT 0,
    "selectedCount" INTEGER NOT NULL DEFAULT 0,
    "preparedCount" INTEGER NOT NULL DEFAULT 0,
    "waitingApprovalCount" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'completed',
    "summary" TEXT NOT NULL,

    CONSTRAINT "agent_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "follow_ups" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "opportunityId" TEXT NOT NULL,
    "opportunityTitle" TEXT NOT NULL,
    "targetName" TEXT NOT NULL,
    "targetOrg" TEXT NOT NULL,
    "targetEmail" TEXT NOT NULL,
    "channel" TEXT NOT NULL DEFAULT 'email',
    "cadenceStep" INTEGER NOT NULL DEFAULT 1,
    "daysSinceContact" INTEGER NOT NULL DEFAULT 0,
    "status" "FollowUpStatus" NOT NULL DEFAULT 'WAITING',
    "draftSubject" TEXT NOT NULL,
    "draftBody" TEXT NOT NULL,
    "proposedSendDate" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,

    CONSTRAINT "follow_ups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attention_items" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT NOT NULL,
    "priority" "AttentionPriority" NOT NULL DEFAULT 'RECOMMENDED',
    "category" "OpportunityType" NOT NULL,
    "relatedOpportunityId" TEXT,
    "relatedOpportunityTitle" TEXT,
    "relatedOrganization" TEXT,
    "actionType" TEXT NOT NULL,
    "actionablePrompt" TEXT NOT NULL,
    "suggestedActionLabel" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "isResolved" BOOLEAN NOT NULL DEFAULT false,
    "contextSnippet" TEXT,

    CONSTRAINT "attention_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "priority" "AttentionPriority" NOT NULL DEFAULT 'RECOMMENDED',
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "opportunityId" TEXT,
    "actionUrl" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activities" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,

    CONSTRAINT "activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "connections" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "isConnected" BOOLEAN NOT NULL DEFAULT false,
    "accountIdentifier" TEXT,
    "permissions" TEXT[],
    "capabilitiesDescription" TEXT NOT NULL,
    "lastSyncAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'disconnected',

    CONSTRAINT "connections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "credit_accounts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "balance" INTEGER NOT NULL DEFAULT 500,
    "monthlyAllowance" INTEGER NOT NULL DEFAULT 500,
    "planName" TEXT NOT NULL DEFAULT 'Pro Operating',
    "renewalDate" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "credit_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "credit_transactions" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "category" TEXT NOT NULL,

    CONSTRAINT "credit_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "search_sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rawPrompt" TEXT NOT NULL,
    "interpretedCriteria" JSONB NOT NULL,
    "resultCount" INTEGER NOT NULL DEFAULT 0,
    "executedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "search_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "timeline_events" (
    "id" TEXT NOT NULL,
    "opportunityId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "author" TEXT NOT NULL DEFAULT 'user',
    "meta" JSONB,

    CONSTRAINT "timeline_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "whatsapp_accounts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verificationCode" TEXT,
    "verificationExpiresAt" TIMESTAMP(3),
    "consentGiven" BOOLEAN NOT NULL DEFAULT false,
    "consentGivenAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'pending_verification',
    "quietHoursStart" TEXT DEFAULT '22:00',
    "quietHoursEnd" TEXT DEFAULT '08:00',
    "maxDailyNotifications" INTEGER NOT NULL DEFAULT 5,
    "notificationsSentToday" INTEGER NOT NULL DEFAULT 0,
    "lastNotificationSentAt" TIMESTAMP(3),
    "preferredCategories" "OpportunityType"[],
    "minMatchScore" INTEGER NOT NULL DEFAULT 60,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "whatsapp_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "whatsapp_conversations" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "waId" TEXT NOT NULL,
    "activeOpportunityId" TEXT,
    "lastInteractionAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "pendingAction" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "whatsapp_conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "whatsapp_messages" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "waMessageId" TEXT,
    "messageType" TEXT NOT NULL DEFAULT 'text',
    "content" TEXT NOT NULL,
    "rawPayload" JSONB,
    "deliveryStatus" TEXT NOT NULL DEFAULT 'sent',
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "whatsapp_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "action_execution_records" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "conversationId" TEXT,
    "opportunityId" TEXT,
    "actionType" TEXT NOT NULL,
    "level" TEXT NOT NULL DEFAULT 'prepare',
    "status" TEXT NOT NULL DEFAULT 'proposed',
    "evidence" JSONB,
    "authorizedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "action_execution_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "telegram_accounts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "telegramChatId" TEXT,
    "telegramUsername" TEXT,
    "linkingToken" TEXT,
    "linkingTokenExpiresAt" TIMESTAMP(3),
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "consentGiven" BOOLEAN NOT NULL DEFAULT false,
    "consentGivenAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'pending_verification',
    "quietHoursStart" TEXT DEFAULT '22:00',
    "quietHoursEnd" TEXT DEFAULT '08:00',
    "maxDailyNotifications" INTEGER NOT NULL DEFAULT 10,
    "notificationsSentToday" INTEGER NOT NULL DEFAULT 0,
    "lastNotificationSentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "telegram_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_notification_preferences" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verificationCode" TEXT,
    "verificationExpiresAt" TIMESTAMP(3),
    "consentGiven" BOOLEAN NOT NULL DEFAULT true,
    "consentGivenAt" TIMESTAMP(3),
    "frequency" TEXT NOT NULL DEFAULT 'immediate',
    "quietHoursStart" TEXT DEFAULT '22:00',
    "quietHoursEnd" TEXT DEFAULT '08:00',
    "opportunityCategories" "OpportunityType"[],
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_notification_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "push_device_tokens" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "deviceName" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "push_device_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_preferences" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "newMatchEnabled" BOOLEAN NOT NULL DEFAULT true,
    "highPriorityOnly" BOOLEAN NOT NULL DEFAULT false,
    "deadlineRemindersEnabled" BOOLEAN NOT NULL DEFAULT true,
    "applicationUpdatesEnabled" BOOLEAN NOT NULL DEFAULT true,
    "missingInfoAlertsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "statusChangeAlertsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "digestFrequency" TEXT NOT NULL DEFAULT 'none',
    "marketingAnnouncementsEnabled" BOOLEAN NOT NULL DEFAULT false,
    "defaultChannel" TEXT NOT NULL DEFAULT 'in_app',
    "quietHoursStart" TEXT NOT NULL DEFAULT '22:00',
    "quietHoursEnd" TEXT NOT NULL DEFAULT '08:00',
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "maxAlertsPerDay" INTEGER NOT NULL DEFAULT 10,
    "duplicateSuppressionHours" INTEGER NOT NULL DEFAULT 72,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "channel_delivery_records" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "recipient" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "providerMessageId" TEXT,
    "costEstimateUsd" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "channel_delivery_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "profiles_userId_key" ON "profiles"("userId");

-- CreateIndex
CREATE INDEX "opportunities_originalUrl_idx" ON "opportunities"("originalUrl");

-- CreateIndex
CREATE INDEX "opportunities_type_isRemote_idx" ON "opportunities"("type", "isRemote");

-- CreateIndex
CREATE INDEX "user_opportunities_userId_stage_idx" ON "user_opportunities"("userId", "stage");

-- CreateIndex
CREATE UNIQUE INDEX "user_opportunities_userId_opportunityId_key" ON "user_opportunities"("userId", "opportunityId");

-- CreateIndex
CREATE INDEX "source_observations_sourceId_externalRecordId_idx" ON "source_observations"("sourceId", "externalRecordId");

-- CreateIndex
CREATE INDEX "source_observations_originalUrl_idx" ON "source_observations"("originalUrl");

-- CreateIndex
CREATE INDEX "notifications_userId_isRead_idx" ON "notifications"("userId", "isRead");

-- CreateIndex
CREATE UNIQUE INDEX "credit_accounts_userId_key" ON "credit_accounts"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "whatsapp_accounts_userId_key" ON "whatsapp_accounts"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "whatsapp_accounts_phoneNumber_key" ON "whatsapp_accounts"("phoneNumber");

-- CreateIndex
CREATE INDEX "whatsapp_conversations_waId_idx" ON "whatsapp_conversations"("waId");

-- CreateIndex
CREATE INDEX "whatsapp_conversations_userId_idx" ON "whatsapp_conversations"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "whatsapp_messages_waMessageId_key" ON "whatsapp_messages"("waMessageId");

-- CreateIndex
CREATE INDEX "whatsapp_messages_conversationId_idx" ON "whatsapp_messages"("conversationId");

-- CreateIndex
CREATE INDEX "whatsapp_messages_waMessageId_idx" ON "whatsapp_messages"("waMessageId");

-- CreateIndex
CREATE INDEX "action_execution_records_userId_idx" ON "action_execution_records"("userId");

-- CreateIndex
CREATE INDEX "action_execution_records_opportunityId_idx" ON "action_execution_records"("opportunityId");

-- CreateIndex
CREATE UNIQUE INDEX "telegram_accounts_userId_key" ON "telegram_accounts"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "telegram_accounts_telegramChatId_key" ON "telegram_accounts"("telegramChatId");

-- CreateIndex
CREATE UNIQUE INDEX "telegram_accounts_linkingToken_key" ON "telegram_accounts"("linkingToken");

-- CreateIndex
CREATE UNIQUE INDEX "email_notification_preferences_userId_key" ON "email_notification_preferences"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "push_device_tokens_token_key" ON "push_device_tokens"("token");

-- CreateIndex
CREATE INDEX "push_device_tokens_userId_isActive_idx" ON "push_device_tokens"("userId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "notification_preferences_userId_key" ON "notification_preferences"("userId");

-- CreateIndex
CREATE INDEX "channel_delivery_records_userId_channel_idx" ON "channel_delivery_records"("userId", "channel");

-- CreateIndex
CREATE INDEX "channel_delivery_records_eventType_idx" ON "channel_delivery_records"("eventType");

-- AddForeignKey
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goals" ADD CONSTRAINT "goals_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skills" ADD CONSTRAINT "skills_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "experiences" ADD CONSTRAINT "experiences_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_opportunities" ADD CONSTRAINT "user_opportunities_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_opportunities" ADD CONSTRAINT "user_opportunities_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "opportunities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "source_observations" ADD CONSTRAINT "source_observations_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "opportunities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunity_radars" ADD CONSTRAINT "opportunity_radars_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_runs" ADD CONSTRAINT "agent_runs_radarId_fkey" FOREIGN KEY ("radarId") REFERENCES "opportunity_radars"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "follow_ups" ADD CONSTRAINT "follow_ups_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attention_items" ADD CONSTRAINT "attention_items_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "connections" ADD CONSTRAINT "connections_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credit_accounts" ADD CONSTRAINT "credit_accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credit_transactions" ADD CONSTRAINT "credit_transactions_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "credit_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "search_sessions" ADD CONSTRAINT "search_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timeline_events" ADD CONSTRAINT "timeline_events_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "opportunities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "whatsapp_accounts" ADD CONSTRAINT "whatsapp_accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "whatsapp_conversations" ADD CONSTRAINT "whatsapp_conversations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "whatsapp_conversations" ADD CONSTRAINT "whatsapp_conversations_activeOpportunityId_fkey" FOREIGN KEY ("activeOpportunityId") REFERENCES "opportunities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "whatsapp_messages" ADD CONSTRAINT "whatsapp_messages_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "whatsapp_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "action_execution_records" ADD CONSTRAINT "action_execution_records_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "action_execution_records" ADD CONSTRAINT "action_execution_records_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "whatsapp_conversations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "action_execution_records" ADD CONSTRAINT "action_execution_records_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "opportunities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "telegram_accounts" ADD CONSTRAINT "telegram_accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_notification_preferences" ADD CONSTRAINT "email_notification_preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "push_device_tokens" ADD CONSTRAINT "push_device_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "channel_delivery_records" ADD CONSTRAINT "channel_delivery_records_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

