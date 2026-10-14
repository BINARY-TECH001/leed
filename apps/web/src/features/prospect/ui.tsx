import { Link, useRouterState } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { Add, ArrowLeft2, ArrowRight2, Bookmark, Briefcase, Calendar, Clock, Discover, DocumentText, Home2, HambergerMenu, Setting2, CloseCircle, ProfileCircle, Flash, SearchNormal, TickCircle, Notification } from "iconsax-react";
import { Button } from "@/components/ui/button";
import { opportunities, type Opportunity } from "./data";
import { ProspectProvider, useProspect } from "./store";

type Icon = typeof Discover;
const nav: { label: string; to: "/discover" | "/opportunities" | "/saved" | "/activity" | "/automations" | "/settings" | "/profile" | "/attention"; icon: Icon }[] = [
  { label: "Discover", to: "/discover", icon: Discover }, { label: "Opportunities", to: "/opportunities", icon: Briefcase },
  { label: "Attention", to: "/attention", icon: Notification }, { label: "Saved", to: "/saved", icon: Bookmark },
  { label: "Your profiles", to: "/profile", icon: ProfileCircle }, { label: "Activity", to: "/activity", icon: Clock },
  { label: "Automations", to: "/automations", icon: Flash },
];
export function AppShell({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const path = useRouterState({ select: s => s.location.pathname });
  return <ProspectProvider><div className="app-layout">
    <aside className={`sidebar ${mobileOpen ? "sidebar-open" : ""}`}>
      <div className="brand-row"><Link to="/discover" className="brand" onClick={() => setMobileOpen(false)}><span className="brand-mark"><span /></span><span>prospect<span className="brand-ai">ai</span></span></Link><Button variant="ghost" size="icon" className="mobile-close" aria-label="Close navigation" onClick={() => setMobileOpen(false)}><CloseCircle /></Button></div>
       <div className="sidebar-section-label">WORKSPACE</div>
      <nav aria-label="Main navigation" className="side-nav">{nav.map(item => <Link key={item.to} to={item.to} activeOptions={{ exact: true }} onClick={() => setMobileOpen(false)} className={`side-link ${path === item.to ? "side-link-active" : ""}`}><item.icon size="19" variant={path === item.to ? "Bold" : "Linear"} /><span>{item.label}</span>{item.to === "/saved" && <SavedCount />}</Link>)}</nav>
      <div className="sidebar-spacer" />
       <div className="sidebar-bottom"><Link to="/settings" onClick={() => setMobileOpen(false)} className={`side-link ${path === "/settings" ? "side-link-active" : ""}`}><Setting2 size="19" /> <span>Settings</span></Link><div className="account-row"><div className="avatar">AM</div><div><strong>Alex Morgan</strong><span>Personal workspace</span></div><ProfileCircle size="18" /></div></div>
    </aside>
    {mobileOpen && <div className="mobile-scrim" onClick={() => setMobileOpen(false)} />}
      <div className="main-region"><header className="topbar"><Button variant="ghost" size="icon" className="menu-trigger" aria-label="Open navigation" onClick={() => setMobileOpen(true)}><HambergerMenu /></Button><div className="breadcrumb"><span>Workspace</span><ArrowRight2 size="13" /><strong>{path.split("/")[1]?.replace(/^./, c => c.toUpperCase())}</strong></div><div className="topbar-right"><span className="demo-label"><span className="demo-dot" /> Interactive preview</span><Button asChild variant="ghost" size="icon" aria-label="Attention" title="Attention"><Link to="/attention"><Notification size="19" /></Link></Button><div className="avatar top-avatar">AM</div></div></header><main>{children}</main></div>
  </div></ProspectProvider>;
}
function SavedCount() { const { saved } = useProspect(); return saved.length > 0 ? <span className="nav-count">{saved.length}</span> : null; }
export function PageHeading({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description?: string; action?: ReactNode }) { return <div className="page-heading"><div>{eyebrow && <div className="eyebrow">{eyebrow}</div>}<h1>{title}</h1>{description && <p>{description}</p>}</div>{action && <div className="heading-action">{action}</div>}</div>; }
export function OpportunityRow({ opportunity: o }: { opportunity: Opportunity }) {
  const { saved, toggleSaved } = useProspect();
   return <article className="opportunity-row"><div className={`company-mark mark-${o.accent}`}>{o.organization.slice(0, 1)}</div><div className="opportunity-body"><div className="row-top"><span className="type-label">{o.type}</span><span className="row-separator">·</span><span className="muted">{o.posted}</span></div><Link to="/opportunities/$id" params={{ id: o.id }} className="opportunity-title">{o.title}</Link><div className="row-company">{o.organization}<span className="row-separator">·</span>{o.location}</div><div className="match-line"><TickCircle size="15" variant="Bold" />{o.match}</div><div className="row-tags">{o.tags.map(tag => <span key={tag}>{tag}</span>)}</div></div><div className="row-end"><strong>{o.value}</strong><div className="row-actions"><Button size="icon" variant="ghost" aria-label={saved.includes(o.id) ? `Remove ${o.title} from saved` : `Save ${o.title}`} title={saved.includes(o.id) ? "Remove from saved" : "Save opportunity"} onClick={() => toggleSaved(o.id)} className={saved.includes(o.id) ? "is-saved" : ""}><Bookmark size="19" variant={saved.includes(o.id) ? "Bold" : "Linear"} /></Button><Button size="icon" variant="ghost" asChild aria-label={`View ${o.title}`} title="View details"><Link to="/opportunities/$id" params={{ id: o.id }}><ArrowRight2 size="19" /></Link></Button></div></div></article>;
}
export function EmptyState({ icon: Icon, title, body, action }: { icon: Icon; title: string; body: string; action?: ReactNode }) { return <div className="empty-state"><div className="empty-icon"><Icon size="25" /></div><h2>{title}</h2><p>{body}</p>{action}</div>; }
export function SectionTitle({ title, link, to }: { title: string; link?: string; to?: "/opportunities" | "/saved" | "/activity" | "/automations" }) { return <div className="section-title"><h2>{title}</h2>{link && to && <Link to={to}>{link}<ArrowRight2 size="16" /></Link>}</div>; }
export function BackLink({ to = "/opportunities", children = "Back to opportunities" }: { to?: "/opportunities" | "/discover" | "/saved"; children?: ReactNode }) { return <Link to={to} className="back-link"><ArrowLeft2 size="17" />{children}</Link>; }
export function IconButtonLink({ to, children, icon: Icon }: { to: "/discover" | "/opportunities" | "/automations"; children: ReactNode; icon: Icon }) { return <Button asChild><Link to={to}><Icon size="17" />{children}</Link></Button>; }
export const uiIcons = { Add, Calendar, DocumentText, Home2, SearchNormal };
export { opportunities };
