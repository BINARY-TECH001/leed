import { useState, type ChangeEvent } from "react";
import { DocumentUpload, Add, TickCircle, DocumentText } from "iconsax-react";
import { Button } from "@/components/ui/button";
import { initialProfiles, type Profile } from "./data";
import { useProspect } from "./store";
import { PageHeading } from "./ui";

const fields: { key: keyof Profile; label: string; multiline?: boolean }[] = [
  { key: "name", label: "Name" }, { key: "title", label: "Professional title" }, { key: "summary", label: "Summary", multiline: true },
  { key: "skills", label: "Skills & technical skills", multiline: true }, { key: "experience", label: "Experience, dates & achievements", multiline: true },
  { key: "education", label: "Education & certifications", multiline: true }, { key: "projects", label: "Projects", multiline: true },
  { key: "links", label: "Links" }, { key: "preferences", label: "Preferred roles, locations & compensation", multiline: true },
];
export function ProfilePage() {
  const { profiles, activeProfileId, setActiveProfileId, addProfile, updateProfile } = useProspect();
  const profile = profiles.find(p => p.id === activeProfileId) || profiles[0] || initialProfiles[0];
  const [draft, setDraft] = useState<Profile | null>(null);
  const [notice, setNotice] = useState("");
  const importFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]; if (!file) return;
    if (!/\.(pdf|doc|docx)$/i.test(file.name)) { setNotice("Choose a PDF, DOC or DOCX file."); return; }
    const template = initialProfiles[0];
    if (!template) return;
    addProfile({ ...template, id: crypto.randomUUID(), label: file.name.replace(/\.(pdf|docx?)$/i, "").replace(/[-_]/g, " "), fileName: file.name });
    setDraft(null);
    setNotice("Preview extraction ready. These sample details are not read from your file—review and replace them below.");
    event.target.value = "";
  };
  if (!profile) return null;
  const current: Profile = draft?.id === profile.id ? draft : profile;
  return <div className="page-container workspace-page"><PageHeading eyebrow="YOUR CONTEXT" title="Your profiles" description="Choose what ProspectAI should use to assess opportunities and prepare materials. You review every detail." />
    <div className="profile-intro"><DocumentText size="23" /><div><strong>Reusable context, not just a document</strong><p>Keep different versions for different goals. The selected profile is suggested when you prepare an application or outreach.</p></div></div>
    <div className="profile-toolbar"><div className="profile-tabs" role="group" aria-label="Profile versions">{profiles.map(p => <Button key={p.id} variant={p.id === profile.id ? "default" : "outline"} onClick={() => { setActiveProfileId(p.id); setDraft(null); setNotice(""); }}>{p.label}</Button>)}</div><Button variant="outline" onClick={() => { const { fileName: unused, ...version } = profile; void unused; addProfile({ ...version, id: crypto.randomUUID(), label: `${profile.label} copy` }); setDraft(null); }}><Add size="16" /> New version</Button></div>
    <label className="upload-zone"><DocumentUpload size="23" /><span><strong>Upload a CV to start a version</strong><small>PDF, DOC or DOCX · Local preview only. The file is not parsed or uploaded; sample fields appear for you to replace.</small></span><input type="file" accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={importFile} aria-label="Upload CV" /></label>
    {notice && <p className="profile-notice" role="status">{notice}</p>}
    <div className="profile-editor-head"><div><div className="eyebrow">SELECTED VERSION</div><h2>{profile.label}</h2><p>{profile.fileName ? `Based on ${profile.fileName} · ` : "Created in preview · "}All fields are editable.</p></div><span className="status-pill status-on"><TickCircle size="14" /> Used for new preparations</span></div>
    <div className="profile-fields"><label className="form-label">Version name<input value={current.label} onChange={e => setDraft({ ...current, label: e.target.value })} /></label>{fields.map(({ key, label, multiline }) => <label className="form-label" key={key}>{label}{multiline ? <textarea value={current[key] || ""} onChange={e => setDraft({ ...current, [key]: e.target.value })} /> : <input value={current[key] || ""} onChange={e => setDraft({ ...current, [key]: e.target.value })} />}</label>)}</div>
    <div className="profile-save"><span>Changes stay in this browser. No CV content is sent anywhere.</span><Button disabled={!draft || !current.label.trim()} onClick={() => { updateProfile(current); setDraft(null); setNotice("Profile updated for future preparations."); }}>Save profile</Button></div>
  </div>;
}