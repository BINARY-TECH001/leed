# Opportunity Compass

You are a Principal Product Designer, Senior UX Engineer, and Staff Frontend Engineer.

Your task is to design and implement the COMPLETE UI/UX FLOW for ProspectAI's web application.

IMPORTANT:
This task is UI/UX ONLY.

Do NOT build backend integrations.
Do NOT connect APIs.
Do NOT implement real AI.
Do NOT implement real scraping.
Do NOT implement real authentication.
Do NOT implement real payments.
Do NOT implement real email sending.
Do NOT implement real job applications.
Do NOT connect external services.

Use realistic local/mock data wherever necessary so the entire experience can be explored and tested.

I am intentionally NOT giving you a predefined screen-by-screen flow.

You are responsible for determining the best information architecture, navigation, interaction model, screen hierarchy, and user journey based on the product vision below.

Think like a senior product designer building a product that could compete with modern products from companies such as Perplexity, Linear, Notion, Stripe, Airbnb, Google, and other high-quality software companies.

Do not simply create a generic SaaS dashboard.

==================================================
PRODUCT
==================================================

Product name: ProspectAI

ProspectAI is evolving beyond a traditional lead scraper.

It is an AI-powered opportunity discovery platform.

The user should be able to tell ProspectAI what they are looking for, and ProspectAI should help discover relevant opportunities.

These opportunities could include:

- Jobs
- Freelance work
- Business leads
- Potential clients
- Scholarships
- Grants
- Competitions
- Internships
- Contracts
- Business opportunities
- Other relevant opportunities

The long-term product concept is:

USER INTENT → AI UNDERSTANDING → DISCOVERY → OPPORTUNITIES → ACTION → TRACKING

The product should feel like an intelligent opportunity agent rather than a database or scraping tool.

The user should not need to understand how the system searches the internet.

The complexity should live behind the product.

The user expresses what they want in natural language and ProspectAI handles the complexity.

==================================================
DESIGN RESPONSIBILITY
==================================================

Do NOT blindly follow conventional SaaS patterns.

You have freedom to determine:

- Information architecture
- Navigation
- Page hierarchy
- Interaction patterns
- Component structure
- User journey
- Empty states
- Loading states
- Search experience
- AI interaction model
- Opportunity presentation
- Automation experience
- Profile/preferences experience
- Action flows
- Responsive behavior

Use your own product design judgment.

Before implementing anything, think deeply about:

1. What is the simplest mental model for ProspectAI?
2. What does a first-time user need to understand immediately?
3. What should be visible versus hidden?
4. Where should AI be used?
5. Which interactions should be conversational?
6. Which interactions should be direct manipulation?
7. How can the product avoid overwhelming users?
8. How can users move from discovery to action naturally?
9. How can the experience remain understandable as the product becomes more powerful?

Do not create unnecessary screens merely because typical SaaS applications have them.

Every screen and interaction must have a clear reason to exist.

==================================================
CORE UX PRINCIPLE
==================================================

The user should feel:

"I tell ProspectAI what I want, and it helps me find and act on it."

NOT:

"I have to configure a complicated scraping system."

The product should progressively reveal complexity only when necessary.

==================================================
VISUAL DIRECTION
==================================================

Primary brand colors:

Navy:
#14213D

Orange:
#FF6600

Use these colors intelligently.

Do not force both colors into every component.

The interface should primarily feel clean, calm, premium, modern and trustworthy.

Use neutral surfaces extensively.

Avoid visual noise.

NO gradients.

Do not use:

- Gradient backgrounds
- Gradient buttons
- Gradient text
- Neon effects
- Purple AI aesthetics
- Excessive glassmorphism
- Excessive shadows
- Excessive rounded cards
- Huge decorative illustrations
- Generic AI dashboard aesthetics
- Overly colorful interfaces

Orange should primarily communicate:

- Primary actions
- Active states
- Important interaction points
- Selected states
- AI-related emphasis where appropriate

Navy should communicate:

- Brand
- Structure
- Strong typography
- Important navigation elements

==================================================
TYPOGRAPHY
==================================================

Do NOT default to Arial, Inter, Roboto or system fonts simply because they are convenient.

Select a modern, highly readable professional typeface that gives the product a distinctive premium identity.

Evaluate typography based on:

- Readability
- Hierarchy
- Numbers
- Dense information
- AI conversations
- Tables/lists
- Mobile responsiveness
- Accessibility

Use a disciplined typography system.

Avoid excessive font weights and oversized text.

==================================================
ICONOGRAPHY
==================================================

Use Iconsax consistently throughout the application.

Do not mix random icon libraries.

Icons should be meaningful and restrained.

Do not use icons merely for decoration.

==================================================
APPLICATION EXPERIENCE
==================================================

Design the complete authenticated product experience.

The application should accommodate the broader ProspectAI concept including:

- AI discovery
- Opportunities
- Search/discovery history
- Saved opportunities
- Opportunity details
- User preferences/profile
- Automations
- Actions
- Activity
- Settings
- Account management
- Any other supporting experiences you determine are genuinely necessary

You decide the exact information architecture.

Do not assume that every feature needs its own prominent page.

Combine experiences where that produces a better product.

==================================================
AI EXPERIENCE
==================================================

AI is a fundamental part of ProspectAI.

The AI experience should NOT simply look like a generic ChatGPT clone.

Design a purpose-built AI interaction model for opportunity discovery.

The user should be able to express complex requests naturally.

For example:

"Find remote frontend engineering jobs using React, React Native and Next.js. I want international opportunities and preferably something above $2,000/month."

Or:

"Find companies in the UK that might need a new website."

Or:

"Find fully funded scholarships that I could apply for."

The interface should make it easy to:

- Express intent
- Refine intent
- Understand what ProspectAI understood
- Adjust requirements
- Start discovery
- Review discovered opportunities
- Continue the conversation when necessary
- Take appropriate next actions

Use progressive disclosure.

Do not expose unnecessary technical concepts such as scraping configuration, selectors, crawling infrastructure, etc.

==================================================
VOICE
==================================================

Where appropriate, support a premium voice interaction concept in the UI.

The interface should account for:

- Microphone interaction
- Recording
- Listening
- Live transcription
- Editing transcription
- Cancelling
- Submitting
- Permission/error states

The UI should feel polished and intentional.

Do not create cheap-looking equalizer animations.

If voice is represented with mock functionality, make the interaction believable without pretending that real speech recognition is connected.

==================================================
OPPORTUNITIES
==================================================

Design a flexible opportunity presentation system that can accommodate different opportunity types.

A job is different from a business lead.

A scholarship is different from a freelance contract.

Do not force every opportunity into exactly the same visual structure if that hurts usability.

At the same time, establish a consistent visual language across opportunity types.

The user should easily understand:

- What the opportunity is
- Who/what it is from
- Why it may be relevant
- Important requirements
- Location/remote status where relevant
- Compensation/deadline where relevant
- Source
- Status
- Available next actions

Do not overwhelm the user with metadata.

Prioritize information based on context.

==================================================
AUTOMATIONS
==================================================

ProspectAI should eventually support recurring discovery workflows.

Examples:

"Find new remote React jobs every morning."

"Find new scholarships every Monday."

"Find potential web-development clients every week."

Design the UI architecture for this concept.

However, do not overcomplicate the experience.

Automation should feel like something a normal user can understand.

The UI should clearly communicate:

- What will happen
- When it happens
- What it looks for
- What happens with the results
- Whether user approval is required

Do not implement real automation.

Use mock state only.

==================================================
ACTIONS
==================================================

ProspectAI may eventually help users take actions based on discovered opportunities.

Examples could include:

- Save
- Prepare an application
- Prepare outreach
- Export
- Open source
- Add notes
- Track opportunity
- Draft communication
- Other contextual actions

Design these experiences carefully.

Do not assume every action should happen automatically.

The user should always understand what is about to happen.

Use confirmation/review patterns where appropriate.

==================================================
RESPONSIVE DESIGN
==================================================

The web application must work exceptionally well across:

- Large desktop
- Laptop
- Tablet
- Small desktop windows

Do not simply shrink the desktop interface.

Design responsive behavior intentionally.

Complex experiences should adapt rather than become unusable.

Use appropriate:

- Panels
- Drawers
- Modals
- Popovers
- Sheets
- Contextual navigation
- Responsive tables/lists

where they improve usability.

==================================================
MOCK DATA
==================================================

Use realistic mock data.

Do not use:

"Lorem ipsum"
"Test Lead 123"
"Example Company"
"John Doe"

Create believable sample opportunities and realistic content.

However:

DO NOT fabricate real company partnerships, users, testimonials, statistics, or social proof.

Clearly keep mock/demo content within the product prototype.

==================================================
STATES
==================================================

Every important experience should account for:

- Initial state
- Empty state
- Loading state
- Searching/discovering state
- Success state
- Error state
- No-results state
- Partial-results state
- Selected state
- Saved state
- Disabled state
- Confirmation state
- Mobile state

Do not use fake progress bars that imply real backend activity.

The UI should communicate state without pretending integrations exist.

==================================================
MOTION
==================================================

Use motion purposefully.

Use subtle transitions for:

- Navigation
- AI interactions
- Panels
- Search/discovery transitions
- Saving
- Selection
- Sheets
- Contextual actions

Avoid excessive animation.

Do not make the product feel like a Dribbble concept.

Motion should improve understanding.

==================================================
ACCESSIBILITY
==================================================

Build with accessibility in mind:

- Keyboard navigation
- Focus states
- Semantic HTML
- Proper labels
- Contrast
- Screen-reader-friendly interactions
- Accessible dialogs
- Accessible forms
- Reduced-motion considerations

Target WCAG AA.

==================================================
TECHNICAL UI IMPLEMENTATION
==================================================

Use:

- Next.js
- TypeScript
- TailwindCSS
- shadcn/ui where useful
- Framer Motion where useful
- Iconsax
- Local/mock data only

Use modern Next.js App Router architecture.

Keep components modular.

Do not create one giant component.

Do not make the entire application unnecessarily client-side.

Separate:

- UI components
- Feature components
- Mock data
- Types
- Utilities
- State
- Layouts

The code should be easy to replace with real APIs later.

==================================================
IMPORTANT: DO NOT BUILD INTEGRATIONS
==================================================

Everything should be UI/mock behavior.

No:

- Backend
- Database
- API
- Scraper
- Google Maps API
- OpenAI/Gemini API
- Authentication provider
- Email provider
- Payment provider
- External job APIs
- Real web crawling
- Real automation

Create clean interfaces so integrations can be added later.

==================================================
QUALITY BAR
==================================================

The final result should feel like a serious production product prototype.

Not:

"AI-generated SaaS template."

It should feel:

- Premium
- Simple
- Intelligent
- Fast
- Calm
- Modern
- Trustworthy
- Easy to understand
- AI-native
- Human-centered

A first-time user should be able to open the application and understand what ProspectAI does without reading a manual.

Do not overload the interface with explanatory text.

Prefer excellent hierarchy and interaction design over excessive copy.

==================================================
YOUR PROCESS
==================================================

Before writing the UI:

1. Understand the product deeply.
2. Define the mental model.
3. Determine the information architecture.
4. Determine the optimal user journeys.
5. Identify unnecessary complexity.
6. Design the system.
7. Then implement it.

Do not ask me to define every screen.

I am intentionally giving you design ownership.

Make the strongest UX decisions you can based on the product vision.

Build the complete UI flow from first visit through the authenticated product experience using mock data.

At the end, the application should feel like a coherent product, not a collection of disconnected screens.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/0d30b18c-77bc-4291-9cde-b61b85a883fb).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
