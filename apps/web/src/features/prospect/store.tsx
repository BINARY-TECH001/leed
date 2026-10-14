import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { initialHistory, initialProfiles, matchesIntent, opportunities, type Profile } from "./data";

type HistoryItem = { id: string; title: string; date: string; count: number; type: string };
type Automation = { id: string; title: string; schedule: string; enabled: boolean; approval: boolean; action?: string; profileId?: string; limit?: number; stopCondition?: string };
export type FollowUp = { opportunityId: string; date: string; status: "Scheduled" | "Snoozed" | "Completed" | "Skipped"; note: string };
export type PreviewGoal = { goal: string; type: string; location: string };
export type WorkItem = { id: string; opportunityId: string; type: "application" | "outreach"; status: "Draft" | "Ready for review" | "Approved" | "Needs attention"; profileId: string; subject: string; message: string; created: string };
export type BatchJob = { id: string; name: string; ids: string[]; action: string; status: "Ready for review" | "Approved preview"; created: string; exclusions: number };
type Store = {
  intent: string; setIntent: (v: string) => void; submittedIntent: string; setSubmittedIntent: (v: string) => void;
  saved: string[]; toggleSaved: (id: string) => void; tracked: string[]; toggleTracked: (id: string) => void;
  notes: Record<string, string>; setNote: (id: string, note: string) => void;
  history: HistoryItem[]; addHistory: (title: string) => void;
  automations: Automation[]; addAutomation: (plan: Omit<Automation, "id" | "enabled">) => void; toggleAutomation: (id: string) => void;
  profiles: Profile[]; activeProfileId: string; setActiveProfileId: (id: string) => void; addProfile: (profile: Profile) => void; updateProfile: (profile: Profile) => void;
  workItems: WorkItem[]; upsertWorkItem: (item: WorkItem) => void; batchJobs: BatchJob[]; addBatchJob: (job: BatchJob) => void;
  dismissedAttention: string[]; dismissAttention: (id: string) => void;
  goal: PreviewGoal | null; setGoal: (goal: PreviewGoal) => void;
  followUps: FollowUp[]; upsertFollowUp: (followUp: FollowUp) => void;
};
const Context = createContext<Store | null>(null);
export function ProspectProvider({ children }: { children: ReactNode }) {
  const [intent, setIntent] = useState("");
  const [submittedIntent, setSubmittedIntent] = useState("");
  const [saved, setSaved] = useState<string[]>([]);
  const [tracked, setTracked] = useState<string[]>([]);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [history, setHistory] = useState<HistoryItem[]>(initialHistory);
  const [automations, setAutomations] = useState<Automation[]>([{ id: "a1", title: "Remote frontend roles using React and Next.js", schedule: "Every weekday at 9:00 AM", enabled: true, approval: true }]);
  const [profiles, setProfiles] = useState<Profile[]>(initialProfiles);
  const [activeProfileId, setActiveProfileId] = useState("frontend");
  const [workItems, setWorkItems] = useState<WorkItem[]>([]);
  const [batchJobs, setBatchJobs] = useState<BatchJob[]>([]);
  const [dismissedAttention, setDismissedAttention] = useState<string[]>([]);
  const [goal, setGoal] = useState<PreviewGoal | null>(null);
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    try {
      const state = JSON.parse(localStorage.getItem("prospectai-demo") || "null");
      if (state) { setSaved(state.saved || []); setTracked(state.tracked || []); setNotes(state.notes || {}); setHistory(state.history || initialHistory); setAutomations(state.automations || []); setProfiles(state.profiles || initialProfiles); setActiveProfileId(state.activeProfileId || "frontend"); setWorkItems(state.workItems || []); setBatchJobs(state.batchJobs || []); setDismissedAttention(state.dismissedAttention || []); setGoal(state.goal || null); setFollowUps(state.followUps || []); }
      const onboardingGoal = localStorage.getItem("prospectai-preview-goal");
      if (onboardingGoal) { const parsed = JSON.parse(onboardingGoal); if (typeof parsed?.goal === "string") setGoal(parsed); localStorage.removeItem("prospectai-preview-goal"); }
    } catch { /* Demo storage may be unavailable. */ }
    setHydrated(true);
  }, []);
  useEffect(() => { if (!hydrated) return; try { localStorage.setItem("prospectai-demo", JSON.stringify({ saved, tracked, notes, history, automations, profiles, activeProfileId, workItems, batchJobs, dismissedAttention, goal, followUps })); } catch { /* Demo storage may be unavailable. */ } }, [hydrated, saved, tracked, notes, history, automations, profiles, activeProfileId, workItems, batchJobs, dismissedAttention, goal, followUps]);
  const toggleSaved = (id: string) => setSaved(v => v.includes(id) ? v.filter(x => x !== id) : [...v, id]);
  const toggleTracked = (id: string) => setTracked(v => v.includes(id) ? v.filter(x => x !== id) : [...v, id]);
  const setNote = (id: string, note: string) => setNotes(v => ({ ...v, [id]: note }));
  const addHistory = (title: string) => setHistory(v => [{ id: String(Date.now()), title, date: "Just now", count: opportunities.filter(o => matchesIntent(o, title)).length, type: "Discovery" }, ...v]);
  const addAutomation = (plan: Omit<Automation, "id" | "enabled">) => setAutomations(v => [{ ...plan, id: String(Date.now()), enabled: true }, ...v]);
  const toggleAutomation = (id: string) => setAutomations(v => v.map(a => a.id === id ? { ...a, enabled: !a.enabled } : a));
  const addProfile = (profile: Profile) => { setProfiles(v => [...v, profile]); setActiveProfileId(profile.id); };
  const updateProfile = (profile: Profile) => setProfiles(v => v.map(p => p.id === profile.id ? profile : p));
  const upsertWorkItem = (item: WorkItem) => setWorkItems(v => [item, ...v.filter(w => w.id !== item.id)]);
  const addBatchJob = (job: BatchJob) => setBatchJobs(v => [job, ...v]);
  const dismissAttention = (id: string) => setDismissedAttention(v => [...new Set([...v, id])]);
  const upsertFollowUp = (item: FollowUp) => setFollowUps(v => [item, ...v.filter(f => f.opportunityId !== item.opportunityId)]);
  return <Context.Provider value={{ intent, setIntent, submittedIntent, setSubmittedIntent, saved, toggleSaved, tracked, toggleTracked, notes, setNote, history, addHistory, automations, addAutomation, toggleAutomation, profiles, activeProfileId, setActiveProfileId, addProfile, updateProfile, workItems, upsertWorkItem, batchJobs, addBatchJob, dismissedAttention, dismissAttention, goal, setGoal, followUps, upsertFollowUp }}>{children}</Context.Provider>;
}
export function useProspect() { const context = useContext(Context); if (!context) throw new Error("ProspectProvider is missing"); return context; }
