import { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowRight2,
  CloseCircle,
  DocumentText,
  Flash,
  InfoCircle,
  TickCircle,
} from "iconsax-react";
import { Button } from "@/components/ui/button";
import { useProspect } from "./store";
import { PageHeading } from "./ui";

const connections = [
  {
    name: "Gmail",
    category: "Email",
    purpose: "Identify opportunity-related replies and prepare reviewed messages.",
    permissions: "Read relevant reply context; request separate permission before sending.",
  },
  {
    name: "Outlook",
    category: "Email",
    purpose: "Bring application and client replies into Attention.",
    permissions: "Read relevant reply context; request separate permission before sending.",
  },
  {
    name: "Google Calendar",
    category: "Calendar",
    purpose: "Suggest interview and follow-up times.",
    permissions: "Read availability; ask before creating an event.",
  },
  {
    name: "Notion",
    category: "Productivity",
    purpose: "Keep selected opportunities alongside your notes.",
    permissions: "Access only the pages you choose to share.",
  },
  {
    name: "Google Drive",
    category: "Storage",
    purpose: "Choose a CV for a preparation.",
    permissions: "Access selected files, not your entire drive.",
  },
  {
    name: "Slack",
    category: "Communication",
    purpose: "Bring important updates to a selected workspace.",
    permissions: "Choose a workspace and channel before any future message.",
  },
  {
    name: "WhatsApp",
    category: "Messaging",
    purpose: "Choose a future attention channel.",
    permissions: "Ask for explicit consent before any messaging.",
  },
  {
    name: "Telegram",
    category: "Messaging",
    purpose: "Choose a future attention channel.",
    permissions: "Ask for explicit consent before any messaging.",
  },
];
export function SettingsPage() {
  const { goal, setGoal, history, workItems, automations } = useProspect();
  const [region, setRegion] = useState(goal?.location || "Worldwide");
  const [saved, setSaved] = useState(false);
  const [connection, setConnection] = useState<(typeof connections)[number] | null>(null);
  const [channel, setChannel] = useState("In-app preview");
  return (
    <div className="page-container settings-page">
      <PageHeading
        eyebrow="CONTROL & CONTEXT"
        title="Settings"
        description="Inspect what this preview remembers and what any future connection would require."
      />
      <div className="settings-section">
        <div>
          <h2>Your direction</h2>
          <p>Keep the goal and context you want to work from.</p>
        </div>
        <div className="settings-fields">
          <div className="setting-static">
            <span>Current goal</span>
            <strong>{goal?.goal || "Not set yet"}</strong>
          </div>
          <label className="form-label">
            Preferred location
            <select
              value={region}
              onChange={(e) => {
                setRegion(e.target.value);
                setSaved(false);
              }}
            >
              <option>Worldwide</option>
              <option>Remote or flexible</option>
              <option>Remote only</option>
              <option>United Kingdom</option>
              <option>Europe</option>
              <option>United States</option>
            </select>
          </label>
          <Button variant="outline" asChild>
            <Link to="/profile">
              Review profile and CV versions <ArrowRight2 size="16" />
            </Link>
          </Button>
          <div className="settings-inline">
            <Button
              size="sm"
              onClick={() => {
                setGoal({
                  goal: goal?.goal || "",
                  type: goal?.type || "Still exploring",
                  location: region,
                });
                setSaved(true);
              }}
            >
              Save preference
            </Button>
            {saved && <span role="status">Saved in this browser.</span>}
          </div>
        </div>
      </div>
      <div className="settings-section">
        <div>
          <h2>What this preview remembers</h2>
          <p>
            You can revisit searches, preparations and selected profiles. No AI has learned from
            them.
          </p>
        </div>
        <div className="settings-fields">
          <div className="setting-static">
            <span>Recent discoveries</span>
            <strong>{history.length} sample searches</strong>
          </div>
          <div className="setting-static">
            <span>Prepared work</span>
            <strong>{workItems.length} local drafts</strong>
          </div>
          <div className="setting-static">
            <span>Saved plans</span>
            <strong>{automations.length} automation previews</strong>
          </div>
          <p className="settings-help">
            Use <Link to="/activity">Activity</Link> to see this work. Uploaded CV files are not
            read or retained. Clear local preview data with your browser’s site-data controls.
          </p>
        </div>
      </div>
      <div className="settings-section">
        <div>
          <h2>Connections & Channels</h2>
          <p>
            Connect your preferred channels to receive verified opportunity alerts and take action
            without keeping Leed open.
          </p>
        </div>
        <div className="settings-fields">
          <div className="connection-catalog">
            <div className="connection-option">
              <div>
                <span className="small-label">100% Free Messaging</span>
                <strong>Telegram Bot</strong>
                <small>Instant alerts with interactive action buttons (Apply, Save, Details)</small>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  setConnection({
                    name: "Telegram Bot",
                    category: "Messaging",
                    purpose:
                      "Receive verified opportunity alerts and reply with inline actions directly on Telegram.",
                    permissions:
                      "Deliver matched alerts; handle interactive button clicks; no user phone number shared.",
                  })
                }
              >
                Manage channel
              </Button>
            </div>
            <div className="connection-option">
              <div>
                <span className="small-label">Personal Agent</span>
                <strong>WhatsApp Agent</strong>
                <small>
                  Meta Cloud API conversational agent with verified application preparation
                </small>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  setConnection({
                    name: "WhatsApp Agent",
                    category: "Messaging",
                    purpose:
                      "Two-step verified personal agent on WhatsApp with natural-language instructions.",
                    permissions:
                      "Deliver verified matches; process conversational instructions; operator monthly budget guardrails.",
                  })
                }
              >
                Manage channel
              </Button>
            </div>
            <div className="connection-option">
              <div>
                <span className="small-label">Transactional Email</span>
                <strong>Email Notifications</strong>
                <small>Resend free-tier briefings and weekly curated digests</small>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  setConnection({
                    name: "Email Notifications",
                    category: "Email",
                    purpose:
                      "Receive comprehensive opportunity briefings and weekly summary digests.",
                    permissions:
                      "Deliver match summaries; transaction receipts; manage frequency & unsubscribe.",
                  })
                }
              >
                Manage channel
              </Button>
            </div>
            <div className="connection-option">
              <div>
                <span className="small-label">100% Free Push</span>
                <strong>Push Alerts</strong>
                <small>Lock-screen alerts for iOS, Android, and web browser</small>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  setConnection({
                    name: "Push Alerts",
                    category: "Push Alerts",
                    purpose: "Real-time background notifications without opening the application.",
                    permissions:
                      "Display notifications; update app badge; deep-link into verified opportunities.",
                  })
                }
              >
                Manage channel
              </Button>
            </div>
          </div>
          <p className="settings-help">
            All external channels use Leed’s unified opportunity records. Platform API keys are
            securely stored server-side.
          </p>
        </div>
      </div>
      <div className="settings-section">
        <div>
          <h2>Zero-cost launch strategy</h2>
          <p>Leed is completely free for users during initial launch.</p>
        </div>
        <div className="settings-fields">
          <div className="credit-preview">
            <TickCircle size="20" color="#10B981" />
            <div>
              <strong>100% Free for Users · Zero Paywalls</strong>
              <p>
                There are no subscriptions, mandatory payment methods, or credit fees. All search,
                verification, and notification capabilities are available without charge. Provider
                operating costs are managed with strict operator budget caps and automatic free-tier
                fallbacks.
              </p>
            </div>
          </div>
          <div className="setting-static">
            <span>User fee</span>
            <strong>$0.00 / Free forever</strong>
          </div>
          <div className="setting-static">
            <span>Cost guardrails</span>
            <strong>Operator monthly budget protection active</strong>
          </div>
          <p className="settings-help">
            If paid provider budgets (such as WhatsApp) are reached, Leed automatically routes
            alerts through free channels like Telegram, Email, and Push.
          </p>
        </div>
      </div>
      <div className="settings-section">
        <div>
          <h2>Action permissions</h2>
          <p>You remain the final reviewer.</p>
        </div>
        <div className="settings-fields">
          <div className="setting-static">
            <span>Prepare drafts</span>
            <strong>Level 1: Tailored pitches & cover letters</strong>
          </div>
          <div className="setting-static">
            <span>Assisted flows</span>
            <strong>Level 2: Step-by-step guidance</strong>
          </div>
          <div className="setting-static">
            <span>Submit applications</span>
            <strong>Level 3: Verified native integrations only</strong>
          </div>
        </div>
      </div>
      {connection && (
        <div
          className="modal-backdrop"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setConnection(null);
          }}
        >
          <div
            className="action-dialog"
            role="dialog"
            aria-modal="true"
            aria-label={`${connection.name} channel overview`}
          >
            <Button
              variant="ghost"
              size="icon"
              className="dialog-close"
              aria-label="Close dialog"
              onClick={() => setConnection(null)}
            >
              <CloseCircle />
            </Button>
            <div className="dialog-icon">
              <DocumentText size="22" />
            </div>
            <h2>{connection.name} · Channel Details</h2>
            <p>{connection.purpose}</p>
            <div className="prep-evidence">
              <strong>What connecting enables</strong>
              <span>{connection.permissions}</span>
            </div>
            <div className="prep-evidence">
              <strong>Cost to you</strong>
              <span>100% Free. No subscription or credits required.</span>
            </div>
            <div className="dialog-actions">
              <Button variant="outline" onClick={() => setConnection(null)}>
                Close
              </Button>
              <Button
                variant="default"
                onClick={() => {
                  alert(`Channel test notification queued for ${connection.name}`);
                  setConnection(null);
                }}
              >
                <Flash size="15" /> Send test alert
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
