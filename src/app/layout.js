import { Inter, Hind_Siliguri } from 'next/font/google';
import './globals.css';

import ServiceWorkerRegistration from '@/components/ServiceWorkerRegistration';
import BottomNav from '@/components/layout/BottomNav';
import PWALoading from '@/components/PWALoading';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const hindSiliguri = Hind_Siliguri({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['bengali'],
  variable: '--font-bangla',
});

export const metadata = {
  title: 'Tour Guide - Bangladesh Travel Companion',
  description: 'Your AI-powered travel companion for exploring Bangladesh. Discover tourist places, plan optimized routes, and get smart insights.',
  manifest: '/manifest.json',
};

export const viewport = {
  themeColor: '#059669',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${hindSiliguri.variable} font-sans antialiased`} suppressHydrationWarning>
        <PWALoading />
        <div suppressHydrationWarning>
          {children}
        </div>
        <BottomNav />
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}
