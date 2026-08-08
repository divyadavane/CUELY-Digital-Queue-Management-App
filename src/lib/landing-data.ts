export interface NavLink {
  label: string;
  href: string;
}

export interface ClientLogo {
  id: string;
  name: string;
  logoText: string;
  subtext: string;
}

export interface StatItem {
  id: string;
  value: string;
  suffix?: string;
  label: string;
  iconName: string;
  accentColor: string;
}

export interface PersonaTab {
  id: string;
  label: string;
  iconName: string;
  description: string;
  features: PersonaFeature[];
}

export interface PersonaFeature {
  id: string;
  title: string;
  description: string;
  iconName: string;
  badge?: string;
  accentColor?: string;
}

export interface StepItem {
  number: string;
  title: string;
  description: string;
  details: string[];
}

export interface TestimonialItem {
  id: string;
  quote: string;
  author: string;
  role: string;
  company: string;
  avatarUrl: string;
  rating: number;
  metric: string;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

export interface FooterColumn {
  title: string;
  links: { label: string; href: string; isExternal?: boolean }[];
}

// Keep old FeatureItem type for backward compat if any file uses it
export interface FeatureItem {
  id: string;
  title: string;
  description: string;
  iconName: string;
  badge?: string;
  accentColor?: string;
}

export const LANDING_CONFIG = {
  brandName: 'Cuely',
  brandTagline: 'Next-Generation Smart Queue & Visitor Management System',
  badgeText: 'Cuely 2.0 is here',
  heroHeadline: 'Eliminate lines. Delight customers with ',
  heroAccentPhrase: 'unfair speed.',
  heroSubheadline:
    'Cuely transforms physical wait times into seamless digital experiences. Give your visitors real-time SMS updates, virtual queue tokens, and predictive wait times — no app downloads needed.',
  primaryCtaText: 'Start Free Trial',
  primaryCtaHref: '/login',
  secondaryCtaText: 'Explore Demo Kiosk',
  secondaryCtaHref: '/kiosk',
  socialProof: {
    businessCount: '2,400+ locations worldwide',
    ratingText: '4.9/5 average rating from 10k+ reviews',
    avatars: [
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80',
    ],
  },
};

export const NAV_LINKS: NavLink[] = [
  { label: 'Features', href: '#features' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Telemedicine', href: '#telemedicine' },
  { label: 'Testimonials', href: '#testimonials' },
  { label: 'FAQ', href: '#faq' },
];

export const CLIENT_LOGOS: ClientLogo[] = [
  { id: '1', name: 'Apex Health', logoText: 'APEX', subtext: 'HEALTHCARE' },
  { id: '2', name: 'Metro Clinic', logoText: 'METRO', subtext: 'CLINICS' },
  { id: '3', name: 'Nova Express', logoText: 'NOVA', subtext: 'LOGISTICS' },
  { id: '4', name: 'Summit Retail', logoText: 'SUMMIT', subtext: 'STORES' },
  { id: '5', name: 'Vanguard Bank', logoText: 'VANGUARD', subtext: 'FINANCE' },
  { id: '6', name: 'Aura Spa & Wellness', logoText: 'AURA', subtext: 'WELLNESS' },
  { id: '7', name: 'Pulse Care', logoText: 'PULSE', subtext: 'HOSPITALS' },
];

// ==========================================
// Stats Band (between logo marquee & features)
// ==========================================
export const STATS_DATA: StatItem[] = [
  {
    id: 'stat-1',
    value: '73',
    suffix: '%',
    label: 'Wait Time Reduction',
    iconName: 'TrendingDown',
    accentColor: '#22D3EE',
  },
  {
    id: 'stat-2',
    value: '0',
    suffix: '',
    label: 'App Installs Required',
    iconName: 'Smartphone',
    accentColor: '#34D399',
  },
  {
    id: 'stat-3',
    value: '2400',
    suffix: '+',
    label: 'Active Locations',
    iconName: 'MapPin',
    accentColor: '#3E7BFA',
  },
  {
    id: 'stat-4',
    value: '<500',
    suffix: 'ms',
    label: 'Real-Time Sync Speed',
    iconName: 'Zap',
    accentColor: '#F0B24C',
  },
];

// ==========================================
// Persona-Tabbed Features
// ==========================================
export const PERSONA_TABS: PersonaTab[] = [
  {
    id: 'patients',
    label: 'Patients & Customers',
    iconName: 'Users',
    description: 'A frictionless experience from check-in to consultation — no downloads, no sign-ups.',
    features: [
      {
        id: 'p1',
        title: 'QR / Link / WhatsApp Join',
        description: 'Scan a QR code, tap a link, or join via WhatsApp — no app download needed. Works on any smartphone.',
        iconName: 'QrCode',
        badge: 'Zero Friction',
        accentColor: '#3E7BFA',
      },
      {
        id: 'p2',
        title: 'Live Queue Tracking',
        description: 'Watch your position count down in real time. Know exactly when to head to the counter.',
        iconName: 'Activity',
        badge: 'Real-Time',
        accentColor: '#22D3EE',
      },
      {
        id: 'p3',
        title: 'Green "Called" Alert',
        description: 'Unmistakable green notification with audio chime when your token is called. Never miss your turn.',
        iconName: 'BellRing',
        badge: 'Instant',
        accentColor: '#34D399',
      },
      {
        id: 'p4',
        title: 'Patient Portal (OTP Login)',
        description: 'Secure OTP-based access to view visit history, upcoming appointments, bills, and prescriptions.',
        iconName: 'ShieldCheck',
        badge: 'Secure',
        accentColor: '#8B6BF2',
      },
      {
        id: 'p5',
        title: 'Video Consultations',
        description: 'Join video calls directly from the portal. Pre-join device check ensures smooth experience.',
        iconName: 'Video',
        badge: 'Telehealth',
        accentColor: '#8B6BF2',
      },
      {
        id: 'p6',
        title: 'Multi-Language Support',
        description: 'Full interface and WhatsApp notifications in English, Hindi, Marathi, and more.',
        iconName: 'Languages',
        accentColor: '#F0B24C',
      },
    ],
  },
  {
    id: 'doctors',
    label: 'Doctors & Staff',
    iconName: 'Stethoscope',
    description: 'Keyboard-driven workflows, video consult panels, and daily metrics — built for clinical speed.',
    features: [
      {
        id: 'd1',
        title: 'Keyboard Shortcuts',
        description: 'C = Call Next, T = Transfer, A = Assistance request. Operate the queue without touching the mouse.',
        iconName: 'Keyboard',
        badge: 'Power User',
        accentColor: '#3E7BFA',
      },
      {
        id: 'd2',
        title: 'Video Consult Panel',
        description: 'In-call tooling with SOAP notes, e-prescriptions, and patient history side panel.',
        iconName: 'MonitorPlay',
        badge: 'Telehealth',
        accentColor: '#8B6BF2',
      },
      {
        id: 'd3',
        title: 'Schedule & Availability',
        description: 'Set daily availability, manage appointment slots, and block break times from the dashboard.',
        iconName: 'CalendarClock',
        badge: 'Smart',
        accentColor: '#22D3EE',
      },
      {
        id: 'd4',
        title: 'E-Prescriptions',
        description: 'Generate digital prescriptions during or after consultations. Auto-linked to patient records.',
        iconName: 'FileText',
        badge: 'Digital Rx',
        accentColor: '#34D399',
      },
      {
        id: 'd5',
        title: 'Daily Summary Metrics',
        description: 'Patients seen, average consult time, no-show rate — all at a glance at end of day.',
        iconName: 'BarChart3',
        badge: 'Analytics',
        accentColor: '#F0B24C',
      },
    ],
  },
  {
    id: 'business',
    label: 'Business & Admin',
    iconName: 'Building2',
    description: 'Multi-queue control center with role-based access, analytics, and audit trail for operations leaders.',
    features: [
      {
        id: 'b1',
        title: 'Multi-Queue Control Center',
        description: 'Manage multiple departments, counters, and service lines from a single unified dashboard.',
        iconName: 'LayoutDashboard',
        badge: 'Central Hub',
        accentColor: '#3E7BFA',
      },
      {
        id: 'b2',
        title: 'Priority & Urgency Analytics',
        description: 'AI-powered urgency scoring and priority escalation. Identify bottlenecks before they happen.',
        iconName: 'Sparkles',
        badge: 'AI Powered',
        accentColor: '#8B6BF2',
      },
      {
        id: 'b3',
        title: 'Role-Based Access Control',
        description: 'Admin, Doctor, Staff, Receptionist — each role sees exactly what they need, nothing more.',
        iconName: 'Lock',
        badge: 'Secure',
        accentColor: '#34D399',
      },
      {
        id: 'b4',
        title: 'Reports & Audit Trail',
        description: 'Detailed logs of every ticket action with exportable reports for compliance and performance reviews.',
        iconName: 'ClipboardList',
        badge: 'Compliance',
        accentColor: '#F0B24C',
      },
      {
        id: 'b5',
        title: 'Razorpay Billing Integration',
        description: 'Accept payments for consultations, gated room access, and billing — all via Razorpay.',
        iconName: 'CreditCard',
        badge: 'Payments',
        accentColor: '#22D3EE',
      },
      {
        id: 'b6',
        title: 'Self-Service Kiosk Mode',
        description: 'Touchscreen kiosk interface for walk-in check-ins with thermal ticket printing support.',
        iconName: 'Tablet',
        accentColor: '#3E7BFA',
      },
    ],
  },
];

// Keep legacy FEATURES_DATA for backward compat (some imports might reference it)
export const FEATURES_DATA: FeatureItem[] = PERSONA_TABS[0].features.map(f => ({
  id: f.id,
  title: f.title,
  description: f.description,
  iconName: f.iconName,
  badge: f.badge,
  accentColor: f.accentColor,
}));

// ==========================================
// How It Works (4 steps now)
// ==========================================
export const HOW_IT_WORKS_STEPS: StepItem[] = [
  {
    number: '01',
    title: 'Join the Queue Instantly',
    description: 'Customers scan a QR code, tap a link, or use the self-service kiosk to claim their ticket — zero app installs.',
    details: ['No app installation needed', 'Select specific department or service', 'SMS / WhatsApp link issued instantly'],
  },
  {
    number: '02',
    title: 'Track Your Position Live',
    description: 'Watch your position count down in real time from your phone. Estimated wait updates dynamically.',
    details: ['Live position countdown', 'Dynamic estimated wait time', 'Freedom to wait anywhere nearby'],
  },
  {
    number: '03',
    title: 'Get Notified Instantly',
    description: 'Receive a WhatsApp alert and audio chime when your turn is approaching or when you\'re called.',
    details: ['WhatsApp + Push notifications', '"Almost there" pre-alert', 'Unmistakable green "Called" state'],
  },
  {
    number: '04',
    title: 'Get Served & Rate',
    description: 'Walk up to the assigned counter, get served, and rate your experience — all digitally tracked.',
    details: ['Directed to exact counter/room', 'Visit logged for audit trail', 'Post-visit rating & feedback'],
  },
];

// ==========================================
// Telemedicine Feature Highlights
// ==========================================
export const TELEMEDICINE_HIGHLIGHTS = [
  {
    title: 'Peer-to-Peer WebRTC',
    description: 'Direct browser-to-browser video calls. No Twilio, no LiveKit, no third-party SFU dependency.',
    iconName: 'Radio',
  },
  {
    title: 'Pre-Join Device Check',
    description: 'Camera, mic, and speaker test before entering the call. No mid-call surprises.',
    iconName: 'MonitorCheck',
  },
  {
    title: 'In-Call Clinical Tools',
    description: 'SOAP notes, e-prescriptions, and patient history panel available during the video call.',
    iconName: 'ClipboardPlus',
  },
  {
    title: 'Payment-Gated Access',
    description: 'Patients pay via Razorpay before joining. Room access is granted only after confirmed payment.',
    iconName: 'CreditCard',
  },
];

// ==========================================
// Testimonials
// ==========================================
export const TESTIMONIALS_DATA: TestimonialItem[] = [
  {
    id: '1',
    quote: 'Cuely reduced our clinic lobby congestion by 78%. Patients love being able to wait in their cars or grab coffee nearby.',
    author: 'Dr. Sarah Jenkins',
    role: 'Medical Director',
    company: 'Apex Healthcare Network',
    avatarUrl: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&auto=format&fit=crop&q=80',
    rating: 5,
    metric: '78% less lobby congestion',
  },
  {
    id: '2',
    quote: 'Setting up the kiosk took less than 15 minutes. Our staff counter efficiency improved by 40% in the very first week.',
    author: 'Marcus Vance',
    role: 'VP of Retail Operations',
    company: 'Summit flagship stores',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    rating: 5,
    metric: '40% faster counter throughput',
  },
  {
    id: '3',
    quote: 'The AI wait-time predictions are insanely accurate. Customer dissatisfaction from waiting dropped to virtually zero.',
    author: 'Elena Rostova',
    role: 'Head of Customer Experience',
    company: 'Vanguard Services',
    avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    rating: 5,
    metric: '99.4% customer satisfaction',
  },
];

// ==========================================
// FAQ — expanded with new items
// ==========================================
export const FAQ_DATA: FaqItem[] = [
  {
    id: '1',
    question: 'How do customers join the queue without downloading an app?',
    answer: 'Customers simply scan a QR code placed at your entrance using their smartphone camera. It opens a lightweight web app instantly where they enter their name/phone number and get a digital ticket.',
    category: 'General',
  },
  {
    id: '2',
    question: 'Can Cuely work with existing hardware or touchscreen kiosks?',
    answer: 'Yes! Cuely runs seamlessly in any web browser and supports touchscreen kiosk displays, tablet check-ins, thermal receipt printers, and overhead TV displays.',
    category: 'Hardware',
  },
  {
    id: '3',
    question: 'Does Cuely support SMS and WhatsApp notifications?',
    answer: 'Absolutely. Automated text messages and WhatsApp notifications are sent when a customer joins the queue, when their turn is coming up, and when their counter is ready.',
    category: 'Notifications',
  },
  {
    id: '4',
    question: 'Can I manage multiple queues or departments simultaneously?',
    answer: 'Yes. Cuely supports unlimited queues per location. Each queue can have its own service counters, staff assignments, and notification templates. The admin dashboard provides a unified view across all active queues.',
    category: 'Operations',
  },
  {
    id: '5',
    question: 'How is patient data isolated between different clinics?',
    answer: 'Cuely uses Supabase Row-Level Security (RLS) policies to ensure strict data isolation. Each business can only access their own patients, queues, and analytics. Data never leaks between tenants.',
    category: 'Security',
  },
  {
    id: '6',
    question: 'Does the video consultation require patients to install Zoom or another app?',
    answer: 'No. Cuely uses peer-to-peer WebRTC built directly into the browser. Patients join the video call from any modern browser with a single click — no downloads, no accounts, no plugins.',
    category: 'Telemedicine',
  },
  {
    id: '7',
    question: 'What languages are supported?',
    answer: 'Cuely supports English, Hindi, and Marathi out of the box — including translated WhatsApp/SMS notification templates. More languages can be added via the i18n configuration.',
    category: 'Localization',
  },
  {
    id: '8',
    question: 'Can we try Cuely before committing to a plan?',
    answer: 'Yes, we offer a 14-day free trial with full access to all features, including unlimited tickets, SMS alerts, and staff accounts.',
    category: 'Billing',
  },
];

// ==========================================
// Footer Columns (Privacy link updated)
// ==========================================
export const FOOTER_COLUMNS: FooterColumn[] = [
  {
    title: 'Product',
    links: [
      { label: 'Features', href: '#features' },
      { label: 'Kiosk Mode', href: '/kiosk' },
      { label: 'Patient Portal', href: '/portal/login' },
      { label: 'Queue Management', href: '/queue' },
      { label: 'Staff Dashboard', href: '/login' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About Us', href: '#how-it-works' },
      { label: 'Customers', href: '#testimonials' },
      { label: 'Careers', href: '#' },
      { label: 'Blog', href: '#' },
    ],
  },
  {
    title: 'Legal & Privacy',
    links: [
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Terms of Service', href: '#' },
      { label: 'Security & HIPAA', href: '#' },
      { label: 'GDPR Compliance', href: '#' },
    ],
  },
];
