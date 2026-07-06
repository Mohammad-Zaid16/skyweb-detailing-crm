import type { Metadata } from 'next';
import './globals.css';
import Sidebar from '@/components/Sidebar';
import PageTransition from '@/components/PageTransition';
import { ToastProvider } from '@/components/Toast';

export const metadata: Metadata = {
  title: 'SkyWeb Detailing CRM',
  description: 'AI-powered lead and booking automation for auto detailing businesses',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ToastProvider>
          <div className="app-shell">
            <Sidebar />
            <main style={{ flex: 1, minWidth: 0 }}>
              <PageTransition>{children}</PageTransition>
            </main>
          </div>
        </ToastProvider>
      </body>
    </html>
  );
}
