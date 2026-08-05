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

export interface FeatureItem {
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

export const LANDING_CONFIG = {
  brandName: 'Cuely',
  brandTagline: 'Next-Generation Smart Queue & Visitor Management System',
  badgeText: 'Cuely 2.0 is here',
  heroHeadline: 'Eliminate lines. Delight customers with ',
  heroAccentPhrase: 'unfair speed.',
  heroSubheadline:
    'Cuely transforms physical wait times into seamless digital experiences. Give your visitors real-time SMS updates, virtual queue tokens, and predictive wait times.',
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

export const FEATURES_DATA: FeatureItem[] = [
  {
    id: '1',
    title: 'Virtual QR Check-In',
    description: 'Visitors scan a QR code at the entrance to join the queue instantly without downloading an app.',
    iconName: 'QrCode',
    badge: 'Zero Friction',
    accentColor: '#3b82f6',
  },
  {
    id: '2',
    title: 'Real-Time WhatsApp & SMS Alerts',
    description: 'Automated notifications notify visitors when their turn is approaching so they can roam freely.',
    iconName: 'MessageSquare',
    badge: 'Live Sync',
    accentColor: '#8b5cf6',
  },
  {
    id: '3',
    title: 'AI Wait-Time Predictor',
    description: 'Smart algorithm calculates precise estimated wait times based on historical counter throughput.',
    iconName: 'Sparkles',
    badge: 'AI Powered',
    accentColor: '#06b6d4',
  },
  {
    id: '4',
    title: 'Multi-Counter Dashboard',
    description: 'Staff members manage tickets, recall patients/customers, and transfer calls with a single click.',
    iconName: 'Monitor',
    badge: 'Staff Ready',
    accentColor: '#10b981',
  },
  {
    id: '5',
    title: 'Analytics & Bottleneck Insights',
    description: 'Detailed reporting on peak hours, service speed, no-shows, and staff performance metrics.',
    iconName: 'BarChart3',
    badge: 'Deep Data',
    accentColor: '#f59e0b',
  },
  {
    id: '6',
    title: 'Self-Service Kiosk Mode',
    description: 'Interactive touchscreen interface for walk-in check-ins with thermal ticket printing support.',
    iconName: 'Smartphone',
    badge: 'Hardware Sync',
    accentColor: '#06b6d4',
  },
];

export const HOW_IT_WORKS_STEPS: StepItem[] = [
  {
    number: '01',
    title: 'Check-In Remotely or On-Site',
    description: 'Customers scan a QR code on their smartphone or tap the self-service kiosk to claim their ticket number.',
    details: ['No app installation needed', 'Select specific department or service', 'SMS / WhatsApp link issued instantly'],
  },
  {
    number: '02',
    title: 'Relax & Track Live Queue Status',
    description: 'Visitors monitor their position live from their phone, receiving timely updates as their number approaches.',
    details: ['Live position countdown', 'Dynamic estimated wait time', 'Freedom to wait nearby'],
  },
  {
    number: '03',
    title: 'Step Up to the Called Counter',
    description: 'When called, staff chime the ticket number on overhead screens and push an instant alert directly to the visitor.',
    details: ['Audio & visual display ping', 'Direct counter direction', '1-click ticket resolution'],
  },
];

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
    question: 'How hard is it to integrate with our current database/CRM?',
    answer: 'Cuely provides clean REST and GraphQL APIs along with Webhooks. You can easily sync queue activity, patient records, or customer IDs in real-time.',
    category: 'Integrations',
  },
  {
    id: '5',
    question: 'Can we try Cuely before committing to a plan?',
    answer: 'Yes, we offer a 14-day free trial with full access to all features, including unlimited tickets, SMS alerts, and staff accounts.',
    category: 'Billing',
  },
];

export const FOOTER_COLUMNS: FooterColumn[] = [
  {
    title: 'Product',
    links: [
      { label: 'Features', href: '#features' },
      { label: 'Kiosk Mode', href: '/kiosk' },
      { label: 'Customer Portal', href: '/patient' },
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
      { label: 'Privacy Policy', href: '#' },
      { label: 'Terms of Service', href: '#' },
      { label: 'Security & HIPAA', href: '#' },
      { label: 'GDPR Compliance', href: '#' },
    ],
  },
];
