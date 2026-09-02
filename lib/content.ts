export type Service = {
  slug: string;
  number: string;
  title: string;
  shortTitle: string;
  promise: string;
  description: string;
  capabilities: string[];
  deliverables: string[];
  outcomes: string[];
  engagements: string[];
  related: string[];
};

export const services: Service[] = [
  {
    slug: "brand-strategy",
    number: "01",
    title: "Brand strategy & identity",
    shortTitle: "Brand",
    promise: "Make the choice feel obvious.",
    description:
      "We find the sharpest position a business can credibly own, then build the verbal and visual system needed to express it consistently.",
    capabilities: [
      "Research and stakeholder interviews",
      "Audience and category mapping",
      "Positioning and brand architecture",
      "Naming, messaging and voice",
      "Visual identity and design systems",
      "Brand launch and governance",
    ],
    deliverables: [
      "Brand strategy platform",
      "Messaging house",
      "Identity system",
      "Guidelines and templates",
      "Internal launch toolkit",
    ],
    outcomes: [
      "A differentiated market position",
      "Faster, more consistent decision-making",
      "A brand system built to scale across teams and cities",
    ],
    engagements: ["Brand intensive", "Full identity programme", "Brand stewardship retainer"],
    related: ["campaigns-advertising", "web-digital-products", "film-content-production"],
  },
  {
    slug: "campaigns-advertising",
    number: "02",
    title: "Campaigns & advertising",
    shortTitle: "Campaigns",
    promise: "Build an idea people can carry.",
    description:
      "From a launch platform to an always-on campaign, we connect a memorable creative idea to the moments and channels that move people.",
    capabilities: [
      "Campaign strategy and creative platform",
      "Concept development and art direction",
      "Copywriting and design",
      "Integrated channel planning",
      "Launch, localization and versioning",
      "Campaign optimization",
    ],
    deliverables: [
      "Creative territory and campaign system",
      "Hero assets and channel adaptations",
      "Media-ready production suite",
      "Launch playbook",
      "Measurement framework",
    ],
    outcomes: [
      "One recognizable idea across every touchpoint",
      "More efficient production and versioning",
      "Clear links between creative work and commercial goals",
    ],
    engagements: ["Launch campaign", "Seasonal platform", "Always-on creative partnership"],
    related: ["media-growth", "social-creator", "film-content-production"],
  },
  {
    slug: "social-creator",
    number: "03",
    title: "Social, community & creators",
    shortTitle: "Social",
    promise: "Earn attention by being worth following.",
    description:
      "We turn social from a posting calendar into a distinctive editorial system—built around useful formats, credible voices and active community care.",
    capabilities: [
      "Channel and community strategy",
      "Editorial systems and content pillars",
      "Short-form video and social design",
      "Creator sourcing and partnership design",
      "Community management and response planning",
      "Social listening and performance reporting",
    ],
    deliverables: [
      "Channel playbook",
      "Monthly content system",
      "Creator briefs and disclosure plan",
      "Community response library",
      "Learning dashboard",
    ],
    outcomes: [
      "A recognizable voice and repeatable formats",
      "Stronger trust through real people and useful content",
      "A learning loop between community signals and creative work",
    ],
    engagements: ["Social reset", "Creator campaign", "Managed social studio"],
    related: ["campaigns-advertising", "film-content-production", "data-crm-experience"],
  },
  {
    slug: "web-digital-products",
    number: "04",
    title: "Websites & digital products",
    shortTitle: "Digital",
    promise: "Turn the brand into an experience that works.",
    description:
      "We design and build fast, accessible websites and useful digital products where brand expression and conversion performance reinforce each other.",
    capabilities: [
      "Experience strategy and information architecture",
      "UX research, flows and prototyping",
      "Interface and motion design",
      "Responsive front-end development",
      "CMS, commerce and systems integration",
      "Accessibility, performance and quality assurance",
    ],
    deliverables: [
      "Experience blueprint",
      "Validated prototype",
      "Responsive design system",
      "Production website or product",
      "Analytics and optimization plan",
    ],
    outcomes: [
      "A clearer path from interest to action",
      "A maintainable system teams can operate",
      "Better accessibility, speed and search readiness",
    ],
    engagements: ["Conversion sprint", "Website transformation", "Digital product partnership"],
    related: ["brand-strategy", "search-discoverability", "data-crm-experience"],
  },
  {
    slug: "search-discoverability",
    number: "05",
    title: "Search & discoverability",
    shortTitle: "Search",
    promise: "Be the answer wherever people ask.",
    description:
      "We build search visibility across traditional results, maps, marketplaces, social search and AI-generated answers using clear information and earned authority.",
    capabilities: [
      "Technical and content SEO",
      "Local and multi-location search",
      "Answer-engine and AI visibility",
      "Content strategy and editorial planning",
      "Digital PR and authority development",
      "Search measurement and testing",
    ],
    deliverables: [
      "Search opportunity map",
      "Technical remediation plan",
      "Structured content system",
      "Local presence toolkit",
      "Visibility and conversion dashboard",
    ],
    outcomes: [
      "Greater presence across changing discovery journeys",
      "More qualified organic demand",
      "Content that serves customers as well as machines",
    ],
    engagements: ["Search everywhere audit", "90-day visibility sprint", "Ongoing authority programme"],
    related: ["web-digital-products", "media-growth", "ai-marketing-operations"],
  },
  {
    slug: "media-growth",
    number: "06",
    title: "Media, performance & growth",
    shortTitle: "Growth",
    promise: "Buy attention with a reason—and prove what it did.",
    description:
      "We connect media strategy, channel execution, creative testing and measurement around one agreed business outcome.",
    capabilities: [
      "Audience, channel and investment strategy",
      "Paid search, social, display and video",
      "Retail and commerce media",
      "Landing-page and conversion optimization",
      "Experiment design and incrementality",
      "Reporting, attribution and decision support",
    ],
    deliverables: [
      "Investment and channel plan",
      "Campaign builds and governance",
      "Creative testing matrix",
      "Conversion experiments",
      "Executive performance narrative",
    ],
    outcomes: [
      "A single view of creative, media and conversion",
      "Faster movement of budget toward what works",
      "Decisions grounded in evidence rather than dashboard volume",
    ],
    engagements: ["Growth diagnostic", "90-day acquisition pilot", "Integrated growth retainer"],
    related: ["campaigns-advertising", "search-discoverability", "data-crm-experience"],
  },
  {
    slug: "film-content-production",
    number: "07",
    title: "Film, photography & content production",
    shortTitle: "Production",
    promise: "Make the work impossible to scroll past.",
    description:
      "Our production model starts with the hero story and plans every useful format, cut and still before the first frame is captured.",
    capabilities: [
      "Creative development and treatment writing",
      "Directing, cinematography and photography",
      "Casting, locations and production management",
      "Editing, colour, sound and motion graphics",
      "Social-first and modular content systems",
      "Rights, captions, metadata and asset operations",
    ],
    deliverables: [
      "Hero film or image library",
      "Platform-native cut-downs",
      "Stills, loops and motion assets",
      "Accessible masters and captions",
      "Rights and asset register",
    ],
    outcomes: [
      "Higher creative coherence across formats",
      "More usable assets from each production day",
      "A clean chain of custody for rights and approvals",
    ],
    engagements: ["Hero production", "One shoot, many stories", "Always-on content operation"],
    related: ["campaigns-advertising", "social-creator", "ai-marketing-operations"],
  },
  {
    slug: "ai-marketing-operations",
    number: "08",
    title: "AI & marketing operations",
    shortTitle: "AI systems",
    promise: "Use automation to raise the standard, not lower it.",
    description:
      "We design responsible workflows that help teams research, create, adapt and learn faster—with human judgment, provenance and approvals built in.",
    capabilities: [
      "Workflow and readiness assessment",
      "AI-assisted content operations",
      "Prompt, knowledge and governance systems",
      "Creative adaptation and localization",
      "Marketing automation integration",
      "Training, adoption and quality assurance",
    ],
    deliverables: [
      "Opportunity and risk map",
      "Pilot workflow",
      "Governance and provenance standard",
      "Reusable playbooks and prompt systems",
      "Team enablement programme",
    ],
    outcomes: [
      "Less repetitive production work",
      "Faster adaptation without sacrificing control",
      "A practical standard for responsible AI use",
    ],
    engagements: ["AI readiness sprint", "Workflow pilot", "Marketing operations transformation"],
    related: ["film-content-production", "search-discoverability", "data-crm-experience"],
  },
  {
    slug: "data-crm-experience",
    number: "09",
    title: "Data, CRM & customer experience",
    shortTitle: "Experience",
    promise: "Turn scattered signals into better customer journeys.",
    description:
      "We connect measurement, first-party data, lifecycle communication and service design so marketing becomes more useful after the first click.",
    capabilities: [
      "Measurement strategy and analytics design",
      "Customer journey and service mapping",
      "CRM and lifecycle programme design",
      "Lead capture and qualification",
      "Dashboard and decision-system design",
      "Privacy-conscious personalization",
    ],
    deliverables: [
      "Measurement plan and event taxonomy",
      "Journey and opportunity map",
      "Lifecycle messaging system",
      "Lead operations blueprint",
      "Decision-ready dashboard",
    ],
    outcomes: [
      "A shared definition of meaningful performance",
      "More relevant follow-up across the customer lifecycle",
      "Better use of first-party relationships and insight",
    ],
    engagements: ["Measurement reset", "Lifecycle pilot", "Customer experience programme"],
    related: ["web-digital-products", "media-growth", "social-creator"],
  },
];

export type Industry = {
  slug: string;
  name: string;
  signal: string;
  introduction: string;
  pressures: string[];
  opportunities: string[];
  relevantServices: string[];
};

export const industries: Industry[] = [
  {
    slug: "ocean-energy-industrial",
    name: "Ocean, energy & industrial",
    signal: "Complex capability. Clear commercial story.",
    introduction:
      "We help technical organizations translate expertise, safety and operational credibility into a story buyers, partners, investors and future employees can understand.",
    pressures: [
      "Long, multi-stakeholder buying cycles",
      "Technical detail that can obscure real differentiation",
      "Recruitment and reputation needs across remote markets",
      "High standards for evidence, claims and procurement",
    ],
    opportunities: [
      "North Atlantic capability positioning",
      "Procurement-ready websites and sales systems",
      "Employer-brand and recruitment campaigns",
      "Documentary production in real operating environments",
    ],
    relevantServices: ["brand-strategy", "web-digital-products", "film-content-production", "search-discoverability"],
  },
  {
    slug: "technology-defence-space",
    name: "Technology, defence & space",
    signal: "Build confidence before the category catches up.",
    introduction:
      "For emerging and mission-critical organizations, we turn an ambitious proposition into credible market language, usable product experiences and focused demand programmes.",
    pressures: [
      "New categories that buyers do not yet understand",
      "Security, sovereignty and trust expectations",
      "Investor, procurement and talent audiences with different needs",
      "Fast product cycles and changing proof points",
    ],
    opportunities: [
      "Category creation and technical storytelling",
      "Investor and procurement narratives",
      "Product launch systems",
      "Thought leadership and authority building",
    ],
    relevantServices: ["brand-strategy", "campaigns-advertising", "web-digital-products", "data-crm-experience"],
  },
  {
    slug: "tourism-hospitality-culture",
    name: "Tourism, hospitality & culture",
    signal: "Make a place felt before it is visited.",
    introduction:
      "We create distinctive destination and operator experiences that turn regional character into year-round demand, direct bookings and lasting advocacy.",
    pressures: [
      "Seasonality and limited booking windows",
      "Dependence on third-party platforms",
      "Similarity across destination marketing",
      "The need to respect place, people and carrying capacity",
    ],
    opportunities: [
      "Shoulder-season demand creation",
      "Direct-booking experience design",
      "Film, creator and editorial storytelling",
      "Visitor lifecycle and local partnership systems",
    ],
    relevantServices: ["campaigns-advertising", "film-content-production", "social-creator", "media-growth"],
  },
  {
    slug: "public-community-nonprofit",
    name: "Public, community & nonprofit",
    signal: "Move people with clarity and care.",
    introduction:
      "We help public-interest organizations make complex information understandable, participation easier and trust visible across every channel.",
    pressures: [
      "Many audiences with different access needs",
      "Public accountability and claims scrutiny",
      "Behaviour change beyond simple awareness",
      "Procurement, approvals and finite resources",
    ],
    opportunities: [
      "Accessible public information",
      "Participation-first campaigns",
      "Service and journey redesign",
      "Community-led storytelling",
    ],
    relevantServices: ["brand-strategy", "campaigns-advertising", "web-digital-products", "data-crm-experience"],
  },
  {
    slug: "retail-consumer-commerce",
    name: "Retail, consumer & commerce",
    signal: "Distinctive enough to notice. Useful enough to choose.",
    introduction:
      "We connect brand, commerce, content and media so consumer businesses can create demand and convert it without losing what makes them recognizable.",
    pressures: [
      "Value-sensitive and premium shoppers moving differently",
      "Rising acquisition costs and channel fragmentation",
      "Constant content and promotion pressure",
      "Limited first-party customer insight",
    ],
    opportunities: [
      "Value and premium creative routes",
      "Retail-media and creator programmes",
      "Conversion-led commerce experiences",
      "Lifecycle and loyalty design",
    ],
    relevantServices: ["campaigns-advertising", "media-growth", "social-creator", "data-crm-experience"],
  },
  {
    slug: "professional-property-growth",
    name: "Professional services, property & growth companies",
    signal: "Turn reputation into a repeatable growth engine.",
    introduction:
      "We help expertise-led and growth-stage organizations sharpen their market position, build confidence online and create a healthier path from interest to qualified opportunity.",
    pressures: [
      "Undifferentiated category language",
      "Founder-dependent selling and referrals",
      "Complex offers and weak digital journeys",
      "Expansion into unfamiliar cities or markets",
    ],
    opportunities: [
      "Positioning for expansion",
      "Expert-led content and search authority",
      "Lead-generation and qualification systems",
      "Multi-location brand and demand programmes",
    ],
    relevantServices: ["brand-strategy", "search-discoverability", "web-digital-products", "media-growth"],
  },
];

export type CaseStudy = {
  slug: string;
  client: string;
  sector: string;
  title: string;
  summary: string;
  challenge: string;
  idea: string;
  system: string[];
  measurement: string[];
  palette: string;
};

export const caseStudies: CaseStudy[] = [
  {
    slug: "northline-oceans",
    client: "Northline Oceans",
    sector: "Ocean technology — concept demonstration",
    title: "Signal across the Atlantic",
    summary:
      "A fictional market-entry system showing how a Newfoundland ocean-technology company could translate deep technical capability into international commercial confidence.",
    challenge:
      "The hypothetical business has proven engineering expertise, but its offer is described differently by sales, recruitment and leadership. International buyers struggle to see the commercial advantage quickly.",
    idea:
      "Make every proof point part of one visible signal: intelligence gathered in the harshest waters, designed to travel anywhere.",
    system: [
      "Positioning and message architecture",
      "Technical brand identity",
      "Procurement-ready website",
      "Field documentary and modular sales films",
      "Search authority and account-based campaign",
    ],
    measurement: [
      "Qualified procurement conversations",
      "Target-account engagement",
      "Recruitment journey completion",
      "Sales-team adoption of the new story",
    ],
    palette: "signal",
  },
  {
    slug: "wild-shore",
    client: "Wild Shore House",
    sector: "Hospitality — concept demonstration",
    title: "Stay for the weather",
    summary:
      "A fictional shoulder-season platform demonstrating how a coastal property could turn Newfoundland’s dramatic conditions into a reason to travel, not a disclaimer.",
    challenge:
      "The hypothetical hotel fills summer dates through booking platforms but has weak direct demand outside peak season and little permissioned customer data.",
    idea:
      "Reframe wind, fog and changing skies as the main event—an invitation to experience the coast at its most alive.",
    system: [
      "Seasonal campaign platform",
      "Cinematic hero film and weather-led social formats",
      "Direct-booking experience redesign",
      "Local maker and culinary partnerships",
      "Lifecycle email for past and prospective guests",
    ],
    measurement: [
      "Direct booking share",
      "Shoulder-season occupancy and revenue",
      "Qualified subscriber growth",
      "Partner content participation",
    ],
    palette: "weather",
  },
  {
    slug: "forge-and-field",
    client: "Forge & Field",
    sector: "Consumer goods — concept demonstration",
    title: "Made here. Chosen everywhere.",
    summary:
      "A fictional national-growth system showing how an Atlantic Canadian maker could expand distribution while keeping origin and craft commercially relevant.",
    challenge:
      "The hypothetical brand is loved locally but relies on inconsistent packaging, founder-led social content and wholesale relationships that do not yet tell one coherent story.",
    idea:
      "Treat provenance as product performance: every detail is shaped by the place, the people and the conditions that made it.",
    system: [
      "Brand and packaging architecture",
      "Commerce website and retailer toolkit",
      "Product photography and creator seeding",
      "Value and premium media routes",
      "Post-purchase and replenishment journeys",
    ],
    measurement: [
      "Qualified retailer interest",
      "Commerce conversion and repeat purchase",
      "Creative performance by audience route",
      "Customer understanding of brand origin",
    ],
    palette: "forge",
  },
];

export const insights = [
  {
    slug: "search-everywhere",
    category: "Discoverability",
    title: "Search everywhere: designing for links, maps, social and AI answers",
    deck: "A practical operating model for becoming easier to find—and easier to trust—across a fragmented discovery journey.",
    readTime: "7 min read",
    published: "September 2, 2026",
    byline: "KINGXFORD launch desk",
    sourceNote: "A practical synthesis of primary platform and Canadian industry guidance; it is not a statistical study or a promise of ranking.",
    sources: [
      { label: "IAB Canada — entering the GEO search era", href: "https://iabcanada.com/enter-the-geo-search-era-content-everywhere-all-the-time/" },
      { label: "Google Search Central — structured data introduction", href: "https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data" },
    ],
    sections: [
      {
        heading: "The journey no longer starts in one box",
        body: "Customers move between search engines, maps, marketplaces, short-form video, review sites and AI assistants. A useful discoverability strategy begins with the questions behind that behaviour, then creates consistent, evidence-rich answers wherever those questions appear.",
      },
      {
        heading: "Clarity is an operating advantage",
        body: "Machines and people both benefit when services, locations, proof, authorship and policies are stated plainly. Structured data helps, but it cannot rescue vague positioning or unsupported claims. The foundation is still a clear offer backed by accessible information and credible third-party signals.",
      },
      {
        heading: "Build a learning system",
        body: "Measure more than ranking. Track qualified visibility, branded demand, referral quality, assisted conversion and the questions sales teams still answer manually. Those signals should shape the next content, product and reputation priorities.",
      },
    ],
    actions: ["Map high-intent customer questions", "Standardize proof and entity information", "Measure qualified discovery, not impressions alone"],
  },
  {
    slug: "one-shoot-many-stories",
    category: "Production",
    title: "One shoot, many stories: a better model for content production",
    deck: "How to plan a hero production as a useful, rights-cleared content system instead of an expensive one-off.",
    readTime: "6 min read",
    published: "September 2, 2026",
    byline: "KINGXFORD launch desk",
    sourceNote: "An operating framework informed by accessibility and rights-management requirements; exact obligations depend on the channel and organization.",
    sources: [
      { label: "W3C WAI — making audio and video accessible", href: "https://www.w3.org/WAI/media/av/" },
      { label: "CRTC — accessibility policy for online streaming", href: "https://crtc.gc.ca/eng/archive/2026/2026-98.htm" },
    ],
    sections: [
      {
        heading: "Start with the decision, not the deliverable",
        body: "Before listing formats, define the decisions the content must influence. A launch film, recruitment story and product demonstration may share a production day, but they need different evidence, pacing and calls to action.",
      },
      {
        heading: "Design the asset map before capture",
        body: "Plan framing, orientation, stills, sound, interviews, cut-downs and quiet moments in pre-production. This makes modularity intentional rather than an editing-room compromise and prevents platform variants from feeling like damaged versions of the hero film.",
      },
      {
        heading: "Treat operations as part of craft",
        body: "Captions, alt text, filenames, rights, consent, expiry dates and source records determine whether great work can be used safely and repeatedly. A clean asset register protects both creative value and client confidence.",
      },
    ],
    actions: ["Define audience decisions", "Create a pre-shoot asset matrix", "Ship accessible masters with a rights register"],
  },
  {
    slug: "proof-standard",
    category: "Responsible growth",
    title: "The proof standard: making ambitious marketing defensible",
    deck: "Claims, creator disclosure, accessibility and AI provenance belong in the creative process—not at the end of it.",
    readTime: "8 min read",
    published: "September 2, 2026",
    byline: "KINGXFORD launch desk",
    sourceNote: "General marketing-governance guidance based on Canadian primary sources; organizations should obtain qualified advice for their facts and obligations.",
    sources: [
      { label: "Ad Standards — influencer marketing research and disclosure", href: "https://adstandards.ca/resources/influencer-marketing/" },
      { label: "Competition Bureau Canada — deceptive marketing practices", href: "https://competition-bureau.canada.ca/deceptive-marketing-practices" },
    ],
    sections: [
      {
        heading: "Evidence can sharpen the idea",
        body: "A claims ledger forces a team to separate what is true, what is supportable and what is merely familiar category language. The strongest verified advantage often becomes the most ownable creative territory.",
      },
      {
        heading: "Trust needs visible mechanics",
        body: "Clear creator relationships, accurate pricing, accessible alternatives and transparent AI use reduce friction for customers and risk for organizations. They also signal respect. Disclosure should be designed to be understood, not hidden in compliance furniture.",
      },
      {
        heading: "Make proof repeatable",
        body: "Assign owners, sources, review dates and approved language to material claims. Connect that record to campaign, web and sales workflows so outdated statements can be corrected across the system instead of hunted one asset at a time.",
      },
    ],
    actions: ["Create a living claims ledger", "Record consent, rights and AI provenance", "Include accessibility in every production brief"],
  },
];

export const locations = [
  {
    slug: "st-johns",
    city: "St. John’s",
    province: "Newfoundland and Labrador",
    status: "Launch base",
    statement: "Built at the edge of the continent, for organizations ready to move beyond it.",
    detail: "St. John’s is KINGXFORD’s launch market and operating base: close to ocean industries, public institutions, tourism, culture and a growing technology ecosystem.",
    focus: ["Ocean, energy and industrial", "Tourism and hospitality", "Technology, defence and space", "Public and community organizations"],
  },
  {
    slug: "halifax",
    city: "Halifax",
    province: "Nova Scotia",
    status: "Atlantic expansion roadmap",
    statement: "A regional bridge for ambitious Atlantic brands.",
    detail: "KINGXFORD’s distributed model is being designed to support Halifax and the wider Atlantic region remotely and through project-based on-site work. Engagements will be confirmed against fit and capacity; no permanent office is claimed here.",
    focus: ["Regional growth companies", "Ocean and defence", "Higher education and public sector", "Consumer and hospitality"],
  },
  {
    slug: "toronto",
    city: "Toronto",
    province: "Ontario",
    status: "National expansion roadmap",
    statement: "Atlantic perspective, connected to Canada’s largest commercial market.",
    detail: "KINGXFORD is building toward Toronto and Ontario engagements through distributed delivery and planned production travel. Work will be confirmed against fit and capacity; no permanent office or existing client base is claimed here.",
    focus: ["Technology and growth companies", "Retail and consumer", "Professional services", "National campaign work"],
  },
  {
    slug: "calgary",
    city: "Calgary",
    province: "Alberta",
    status: "National expansion roadmap",
    statement: "Clear stories for industries shaping Canada’s next economy.",
    detail: "KINGXFORD is building toward Alberta engagements through distributed collaboration and project-based field production. Work will be confirmed against fit and capacity; no permanent office or existing client base is claimed here.",
    focus: ["Energy transition", "Industrial and infrastructure", "Technology", "Growth-stage companies"],
  },
  {
    slug: "vancouver",
    city: "Vancouver",
    province: "British Columbia",
    status: "National expansion roadmap",
    statement: "Brand, product and production for west-coast growth.",
    detail: "KINGXFORD is building toward British Columbia engagements through distributed collaboration and planned on-site work. Engagements will be confirmed against fit and capacity; no permanent office or existing client base is claimed here.",
    focus: ["Technology and digital products", "Tourism and culture", "Consumer brands", "Film and content production"],
  },
  {
    slug: "montreal",
    city: "Montréal",
    province: "Québec",
    status: "Future bilingual service market",
    statement: "A future market requiring native cultural and linguistic fluency.",
    detail: "KINGXFORD intends to enter Québec only with qualified French-language partners and locally informed leadership. No current office or full French-language service is claimed.",
    focus: ["Bilingual brand systems", "Cultural adaptation", "Technology and creative industries", "National campaign localization"],
  },
];

export const serviceBySlug = (slug: string) => services.find((service) => service.slug === slug);
export const industryBySlug = (slug: string) => industries.find((industry) => industry.slug === slug);
export const caseBySlug = (slug: string) => caseStudies.find((item) => item.slug === slug);
export const insightBySlug = (slug: string) => insights.find((item) => item.slug === slug);
export const locationBySlug = (slug: string) => locations.find((item) => item.slug === slug);
