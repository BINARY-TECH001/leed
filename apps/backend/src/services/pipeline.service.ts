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

let pipelineRecords: PipelineItem[] = [
  {
    id: 'pipe-1',
    opportunityId: 'opp-3',
    stage: 'interviewing',
    appliedAt: '3 days ago',
    followUpDate: 'Tomorrow at 10:00 AM',
    followUpObjective: 'Technical Architecture Round with Mobile Lead',
    notes: 'Covered offline queue synchronization and CRDT conflict resolution. Impressed with performance benchmarks.',
    updatedAt: '2026-10-12T14:30:00Z',
  },
  {
    id: 'pipe-2',
    opportunityId: 'opp-2',
    stage: 'applied',
    appliedAt: 'Yesterday',
    followUpDate: 'In 3 Days',
    followUpObjective: 'Direct check-in with Guillermo / Eng recruiter',
    notes: 'Autonomous proposal generated using Principal Architect CV. Highlighted AI workflow optimizations.',
    updatedAt: '2026-10-12T18:00:00Z',
  },
  {
    id: 'pipe-3',
    opportunityId: 'opp-1',
    stage: 'follow_up',
    appliedAt: '4 days ago',
    followUpDate: 'Today',
    followUpObjective: 'Send SOC2 compliance case study and ledger benchmarks',
    notes: 'Hourly rate agreed at $145/hr. Awaiting SOW draft approval.',
    updatedAt: '2026-10-13T09:15:00Z',
  },
  {
    id: 'pipe-4',
    opportunityId: 'opp-4',
    stage: 'saved',
    notes: 'High potential for retainer extension beyond initial $28k scope.',
    updatedAt: '2026-10-11T16:00:00Z',
  },
];

export class PipelineService {
  static async getPipeline(): Promise<{
    records: PipelineItem[];
    stats: {
      total: number;
      saved: number;
      applied: number;
      interviewing: number;
      followUpsDue: number;
    };
  }> {
    const stats = {
      total: pipelineRecords.length,
      saved: pipelineRecords.filter((r) => r.stage === 'saved').length,
      applied: pipelineRecords.filter((r) => r.stage === 'applied').length,
      interviewing: pipelineRecords.filter((r) => r.stage === 'interviewing').length,
      followUpsDue: pipelineRecords.filter(
        (r) => r.stage === 'follow_up' || (r.followUpDate && r.followUpDate.includes('Today'))
      ).length,
    };

    return { records: pipelineRecords, stats };
  }

  static async updateStage(
    opportunityId: string,
    stage: 'saved' | 'applied' | 'follow_up' | 'interviewing' | 'won' | 'archived',
    notes?: string
  ): Promise<PipelineItem> {
    const existing = pipelineRecords.find((r) => r.opportunityId === opportunityId);

    if (existing) {
      existing.stage = stage;
      existing.updatedAt = new Date().toISOString();
      if (notes) existing.notes = notes;
      return existing;
    }

    const newItem: PipelineItem = {
      id: `pipe-${Date.now()}`,
      opportunityId,
      stage,
      notes: notes || 'Opportunity tracked in pipeline.',
      updatedAt: new Date().toISOString(),
    };

    pipelineRecords.unshift(newItem);
    return newItem;
  }

  static async scheduleFollowUp(
    opportunityId: string,
    date: string,
    objective: string
  ): Promise<PipelineItem> {
    const existing = pipelineRecords.find((r) => r.opportunityId === opportunityId);

    if (existing) {
      existing.followUpDate = date;
      existing.followUpObjective = objective;
      if (existing.stage === 'saved') {
        existing.stage = 'follow_up';
      }
      existing.updatedAt = new Date().toISOString();
      return existing;
    }

    const newItem: PipelineItem = {
      id: `pipe-${Date.now()}`,
      opportunityId,
      stage: 'follow_up',
      followUpDate: date,
      followUpObjective: objective,
      updatedAt: new Date().toISOString(),
    };

    pipelineRecords.unshift(newItem);
    return newItem;
  }

  static async updateNotes(opportunityId: string, notes: string): Promise<PipelineItem> {
    const existing = pipelineRecords.find((r) => r.opportunityId === opportunityId);

    if (existing) {
      existing.notes = notes;
      existing.updatedAt = new Date().toISOString();
      return existing;
    }

    const newItem: PipelineItem = {
      id: `pipe-${Date.now()}`,
      opportunityId,
      stage: 'saved',
      notes,
      updatedAt: new Date().toISOString(),
    };

    pipelineRecords.unshift(newItem);
    return newItem;
  }

  static async remove(opportunityId: string): Promise<boolean> {
    const initialLen = pipelineRecords.length;
    pipelineRecords = pipelineRecords.filter((r) => r.opportunityId !== opportunityId);
    return pipelineRecords.length < initialLen;
  }
}
