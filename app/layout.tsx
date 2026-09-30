import type { Metadata, Viewport } from 'next';
import { Inter, Sora } from 'next/font/google';
import { site } from '@/lib/content';
import './globals.css';

const sora = Sora({ subsets: ['latin'], variable: '--font-sora', display: 'swap', weight: ['300', '400', '600', '700'] });
const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });

const description =
  'SVR Tech Groups is a Hyderabad software agency building custom websites, mobile apps, AI agents and AI workflow automations. AI-accelerated, human-verified, shipped fast.';

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: 'SVR Tech Groups | Custom Software, Built Faster with AI', template: '%s | SVR Tech Groups' },
  description,
  applicationName: 'SVR Tech Groups',
  keywords: ['SVR Tech Groups', 'software agency Hyderabad', 'custom software development', 'website development', 'mobile app development', 'AI agents', 'AI workflow automation'],
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    url: site.url,
    siteName: 'SVR Tech Groups',
    title: 'SVR Tech Groups | Custom Software, Built Faster with AI',
    description,
    locale: 'en_IN',
    // add /public/og.png (1200×630) and it will be picked up here
    images: [{ url: '/og.png', width: 1200, height: 630, alt: 'SVR Tech Groups' }],
  },
  twitter: { card: 'summary_large_image', title: 'SVR Tech Groups', description, images: ['/og.png'] },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = { themeColor: '#FFFFFF', width: 'device-width', initialScale: 1 };

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'SVR Tech Groups',
  url: site.url,
  email: site.email,
  telephone: site.phone,
  foundingDate: '2026',
  address: { '@type': 'PostalAddress', addressLocality: 'Hyderabad', addressRegion: 'Telangana', addressCountry: 'IN' },
  sameAs: [site.social.linkedin, site.social.instagram],
  slogan: site.tagline,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sora.variable} ${inter.variable}`}>
      <body>
        <a href="#main" className="sr-only z-[100] rounded-xl bg-primary px-4 py-3 font-semibold text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-4">
          Skip to content
        </a>
        {children}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </body>
    </html>
  );
}
