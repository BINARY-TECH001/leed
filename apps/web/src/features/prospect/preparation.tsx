import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { CloseCircle, Export, Global, TickCircle } from "iconsax-react";
import { Button } from "@/components/ui/button";
import { opportunities, sourceDetails, type Opportunity } from "./data";
import { useProspect, type WorkItem } from "./store";

export function SourceSection({ opportunity: o }: { opportunity: Opportunity }) {
  const source = sourceDetails[o.id];
  if (!source) return null;
  return <section className="detail-section"><h2>Example source</h2><p>{source.website} · {source.type} · sample discovery date {source.discovered}</p><div className="source-line"><span>{source.page}</span><a href={source.url} target="_blank" rel="noopener noreferrer">Visit website <Global size="16" /></a></div><small className="muted">This is a sample opportunity. The link goes to a general website, not a verified original listing. Check independently before acting.</small></section>;
}

export function PreparationDialog({ opportunity: o, onClose }: { opportunity: Opportunity; onClose: () => void }) {
  const { profiles, activeProfileId, workItems, upsertWorkItem, tracked, toggleTracked } = useProspect();
  const existing = workItems.find(item => item.opportunityId === o.id);
  const type = o.type === "Lead" || o.type === "Freelance" ? "outreach" : "application";
  const [profileId, setProfileId] = useState(existing?.profileId || activeProfileId);
  const [subject, setSubject] = useState(existing?.subject || (type === "outreach" ? `A thought about ${o.organization}` : `Interest in ${o.title}`));
  const [message, setMessage] = useState(existing?.message || (type === "outreach" ? `Hello ${o.organization} team,\n\nI came across your work and wanted to introduce myself. My background includes ${profiles.find(p => p.id === profileId)?.skills || "product development"}. I'd welcome a conversation if there's a useful way to collaborate.\n\nBest,\nAlex` : `Hello ${o.organization} team,\n\nI'm interested in the ${o.title} opportunity. My experience in ${profiles.find(p => p.id === profileId)?.skills || "product development"} aligns with the role. I'd be glad to share more about my work.\n\nBest,\nAlex`));
  const [status, setStatus] = useState<WorkItem["status"]>(existing?.status || "Draft");
  const [savedNow, setSavedNow] = useState(false);
  const source = sourceDetails[o.id];
  useEffect(() => { const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); }; window.addEventListener("keydown", onKey); return () => window.removeEventListener("keydown", onKey); }, [onClose]);
  const save = (next: WorkItem["status"]) => { upsertWorkItem({ id: existing?.id || crypto.randomUUID(), opportunityId: o.id, type, status: next, profileId, subject, message, created: "Just now" }); if (!tracked.includes(o.id)) toggleTracked(o.id); setStatus(next); setSavedNow(true); };
  return <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}><div className="action-dialog preparation-dialog" role="dialog" aria-modal="true" aria-label={`Prepare ${type}`}><Button variant="ghost" size="icon" className="dialog-close" aria-label="Close dialog" onClick={onClose}><CloseCircle /></Button><div className="eyebrow">{type === "outreach" ? "OUTREACH" : "APPLICATION"} · {status.toUpperCase()}</div><h2>Prepare for {o.organization}</h2><p>Review each field. This is a local draft; it cannot be sent or submitted.</p>
    <div className="prep-summary"><strong>{o.title}</strong><span>{o.type} · {source?.website || o.source}</span></div>
    <div className="prep-grid"><label className="form-label">Profile / CV<select value={profileId} onChange={e => setProfileId(e.target.value)}>{profiles.map(p => <option value={p.id} key={p.id}>{p.label}{p.fileName ? ` · ${p.fileName}` : ""}</option>)}</select></label><label className="form-label">Recipient / destination<input value={type === "outreach" ? "Not verified — add before sending" : "Original listing — verify on source"} readOnly /></label></div>
    <div className="prep-evidence"><strong>Why this profile</strong><span>{o.match}. Review requirements: {o.requirements.join(" · ")}</span><Link to="/profile" onClick={onClose}>Edit profile</Link></div>
    <label className="form-label">{type === "outreach" ? "Email subject" : "Application subject"}<input value={subject} onChange={e => { setSubject(e.target.value); setSavedNow(false); }} /></label><label className="form-label">{type === "outreach" ? "Message" : "Cover note"}<textarea value={message} onChange={e => { setMessage(e.target.value); setSavedNow(false); }} rows={8} /></label>
    <div className="prep-evidence"><strong>Before any future action</strong><span>{type === "outreach" ? "Confirm the recipient, consent and contact context. No email account is connected." : "Verify the listing, attach the right CV and answer any application questions on the original site."}</span></div>
    {savedNow && <p className="profile-notice" role="status"><TickCircle size="16" /> {status} in your local preview. Nothing sent.</p>}
    <div className="dialog-actions"><Button variant="outline" onClick={onClose}>Close</Button><Button variant="outline" disabled={!subject.trim() || !message.trim()} onClick={() => save("Draft")}>Save draft</Button><Button disabled={!subject.trim() || !message.trim()} onClick={() => save("Ready for review")}>Mark ready for review</Button></div>
  </div></div>;
}

export function ExportDialog({ ids, onClose }: { ids: string[]; onClose: () => void }) {
  const [format, setFormat] = useState<"CSV" | "JSON" | "XLSX">("CSV");
  const allFields = ["Title", "Organization", "Type", "Location", "Value", "Source", "Source URL", "Status", "Notes"];
  const [fields, setFields] = useState(["Title", "Organization", "Type", "Location", "Source URL"]);
  const [done, setDone] = useState(false);
  const [preset, setPreset] = useState<string[]>([]);
  const { notes, tracked } = useProspect();
  const rows = ids.map(id => ({ id, opportunity: opportunities.find(o => o.id === id) })).filter(row => row.opportunity);
  const values = (id: string, o: Opportunity): Record<string, string> => ({ Title: o.title, Organization: o.organization, Type: o.type, Location: o.location, Value: o.value, Source: sourceDetails[id]?.website || o.source, "Source URL": sourceDetails[id]?.url || "", Status: tracked.includes(id) ? "Tracking" : "New", Notes: notes[id] || "" });
  const download = () => {
    const records = rows.map(({ id, opportunity }) => values(id, opportunity as Opportunity));
    const csvCell = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const content = format === "JSON" ? JSON.stringify(records.map(r => Object.fromEntries(fields.map(f => [f, r[f] || ""]))), null, 2) : [fields.map(csvCell).join(","), ...records.map(r => fields.map(f => csvCell(r[f] || "")).join(","))].join("\r\n");
    const blob = new Blob([content], { type: format === "JSON" ? "application/json" : "text/csv" }); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = `prospectai-selection.${format === "JSON" ? "json" : "csv"}`; a.click(); URL.revokeObjectURL(url); setDone(true);
  };
  return <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}><div className="action-dialog export-dialog" role="dialog" aria-modal="true" aria-label="Export opportunities"><Button variant="ghost" size="icon" className="dialog-close" aria-label="Close dialog" onClick={onClose}><CloseCircle /></Button><div className="eyebrow"><Export size="16" /> EXPORT</div><h2>Export {ids.length} selected {ids.length === 1 ? "opportunity" : "opportunities"}</h2><p>Choose only the information you need. Your current selection is the export scope.</p><div className="prep-grid"><label className="form-label">Format<select value={format} onChange={e => setFormat(e.target.value as typeof format)}><option>CSV</option><option>JSON</option><option value="XLSX" disabled>XLSX · not available in preview</option></select></label><div className="form-label">Field preset<Button variant="outline" onClick={() => setFields(preset.length ? preset : ["Title", "Organization", "Type", "Location", "Source URL"])}>Use saved fields</Button></div></div><div className="export-fields"><strong>Fields · select in column order</strong><div>{allFields.map(field => <label key={field}><input type="checkbox" checked={fields.includes(field)} onChange={() => setFields(v => v.includes(field) ? v.filter(f => f !== field) : [...v, field])} />{field}</label>)}</div></div><Button variant="ghost" size="sm" onClick={() => setPreset(fields)}>Save field preset</Button><div className="export-preview"><strong>Preview</strong><div className="export-preview-scroll"><table><thead><tr>{fields.map(f => <th key={f}>{f}</th>)}</tr></thead><tbody>{rows.slice(0, 2).map(({ id, opportunity }) => <tr key={id}>{fields.map(f => <td key={f}>{values(id, opportunity as Opportunity)[f] || "—"}</td>)}</tr>)}</tbody></table></div></div>{done && <p role="status" className="profile-notice">Your file was downloaded locally.</p>}<div className="dialog-actions"><Button variant="outline" onClick={onClose}>Close</Button><Button disabled={!fields.length} onClick={download}>Download {format}</Button></div></div></div>;
}
