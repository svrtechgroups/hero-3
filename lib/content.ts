// All copy lives here so it can be edited without touching components.

export const site = {
  name: 'SVR Tech Groups',
  tagline: 'AI-accelerated. Human-verified. Shipped fast.',
  email: 'svrtechgroups@gmail.com',
  phone: '+91 9553284523',
  phoneHref: 'tel:+919553284523',
  location: 'Hyderabad, Telangana, India',
  url: 'https://svrtechgroups.com',
  social: {
    linkedin: 'https://www.linkedin.com/company/svr-tech-groups/',
    instagram: 'https://www.instagram.com/svr_tech_groups/',
  },
};

export const nav = [
  { label: 'Services', href: '#services' },
  { label: 'Process', href: '#process' },
  { label: 'Impact', href: '#impact' },
  { label: 'Testimonials', href: '#testimonials' },
  { label: 'Contact', href: '#contact' },
];

export const heroChips = ['Websites', 'Mobile apps', 'AI agents', 'AI workflow automation'];

export const steps = [
  {
    n: '01',
    title: 'Discover',
    body: 'We start with the real problem and the goal behind it: who uses this, what slows them down today, and what success looks like.',
    detail: ['Who is it for?', 'What breaks today?', 'How will we measure success?'],
  },
  {
    n: '02',
    title: 'Design',
    body: 'UX, architecture and a clear scope, agreed before a line of production code. You see exactly what will be built.',
    detail: ['User flows & UI', 'System architecture', 'Fixed, written scope'],
  },
  {
    n: '03',
    title: 'AI-Accelerated Build',
    body: 'AI speeds up development inside our standard engineering framework: shared patterns, typed code and version control from day one.',
    detail: [],
  },
  {
    n: '04',
    title: 'Human-Verified QA',
    body: 'Every change is reviewed by an engineer and has to pass automated tests, security checks and performance checks before it ships.',
    detail: ['Code review', 'Automated tests', 'Security checks', 'Performance checks'],
  },
  {
    n: '05',
    title: 'Launch & Evolve',
    body: 'We deploy, monitor real usage, and keep improving the product as your business grows.',
    detail: ['Deploy', 'Monitor', 'Improve'],
  },
];

// PLACEHOLDER VALUES — replace with real numbers before launch.
export const stats = [
  { value: 25, suffix: '+', label: 'projects delivered' },
  { value: 40, suffix: '%', label: 'faster delivery' },
  { value: 20, suffix: '+', label: 'happy clients' },
  { value: 60, suffix: '+', label: 'automations running' },
];

export const services = [
  {
    title: 'Websites',
    body: 'Fast, search-friendly sites and web apps that turn visitors into enquiries.',
    points: ['Marketing sites', 'Web apps & portals', 'E-commerce'],
  },
  {
    title: 'Mobile Apps',
    body: 'iOS and Android apps your customers and teams actually keep using.',
    points: ['Cross-platform', 'Offline-ready', 'Store launch'],
  },
  {
    title: 'AI Agents',
    body: 'Assistants that answer, research and act on your data, with guardrails.',
    points: ['Support agents', 'Internal copilots', 'Data Q&A'],
  },
  {
    title: 'AI Workflow Automation',
    body: 'Repetitive work handed to reliable automations that run every day.',
    points: ['Document processing', 'CRM & email flows', 'Reporting'],
  },
];

// PLACEHOLDER TESTIMONIALS — replace with real client quotes.
export const testimonials = [
  {
    quote: 'They shipped our booking platform in weeks, not months, and the code review process meant launch day was uneventful. Exactly what we wanted.',
    name: 'Ananya Rao',
    role: 'Founder',
    company: 'Placeholder Clinics',
    rating: 5,
  },
  {
    quote: 'The support agent they built now answers most of our routine customer questions and hands off the rest cleanly.',
    name: 'Rahul Menon',
    role: 'Head of Operations',
    company: 'Placeholder Logistics',
    rating: 5,
  },
  {
    quote: 'Clear scope, weekly demos, no surprises on the invoice. Our mobile app launched on both stores on the agreed date.',
    name: 'Sarah Thomas',
    role: 'Product Manager',
    company: 'Placeholder Retail',
    rating: 5,
  },
  {
    quote: 'Our month-end reporting used to take two people three days. Their automation runs it overnight.',
    name: 'Vikram Shah',
    role: 'Finance Lead',
    company: 'Placeholder Holdings',
    rating: 4,
  },
  {
    quote: 'Fast, but never careless. Every release came with tests and a short note on what changed.',
    name: 'Meera Iyer',
    role: 'CTO',
    company: 'Placeholder Labs',
    rating: 5,
  },
];

export const projectTypes = ['Website', 'Mobile App', 'AI Agent', 'Automation', 'Other'] as const;
export const budgets = ['Under ₹1 lakh', '₹1–5 lakh', '₹5–15 lakh', '₹15 lakh+', 'Not sure yet'] as const;
