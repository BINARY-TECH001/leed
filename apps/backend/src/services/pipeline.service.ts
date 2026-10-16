import { prisma } from '../utils/prisma.js';

export interface PipelineItem {
  id: string;
  opportunityId: string;
  stage: 'saved' | 'applied' | 'follow_up' | 'interviewing' | 'won' | 'archived';
  appliedAt?: string;
  followUpDate?: string;
  followUpObjective?: string;
  notes?: string;
  updatedAt: string;
}

const mapStageToPrisma = (stage: string) => {
  switch (stage.toLowerCase()) {
    case 'saved': return 'SAVED';
    case 'applied': return 'APPLIED';
    case 'interviewing': return 'INTERVIEWING';
    case 'follow_up':
    case 'contacted': return 'CONTACTED';
    case 'won': return 'WON';
    case 'archived': return 'ARCHIVED';
    default: return 'SAVED';
  }
};

const mapPrismaToStage = (stage: string): PipelineItem['stage'] => {
  switch (stage) {
    case 'SAVED': return 'saved';
    case 'APPLIED': return 'applied';
    case 'INTERVIEWING': return 'interviewing';
    case 'CONTACTED':
    case 'REPLIED': return 'follow_up';
    case 'WON': return 'won';
    case 'ARCHIVED': return 'archived';
    default: return 'saved';
  }
};

export class PipelineService {
  static async getPipeline(userId: string): Promise<{
    records: PipelineItem[];
    stats: {
      total: number;
      saved: number;
      applied: number;
      interviewing: number;
      followUpsDue: number;
    };
  }> {
    const userOpportunities = await prisma.userOpportunity.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      include: { opportunity: true },
    });

    const records: PipelineItem[] = userOpportunities.map((uo) => ({
      id: uo.id,
      opportunityId: uo.opportunityId,
      stage: mapPrismaToStage(uo.stage),
      appliedAt: uo.appliedAt ? uo.appliedAt.toISOString() : undefined,
      followUpDate: uo.followUpDate ? uo.followUpDate.toISOString() : undefined,
      followUpObjective: uo.followUpObjective || undefined,
      notes: uo.notes || undefined,
      updatedAt: uo.updatedAt.toISOString(),
    }));

    const stats = {
      total: records.length,
      saved: records.filter((r) => r.stage === 'saved').length,
      applied: records.filter((r) => r.stage === 'applied').length,
      interviewing: records.filter((r) => r.stage === 'interviewing').length,
      followUpsDue: records.filter(
        (r) => r.stage === 'follow_up' || (r.followUpDate && new Date(r.followUpDate) <= new Date())
      ).length,
    };

    return { records, stats };
  }

  static async updateStage(
    userId: string,
    opportunityId: string,
    stage: 'saved' | 'applied' | 'follow_up' | 'interviewing' | 'won' | 'archived',
    notes?: string
  ): Promise<PipelineItem> {
    const prismaStage = mapStageToPrisma(stage) as any;

    const uo = await prisma.userOpportunity.upsert({
      where: {
        userId_opportunityId: { userId, opportunityId },
      },
      update: {
        stage: prismaStage,
        appliedAt: stage === 'applied' ? new Date() : undefined,
        notes: notes !== undefined ? notes : undefined,
      },
      create: {
        userId,
        opportunityId,
        stage: prismaStage,
        appliedAt: stage === 'applied' ? new Date() : undefined,
        notes: notes || 'Opportunity tracked in pipeline.',
      },
    });

    return {
      id: uo.id,
      opportunityId: uo.opportunityId,
      stage: mapPrismaToStage(uo.stage),
      appliedAt: uo.appliedAt ? uo.appliedAt.toISOString() : undefined,
      followUpDate: uo.followUpDate ? uo.followUpDate.toISOString() : undefined,
      followUpObjective: uo.followUpObjective || undefined,
      notes: uo.notes || undefined,
      updatedAt: uo.updatedAt.toISOString(),
    };
  }

  static async scheduleFollowUp(
    userId: string,
    opportunityId: string,
    date: string,
    objective: string
  ): Promise<PipelineItem> {
    const parsedDate = new Date(date);
    const validDate = isNaN(parsedDate.getTime()) ? new Date(Date.now() + 86400000) : parsedDate;

    const uo = await prisma.userOpportunity.upsert({
      where: {
        userId_opportunityId: { userId, opportunityId },
      },
      update: {
        stage: 'CONTACTED',
        followUpDate: validDate,
        followUpObjective: objective,
      },
      create: {
        userId,
        opportunityId,
        stage: 'CONTACTED',
        followUpDate: validDate,
        followUpObjective: objective,
      },
    });

    return {
      id: uo.id,
      opportunityId: uo.opportunityId,
      stage: 'follow_up',
      followUpDate: uo.followUpDate ? uo.followUpDate.toISOString() : undefined,
      followUpObjective: uo.followUpObjective || undefined,
      notes: uo.notes || undefined,
      updatedAt: uo.updatedAt.toISOString(),
    };
  }

  static async updateNotes(
    userId: string,
    opportunityId: string,
    notes: string
  ): Promise<PipelineItem> {
    const uo = await prisma.userOpportunity.upsert({
      where: {
        userId_opportunityId: { userId, opportunityId },
      },
      update: {
        notes,
      },
      create: {
        userId,
        opportunityId,
        stage: 'SAVED',
        notes,
      },
    });

    return {
      id: uo.id,
      opportunityId: uo.opportunityId,
      stage: mapPrismaToStage(uo.stage),
      notes: uo.notes || undefined,
      updatedAt: uo.updatedAt.toISOString(),
    };
  }

  static async remove(userId: string, opportunityId: string): Promise<boolean> {
    try {
      await prisma.userOpportunity.delete({
        where: {
          userId_opportunityId: { userId, opportunityId },
        },
      });
      return true;
    } catch {
      return false;
    }
  }
}
