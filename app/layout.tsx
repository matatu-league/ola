import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { CartProvider } from '@/contexts/CartContext';
import CartDrawer from '@/components/shared/CartDrawer';
import { UserProvider } from '@/contexts/UserContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import ServiceWorkerRegister from '@/components/shared/ServiceWorkerRegister';
import InstallPrompt from '@/components/shared/InstallPrompt';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Ola — Shop & Book Marketplace',
  description: 'Buy products and book services from trusted local stores, all in one place.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Ola',
  },
  icons: {
    icon: [
      { url: '/icons/icon-any-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-any-512.png', sizes: '512x512', type: 'image/png' },
      { url: '/favicon.ico', sizes: '16x16 32x32', type: 'image/x-icon' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
};

// viewportFit: 'cover' lets content draw edge-to-edge under a phone's notch/
// home-indicator (required for a native-feeling status bar once this ships
// inside an Android WebView wrapper) — safe-area padding is applied per
// surface (see SellerLayout) via env(safe-area-inset-*).
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#161823',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body>
        <ServiceWorkerRegister />
        {/* The rest of your pages render inside {children} */}
        <main className="flex-1">
          <UserProvider>
            <NotificationProvider>
              <CartProvider>
                {children}
                <CartDrawer /> {/* Drawer placed globally here! */}
                <InstallPrompt />
              </CartProvider>
            </NotificationProvider>
          </UserProvider>
        </main>
      </body>
    </html>
  );
}
