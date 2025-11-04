# SkillSync AI - Design Guidelines

## Design Approach

**Hybrid Strategy**: Reference-based for marketing + System-based for dashboards

**Primary References**:
- **Marketing Site**: Stripe (restraint + clarity), Linear (bold typography), Airbnb (trust signals)
- **Job-Seeker Dashboard**: LinkedIn (familiarity), Wellfound (modern job browsing)
- **Employer Dashboard**: Linear (efficiency), Notion (information density), Greenhouse (ATS patterns)
- **Admin Dashboard**: Stripe Dashboard (data clarity), Retool (enterprise tools)

**Core Principles**:
1. Professional credibility through restrained elegance
2. Clear information hierarchy for data-heavy views
3. Distinctive visual identity that differentiates from competitors
4. Consistent patterns across three dashboards while respecting role contexts

---

## Typography System

**Font Stack**:
- **Primary**: Inter (headings, UI, body) - professional, excellent at all sizes
- **Accent**: Space Grotesk (marketing headlines only) - distinctive, modern
- **Monospace**: JetBrains Mono (code snippets, technical data)

**Scale & Hierarchy**:
```
Marketing Headlines: text-5xl to text-7xl, font-bold, Space Grotesk
Dashboard Headers: text-3xl to text-4xl, font-semibold, Inter
Section Titles: text-2xl, font-semibold
Card Headers: text-lg, font-medium
Body Text: text-base, font-normal
Small/Meta: text-sm, text-gray-600
Micro/Labels: text-xs, font-medium, uppercase, tracking-wide
```

**Line Heights**:
- Headlines: leading-tight (1.1)
- Titles: leading-snug (1.25)
- Body: leading-relaxed (1.625)

---

## Layout & Spacing System

**Tailwind Spacing Primitives**: Use 2, 4, 6, 8, 12, 16, 20, 24 units consistently

**Component Spacing**:
- Card padding: p-6 (mobile), p-8 (desktop)
- Section padding: py-16 (mobile), py-24 (desktop)
- Element gaps: gap-4 (tight), gap-6 (standard), gap-8 (generous)

**Grid Systems**:
- Marketing: max-w-7xl mx-auto px-6
- Dashboard Content: max-w-screen-2xl mx-auto px-6
- Forms/Text: max-w-2xl
- Data Tables: w-full with horizontal scroll on mobile

**Dashboard Layouts**:
- Sidebar navigation: w-64, fixed height, collapsible on mobile
- Main content: flex-1 with responsive padding
- Two-column splits: 2/3 - 1/3 ratio for content/sidebar patterns

---

## Component Library

### Marketing Site Components

**Hero Section**:
- Full-width background with subtle gradient overlay
- Large hero image showcasing diverse professionals collaborating
- Centered content: headline (text-6xl), subheadline (text-xl), dual CTAs
- Trust indicators below fold: "Trusted by 500+ companies" with logo strip
- Height: min-h-screen on desktop, min-h-[600px] on mobile

**Feature Cards** (3-column grid):
- Icon at top (w-12 h-12, rounded-lg background)
- Title (text-xl font-semibold)
- Description (text-base leading-relaxed)
- Optional link arrow
- Hover: subtle lift (translate-y-1) and shadow increase

**Social Proof Section**:
- Testimonial cards in 3-column grid
- Avatar image, name, title, company
- Quote in larger text (text-lg)
- Star rating visualization
- Background: subtle card treatment with border

**Pricing Cards**:
- Side-by-side comparison (4 plans)
- Most popular badge on Growth tier
- Feature checklist with checkmark icons
- Clear CTA button
- Gradient border treatment on Pro/Enterprise tiers

**Footer**:
- 4-column layout: Company, Product, Resources, Legal
- Newsletter signup form (email + button)
- Social media icons
- Trust badges: SOC 2, GDPR compliant
- Copyright and links

### Job-Seeker Dashboard Components

**Profile Completion Card**:
- Progress ring/bar showing percentage
- Checklist of incomplete items with action links
- Prominent in dashboard overview
- Celebratory state when 100% complete

**Job Match Cards**:
- Company logo (square, w-16 h-16)
- Job title (text-xl font-semibold)
- Company name, location, remote badge
- Fit score (large, colored: 90%+ green, 70-89% yellow, <70% gray)
- Skill tags (pill badges showing matching vs. gap)
- "Why you're a match" AI explanation (2-3 lines, subtle background)
- Apply button + Save bookmark icon

**Application Timeline**:
- Vertical timeline with status nodes
- Status indicators: Applied, Viewed, Interview, Offer, Rejected
- Timestamps for each stage
- Employer notes shown when shared

**Skill Passport**:
- Skill cards with proficiency levels (bars or badges)
- Evidence tags: GitHub, Certification, Endorsement
- Add skill button
- Visual hierarchy: primary skills larger/bolder

### Employer Dashboard Components

**Job Posting Form**:
- Multi-step wizard: Basic Info → Requirements → Benefits → Review
- Progress indicator at top
- AI parsing results in sidebar preview
- Rich text editor for description
- Tag input for skills with autocomplete
- Salary range slider

**Candidate Match List**:
- Table view with sortable columns
- Avatar, name, current role, location
- Match score with explanation tooltip
- Skill match badges
- Quick actions: Shortlist, Message, Reject
- Bulk actions toolbar when rows selected

**Pipeline Board** (Kanban style):
- Columns: Applied, Screening, Interview, Offer, Hired
- Draggable candidate cards
- Card shows: avatar, name, match score, days in stage
- Quick view modal on card click

**Analytics Charts**:
- Time-to-hire trend line
- Match acceptance rate pie chart
- Skill demand bar chart
- Application funnel visualization
- Export CSV button on each chart

### Platform Admin Dashboard Components

**Tenant Management Table**:
- Searchable, filterable data table
- Columns: Tenant name, plan, MRR, users, status, actions
- Status badges (Active, Trial, Suspended)
- Quick actions dropdown
- Pagination with page size selector

**System Health Dashboard**:
- Metrics cards showing: API latency, queue depth, ML processing time, error rate
- Color-coded status indicators (green/yellow/red)
- Sparkline trend graphs in each card
- Real-time updates indicator

**Revenue Chart**:
- Area chart showing MRR over time
- Breakdown by plan tier (stacked)
- Comparison with previous period
- Key metrics summary cards above chart

---

## Cross-Dashboard Patterns

**Navigation**:
- Top bar: logo left, search center, notifications + profile right
- Left sidebar: icon + label menu items, active state with accent background
- Breadcrumbs below top bar for deep navigation

**Empty States**:
- Centered illustration/icon
- Headline explaining state
- Description with actionable next step
- Primary CTA button

**Notifications**:
- Toast messages: top-right position, auto-dismiss (5s)
- In-app notification panel: slide-in from right, grouped by date
- Unread count badge on bell icon

**Forms**:
- Labels above inputs, required asterisk
- Helper text below fields
- Inline validation on blur
- Error states with red border and message
- Success states with checkmark icon

**Loading States**:
- Skeleton screens for data tables and cards
- Spinner for form submissions
- Progress bars for multi-step processes

---

## Images

**Marketing Site**:
- **Hero Image**: Large, high-quality photo showing diverse professionals collaborating on a project, laptops visible, modern office/co-working space. Bright, energetic atmosphere. Position: background covering top 100vh with gradient overlay
- **Feature Section**: Three smaller images showing: 1) Person reviewing resume on screen, 2) Team meeting/interview scenario, 3) Dashboard analytics on laptop. Size: 400x300px each
- **Testimonial Avatars**: Professional headshots, circular crop, 64x64px
- **Company Logos**: Grayscale, placed in trust bar, 120x40px each

**Dashboard Images**:
- Placeholder avatars for users without photos (initials on colored background)
- Company logos in job listings (square, 64x64px)
- No decorative images in data-heavy admin sections