export type OpportunityType = "Job" | "Freelance" | "Lead" | "Scholarship" | "Grant";
export type Opportunity = {
  id: string; type: OpportunityType; title: string; organization: string; location: string;
  value: string; posted: string; source: string; match: string; tags: string[];
  overview: string; requirements: string[]; nextStep: string; accent: string;
  sourceUrl?: string; sourcePage?: string; sourceType?: string; discovered?: string; missing?: string[];
};

export const opportunities: Opportunity[] = [
  { id: "linear", type: "Job", title: "Senior Frontend Engineer", organization: "Linear", location: "Remote · Americas / Europe", value: "$150k–$210k / year", posted: "2 days ago", source: "Company careers", match: "Strong fit for React, TypeScript and remote work", tags: ["React", "TypeScript", "Remote"], overview: "Help shape fast, thoughtful product experiences for teams building software. This role focuses on frontend architecture, performance, and design craft.", requirements: ["Strong React and TypeScript experience", "Comfortable owning complex product interfaces", "Overlap with US or European hours"], nextStep: "Review the original listing and prepare a tailored application.", accent: "linear" },
  { id: "vercel", type: "Job", title: "Frontend Engineer, Design Systems", organization: "Vercel", location: "Remote · Worldwide", value: "$130k–$190k / year", posted: "4 days ago", source: "Company careers", match: "Your Next.js background aligns with this team", tags: ["Next.js", "Design systems", "Remote"], overview: "Build the foundations behind polished developer experiences, from accessible components to shared interaction patterns.", requirements: ["Experience with Next.js and React", "A strong eye for detail and accessibility", "Experience collaborating with product designers"], nextStep: "Check location and compensation details on the source page.", accent: "vercel" },
  { id: "studio", type: "Freelance", title: "Website refresh for an independent studio", organization: "Northline Studio", location: "Remote · United Kingdom", value: "£4,000–£7,000 project", posted: "Today", source: "Public project brief", match: "A well-scoped website project that suits your skills", tags: ["Website", "Brand", "Contract"], overview: "A small creative studio is looking for a developer to turn a new visual identity into a fast, accessible website.", requirements: ["Portfolio of responsive sites", "Availability in the next 6 weeks", "Experience with a modern CMS"], nextStep: "Review the brief and prepare a personal introduction.", accent: "studio" },
  { id: "wellcome", type: "Grant", title: "Early-Career Research Awards", organization: "Wellcome", location: "United Kingdom · Eligible international applicants", value: "Funding varies", posted: "Closes 18 Nov", source: "Funding programme", match: "Open to researchers establishing an independent programme", tags: ["Research", "Funding", "International"], overview: "Flexible funding for early-career researchers ready to develop an ambitious independent research programme.", requirements: ["Eligible career stage", "Host organisation support", "Research proposal"], nextStep: "Check the full eligibility criteria and application window.", accent: "wellcome" },
  { id: "ucl", type: "Scholarship", title: "Global Masters Scholarship", organization: "UCL", location: "London, United Kingdom", value: "£15,000 award", posted: "Applications open", source: "University funding", match: "Designed for international postgraduate applicants", tags: ["Postgraduate", "International", "Study"], overview: "A needs-based award supporting international students undertaking full-time Master's study at UCL.", requirements: ["International fee status", "Application for eligible Master's degree", "Demonstrated financial need"], nextStep: "Verify the current deadline and eligibility on UCL's site.", accent: "ucl" },
  { id: "form", type: "Lead", title: "Potential website redesign", organization: "Fieldwork Coffee", location: "Manchester, United Kingdom", value: "Potential client", posted: "Recently found", source: "Public business website", match: "Their existing site could benefit from a clearer mobile experience", tags: ["Hospitality", "Website", "Outreach"], overview: "An independent coffee business with a growing online presence and an existing website that may be due for a refresh. This is a prospect, not a confirmed request for services.", requirements: ["Research the business before contacting", "Identify a specific way to add value", "Keep outreach personal and respectful"], nextStep: "Review their public website and decide whether outreach is appropriate.", accent: "fieldwork" },
];

export const sourceDetails: Record<string, { website: string; url: string; page: string; type: string; discovered: string; missing: string[] }> = {
  linear: { website: "Linear Careers", url: "https://linear.app/careers", page: "Engineering roles", type: "Company careers", discovered: "September 24, 2026", missing: ["Current application deadline", "Exact location eligibility"] },
  vercel: { website: "Vercel Careers", url: "https://vercel.com/careers", page: "Open positions", type: "Company careers", discovered: "September 22, 2026", missing: ["Current salary band", "Hiring region"] },
  studio: { website: "Northline Studio", url: "https://northline.studio", page: "Studio website", type: "Public business website", discovered: "September 26, 2026", missing: ["Decision-maker contact", "Whether a project is currently open"] },
  wellcome: { website: "Wellcome Funding", url: "https://wellcome.org/grant-funding", page: "Funding opportunities", type: "Funding programme", discovered: "September 20, 2026", missing: ["Current round deadline"] },
  ucl: { website: "UCL Scholarships", url: "https://www.ucl.ac.uk/scholarships", page: "Scholarship finder", type: "University funding", discovered: "September 23, 2026", missing: ["Current application deadline"] },
  form: { website: "Fieldwork Coffee", url: "https://fieldworkcoffee.com", page: "Business website", type: "Public business website", discovered: "September 25, 2026", missing: ["Verified contact address", "Confirmation they want services"] },
};

export type Profile = { id: string; label: string; name: string; title: string; summary: string; skills: string; experience: string; education: string; projects: string; links: string; preferences: string; fileName?: string };
export const initialProfiles: Profile[] = [
  { id: "frontend", label: "Frontend Engineer", name: "Alex Morgan", title: "Senior Frontend Engineer", summary: "Product-minded engineer focused on accessible, high-performance web experiences.", skills: "React, TypeScript, Next.js, design systems, accessibility", experience: "Senior Frontend Engineer · Northstar Digital · 2022–present\nBuilt a shared component system and improved core web performance.\nFrontend Engineer · Studio Parallel · 2019–2022\nDelivered responsive interfaces with design and product teams.", education: "BSc Computer Science · University of Manchester · 2019", projects: "Open-source accessible UI toolkit; commerce storefront redesign", links: "portfolio.example · github.com/alexmorgan", preferences: "Remote roles · Europe/US overlap · $150k+", fileName: "Alex-Morgan-Frontend.pdf" },
  { id: "product", label: "Product & startup", name: "Alex Morgan", title: "Product Engineer", summary: "Engineer working across product strategy, design systems and delivery for small teams.", skills: "Product development, React, TypeScript, prototyping, accessibility", experience: "Senior Frontend Engineer · Northstar Digital · 2022–present\nLed cross-functional launches and product interface delivery.", education: "BSc Computer Science · University of Manchester · 2019", projects: "Independent product prototypes; open-source UI toolkit", links: "portfolio.example", preferences: "Early-stage teams · Remote", fileName: "Alex-Morgan-Product.docx" },
];

export const sampleAttention = [
  { id: "review-linear", title: "Application materials ready for review", detail: "Senior Frontend Engineer · Linear", kind: "Approval", opportunityId: "linear", when: "Today" },
  { id: "reply-studio", title: "A possible client response needs you", detail: "Northline Studio · Sample conversation", kind: "Reply preview", opportunityId: "studio", when: "Yesterday" },
  { id: "missing-form", title: "Contact details need verification", detail: "Fieldwork Coffee · Outreach cannot be queued", kind: "Missing information", opportunityId: "form", when: "Yesterday" },
];

// Deterministic, local-only matching for the preview; no search service or AI is called.
export function matchesIntent(opportunity: Opportunity, intent: string) {
  const query = intent.toLowerCase().trim();
  if (!query) return true;
  const groups: { terms: string[]; types: OpportunityType[] }[] = [
    { terms: ["job", "role", "career", "engineer", "frontend", "react", "next.js", "developer", "internship"], types: ["Job"] },
    { terms: ["freelance", "contract", "project", "studio"], types: ["Freelance"] },
    { terms: ["client", "lead", "business", "outreach", "website"], types: ["Lead", "Freelance"] },
    { terms: ["scholarship", "student", "master", "postgraduate", "study"], types: ["Scholarship"] },
    { terms: ["grant", "research", "funding", "award"], types: ["Grant", "Scholarship"] },
  ];
  const types = new Set(groups.filter(group => group.terms.some(term => query.includes(term))).flatMap(group => group.types));
  return types.has(opportunity.type);
}

export const examplePrompts = [
  "Find remote frontend roles using React and Next.js",
  "Find UK businesses that might need a better website",
  "Find scholarships for international master's students",
];

export const initialHistory = [
  { id: "h1", title: "Remote frontend roles using React and Next.js", date: "Today", count: 2, type: "Jobs" },
  { id: "h2", title: "UK studios looking for website developers", date: "Yesterday", count: 4, type: "Freelance" },
  { id: "h3", title: "Funding for international postgraduate study", date: "Earlier", count: 2, type: "Scholarships" },
];
