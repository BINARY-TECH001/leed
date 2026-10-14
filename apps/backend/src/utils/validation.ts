import { z } from 'zod';

export const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(2),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const opportunitySearchSchema = z.object({
  query: z.string().optional(),
  category: z.string().optional(),
  type: z.string().optional(),
  remoteOnly: z.preprocess((v) => v === 'true' || v === true, z.boolean()).optional(),
  minCompRate: z.preprocess((v) => (v ? Number(v) : undefined), z.number()).optional(),
  highFitOnly: z.preprocess((v) => v === 'true' || v === true, z.boolean()).optional(),
  sort: z.enum(['match', 'comp', 'newest', 'org']).optional(),
});

export const applyOpportunitySchema = z.object({
  cvName: z.string().optional(),
  customPitch: z.string().optional(),
});

export const createRadarSchema = z.object({
  title: z.string().min(3),
  prompt: z.string().min(5),
  category: z.enum(['job', 'freelance', 'lead', 'contract', 'scholarship', 'grant', 'partner', 'consulting']),
  frequency: z.enum(['daily', 'weekdays', 'weekly', 'custom']),
  autonomyLevel: z.enum(['assist', 'approve', 'automate']),
});

export const updatePipelineStageSchema = z.object({
  opportunityId: z.string().min(1),
  stage: z.enum(['saved', 'applied', 'follow_up', 'interviewing', 'won', 'archived']),
  notes: z.string().optional(),
});

export const scheduleFollowUpSchema = z.object({
  opportunityId: z.string().min(1),
  date: z.string().min(1),
  objective: z.string().min(2),
});

export const updateNotesSchema = z.object({
  opportunityId: z.string().min(1),
  notes: z.string(),
});

export const generateProposalSchema = z.object({
  opportunityId: z.string().min(1),
  tone: z.enum(['Executive', 'Direct', 'Technical', 'Warm']).default('Executive'),
  channel: z.enum(['email', 'linkedin', 'followup']).default('email'),
  cvSkills: z.array(z.string()).optional(),
  userName: z.string().optional(),
});
