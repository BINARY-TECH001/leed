import React, { createContext, useContext, useState, useMemo } from 'react';
import type { Opportunity, OpportunityStatus } from '@prospect/types';
import * as Haptics from 'expo-haptics';

export type PipelineStage =
  | 'saved'
  | 'applied'
  | 'follow_up'
  | 'interviewing'
  | 'won'
  | 'archived';

export interface PipelineRecord {
  id: string;
  opportunityId: string;
  opportunity: Opportunity;
  stage: PipelineStage;
  appliedAt?: string;
  followUpDate?: string;
  followUpObjective?: string;
  notes?: string;
  updatedAt: string;
}

interface PipelineContextType {
  records: PipelineRecord[];
  savedIds: string[];
  appliedIds: string[];
  isSaved: (oppId: string) => boolean;
  isApplied: (oppId: string) => boolean;
  getRecord: (oppId: string) => PipelineRecord | undefined;
  toggleSave: (opp: Opportunity) => void;
  applyToOpportunity: (opp: Opportunity, customNote?: string) => void;
  scheduleFollowUp: (oppId: string, date: string, objective: string, opp?: Opportunity) => void;
  updateStage: (oppId: string, newStage: PipelineStage) => void;
  updateNotes: (oppId: string, notes: string) => void;
  removeFromPipeline: (oppId: string) => void;
  stats: {
    totalTracked: number;
    savedCount: number;
    appliedCount: number;
    interviewingCount: number;
    followUpsDueCount: number;
    activeRadars: number;
    totalMatches: number;
  };
}

const PipelineContext = createContext<PipelineContextType | undefined>(undefined);

// Initial empty pipeline for real user activity
const INITIAL_RECORDS: PipelineRecord[] = [];

export const PipelineProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [records, setRecords] = useState<PipelineRecord[]>(INITIAL_RECORDS);

  const savedIds = useMemo(() => {
    return records
      .filter((r) => r.stage === 'saved' || r.stage === 'follow_up')
      .map((r) => r.opportunityId);
  }, [records]);

  const appliedIds = useMemo(() => {
    return records
      .filter((r) => ['applied', 'interviewing', 'won'].includes(r.stage))
      .map((r) => r.opportunityId);
  }, [records]);

  const isSaved = (oppId: string) => {
    return records.some((r) => r.opportunityId === oppId && r.stage === 'saved');
  };

  const isApplied = (oppId: string) => {
    return records.some(
      (r) => r.opportunityId === oppId && ['applied', 'interviewing', 'won'].includes(r.stage)
    );
  };

  const getRecord = (oppId: string) => {
    return records.find((r) => r.opportunityId === oppId);
  };

  const toggleSave = (opp: Opportunity) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRecords((prev) => {
      const existing = prev.find((r) => r.opportunityId === opp.id);
      if (existing) {
        if (existing.stage === 'saved') {
          // Remove if it was merely saved
          return prev.filter((r) => r.opportunityId !== opp.id);
        } else {
          // If already applied/interviewing, keep it
          return prev;
        }
      } else {
        // Add to saved
        const newRecord: PipelineRecord = {
          id: `pipe-${Date.now()}`,
          opportunityId: opp.id,
          opportunity: opp,
          stage: 'saved',
          updatedAt: new Date().toISOString(),
        };
        return [newRecord, ...prev];
      }
    });
  };

  const applyToOpportunity = (opp: Opportunity, customNote?: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setRecords((prev) => {
      const existing = prev.find((r) => r.opportunityId === opp.id);
      if (existing) {
        return prev.map((r) =>
          r.opportunityId === opp.id
            ? {
                ...r,
                stage: 'applied',
                appliedAt: 'Just now',
                notes: customNote || r.notes || 'Proposal calibrated and dispatched.',
                updatedAt: new Date().toISOString(),
              }
            : r
        );
      } else {
        const newRecord: PipelineRecord = {
          id: `pipe-${Date.now()}`,
          opportunityId: opp.id,
          opportunity: opp,
          stage: 'applied',
          appliedAt: 'Just now',
          notes: customNote || 'Proposal calibrated and dispatched.',
          updatedAt: new Date().toISOString(),
        };
        return [newRecord, ...prev];
      }
    });
  };

  const scheduleFollowUp = (oppId: string, date: string, objective: string, opp?: Opportunity) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setRecords((prev) => {
      const existing = prev.find((r) => r.opportunityId === oppId);

      if (existing) {
        return prev.map((r) =>
          r.opportunityId === oppId
            ? {
                ...r,
                stage: r.stage === 'saved' ? 'follow_up' : r.stage,
                followUpDate: date,
                followUpObjective: objective,
                updatedAt: new Date().toISOString(),
              }
            : r
        );
      } else if (opp) {
        const newRecord: PipelineRecord = {
          id: `pipe-${Date.now()}`,
          opportunityId: oppId,
          opportunity: opp,
          stage: 'follow_up',
          followUpDate: date,
          followUpObjective: objective,
          updatedAt: new Date().toISOString(),
        };
        return [newRecord, ...prev];
      }
      return prev;
    });
  };

  const updateStage = (oppId: string, newStage: PipelineStage) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setRecords((prev) =>
      prev.map((r) =>
        r.opportunityId === oppId
          ? { ...r, stage: newStage, updatedAt: new Date().toISOString() }
          : r
      )
    );
  };

  const updateNotes = (oppId: string, notes: string) => {
    setRecords((prev) =>
      prev.map((r) =>
        r.opportunityId === oppId
          ? { ...r, notes, updatedAt: new Date().toISOString() }
          : r
      )
    );
  };

  const removeFromPipeline = (oppId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRecords((prev) => prev.filter((r) => r.opportunityId !== oppId));
  };

  const stats = useMemo(() => {
    return {
      totalTracked: records.length,
      savedCount: records.filter((r) => r.stage === 'saved').length,
      appliedCount: records.filter((r) => r.stage === 'applied').length,
      interviewingCount: records.filter((r) => r.stage === 'interviewing').length,
      followUpsDueCount: records.filter(
        (r) => r.stage === 'follow_up' || (r.followUpDate && r.followUpDate.includes('Today'))
      ).length,
      activeRadars: 0,
      totalMatches: records.length,
    };
  }, [records]);

  return (
    <PipelineContext.Provider
      value={{
        records,
        savedIds,
        appliedIds,
        isSaved,
        isApplied,
        getRecord,
        toggleSave,
        applyToOpportunity,
        scheduleFollowUp,
        updateStage,
        updateNotes,
        removeFromPipeline,
        stats,
      }}
    >
      {children}
    </PipelineContext.Provider>
  );
};

export const usePipeline = () => {
  const context = useContext(PipelineContext);
  if (!context) {
    throw new Error('usePipeline must be used within a PipelineProvider');
  }
  return context;
};
