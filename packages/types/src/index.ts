export type AutonomyLevel = 'assist' | 'approve' | 'automate';

export type OpportunityType =
  | 'job'
  | 'freelance'
  | 'lead'
  | 'contract'
  | 'scholarship'
  | 'grant'
  | 'partner'
  | 'consulting';

export type OpportunityStatus =
  | 'discovered'
  | 'saved'
  | 'ignored'
  | 'applied'
  | 'contacted'
  | 'replied'
  | 'interviewing'
  | 'won'
  | 'lost'
  | 'archived';

export interface TimelineEvent {
  id: string;
  type: string;
  title: string;
  description: string;
  timestamp: string;
  author: 'user' | 'ai' | 'external';
  meta?: Record<string, any>;
}

export interface OpportunityRequirement {
  text: string;
  isMatched: boolean;
  notes?: string;
}

export interface Opportunity {
  id: string;
  type: OpportunityType;
  title: string;
  organization: string;
  organizationLogo?: string;
  location: string;
  isRemote: boolean;
  remoteType?: 'fully_remote' | 'hybrid' | 'timezone_flexible' | 'onsite';
  compensation: string;
  compensationAmount?: number;
  deadline?: string;
  contactPerson?: string;
  contactEmail?: string;
  contactRole?: string;
  source: string;
  sourceType: 'automated_ai' | 'direct_import' | 'verified_partner' | 'public_index';
  originalUrl: string;
  description: string;
  summary: string;
  requirements: OpportunityRequirement[];
  matchScore: number; // 0 - 100
  matchExplanation: string;
  matchPros: string[];
  matchCons: string[];
  status: OpportunityStatus;
  nextBestAction: 'apply' | 'prepare' | 'research' | 'contact' | 'followup' | 'wait';
  freshness: 'new_today' | 'recent' | 'closing_soon' | 'stale';
  tags: string[];
  discoveredAt: string;
  lastInteractedAt?: string;
  timeline: TimelineEvent[];
  notes?: string;
  metadata?: {
    companySize?: string;
    fundingStage?: string;
    industry?: string;
    urgencyLevel?: 'high' | 'normal' | 'low';
  };
}

export interface OpportunityRadar {
  id: string;
  title: string;
  prompt: string;
  category: OpportunityType;
  frequency: 'daily' | 'weekdays' | 'weekly' | 'custom';
  scheduleDescription: string;
  timeOfDay: string;
  status: 'active' | 'paused' | 'completed' | 'error';
  lastRunAt: string;
  nextRunAt: string;
  totalFound: number;
  newSinceLastCheck: number;
  autonomyLevel: AutonomyLevel;
  targetCriteria: Partial<InterpretedCriteria>;
  createdDate: string;
}

export interface AgentSkill {
  id: string;
  name: string;
  description: string;
  category: 'application' | 'outreach' | 'qualification' | 'evaluation';
  promptInstructions: string;
  isDefault: boolean;
}

export interface AgentRun {
  id: string;
  radarId: string;
  radarTitle: string;
  startedAt: string;
  completedAt?: string;
  sourcesScannedCount: number;
  rawFoundCount: number;
  duplicatesRemovedCount: number;
  qualifiedCount: number;
  selectedCount: number;
  preparedCount: number;
  waitingApprovalCount: number;
  status: 'running' | 'completed' | 'failed' | 'needs_attention';
  summary: string;
}

export interface CVSkill {
  name: string;
  category: 'core' | 'framework' | 'tool' | 'domain';
  yearsExperience?: number;
  isTopSkill?: boolean;
}

export interface CVExperience {
  id: string;
  role: string;
  company: string;
  period: string;
  description: string;
  highlights: string[];
}

export interface CVEducation {
  id: string;
  degree: string;
  institution: string;
  year: string;
  details?: string;
}

export interface UserDocument {
  id: string;
  name: string;
  type: 'cv' | 'resume' | 'portfolio' | 'certificate' | 'proposal' | 'other';
  uploadedAt: string;
  fileSize?: string;
  extractedText?: string;
}

export interface CVContext {
  id: string;
  fileName: string;
  uploadedAt: string;
  fullName: string;
  title: string;
  email: string;
  phone?: string;
  location: string;
  summary: string;
  skills: CVSkill[];
  experience: CVExperience[];
  education: CVEducation[];
  targetSalaryMin: number;
  preferredWorkType: ('remote' | 'hybrid' | 'relocation')[];
  rawText?: string;
}

export interface LearnedPreferences {
  preferredTech: string[];
  rejectedKeywords: string[];
  preferredLocations: string[];
  favoriteSources: string[];
  salaryFloorDetected: number;
  behaviorNotes: string[];
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  bio: string;
  targetOutcome: string;
  targetCategories: OpportunityType[];
  targetRoles: string[];
  targetIndustries: string[];
  targetLocations: string[];
  remotePreference: 'remote_only' | 'hybrid_ok' | 'any';
  minCompensation: string;
  availability: 'immediate' | '2_weeks' | '1_month' | 'exploring';
  yearsOfExperience: number;
  autonomyLevel: AutonomyLevel;
  cvContext?: CVContext;
  documents: UserDocument[];
  onboardingCompleted: boolean;
  createdAt: string;
  learnedPreferences: LearnedPreferences;
}

export interface InterpretedCriteria {
  category: OpportunityType;
  roles: string[];
  technologies: string[];
  locations: string[];
  remote: boolean;
  compensationMin?: string;
  seniority?: string;
  urgency?: string;
  inferredFromCV?: boolean;
}

export interface SearchSession {
  id: string;
  rawPrompt: string;
  interpretedCriteria: InterpretedCriteria;
  executedAt: string;
  resultCount: number;
  results: Opportunity[];
  isSaved: boolean;
  isAutomated: boolean;
  radarId?: string;
  sourcesScannedCount: number;
}

export type AttentionPriority = 'urgent' | 'action_required' | 'important' | 'recommended' | 'info';

export interface AttentionItem {
  id: string;
  title: string;
  subtitle: string;
  priority: AttentionPriority;
  category: OpportunityType;
  relatedOpportunityId?: string;
  relatedOpportunityTitle?: string;
  relatedOrganization?: string;
  actionType:
    | 'approve_application'
    | 'send_followup'
    | 'review_lead'
    | 'deadline_warning'
    | 'new_high_match'
    | 'automation_check';
  actionablePrompt: string;
  suggestedActionLabel: string;
  createdAt: string;
  isRead: boolean;
  isResolved: boolean;
  contextSnippet?: string;
}

export interface FollowUp {
  id: string;
  opportunityId: string;
  opportunityTitle: string;
  targetName: string;
  targetOrg: string;
  targetEmail: string;
  channel: 'email' | 'linkedin' | 'whatsapp' | 'telegram';
  cadenceStep: number;
  daysSinceContact: number;
  status: 'due' | 'upcoming' | 'waiting' | 'sent' | 'replied' | 'abandoned';
  draftSubject: string;
  draftBody: string;
  proposedSendDate: string;
  notes?: string;
}

export interface Connection {
  id: string;
  name: string;
  type: 'gmail' | 'outlook' | 'whatsapp' | 'telegram' | 'google_calendar' | 'google_drive' | 'notion' | 'slack' | 'linkedin';
  icon: string;
  isConnected: boolean;
  accountIdentifier?: string;
  permissions: string[];
  capabilitiesDescription: string;
  lastSyncAt?: string;
  status: 'active' | 'disconnected' | 'error';
}

export interface CreditTransaction {
  id: string;
  description: string;
  amount: number;
  timestamp: string;
  category: 'search' | 'application_prep' | 'outreach_draft' | 'automation' | 'cv_analysis' | 'refill';
}

export interface CreditAccount {
  balance: number;
  monthlyAllowance: number;
  planName: 'Starter' | 'Pro Operating' | 'Enterprise Agent';
  renewalDate: string;
  transactions: CreditTransaction[];
}

export interface Goal {
  id: string;
  title: string;
  targetMetric: number;
  currentMetric: number;
  metricUnit: string;
  targetDate: string;
  category: OpportunityType;
  stage: 'discovery' | 'shortlist' | 'preparation' | 'action' | 'outcome';
  progressPercentage: number;
  isCompleted: boolean;
}

export interface ActivityItem {
  id: string;
  type: 'radar_scan' | 'search' | 'save' | 'apply_prep' | 'outreach_sent' | 'cv_updated' | 'followup_scheduled';
  title: string;
  description: string;
  timestamp: string;
  opportunityId?: string;
  metadata?: Record<string, any>;
}

export interface AIActionStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'ready' | 'in_progress' | 'completed' | 'skipped';
  estimatedSeconds: number;
}

export interface AITaskPlan {
  id: string;
  intent: string;
  selectedCount: number;
  eligibleCount: number;
  skippedCount: number;
  skipReasons: string[];
  steps: AIActionStep[];
  estimatedCredits: number;
  requiresApproval: boolean;
  generatedAssets: {
    coverLettersCount?: number;
    customizedResumesCount?: number;
    outreachDraftsCount?: number;
  };
  warnings?: string[];
}

export type AuthState =
  | 'unauthenticated'
  | 'authenticating'
  | 'authenticated'
  | 'verification_required'
  | 'password_reset'
  | 'onboarding';

export interface AuthSession {
  state: AuthState;
  token?: string;
  user?: UserProfile;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}
