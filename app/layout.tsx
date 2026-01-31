import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'Montessori - AI Learning Coach',
  description: 'Transform your commute into productive learning time with AI-powered voice conversations.',
  keywords: ['AI', 'learning', 'education', 'voice', 'commute', 'tutor'],
  authors: [{ name: 'Montessori AI' }],
  openGraph: {
    title: 'Montessori - AI Learning Coach',
    description: 'Transform your commute into productive learning time with AI-powered voice conversations.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans antialiased bg-white text-gray-900">
        {children}
      </body>
    </html>
  );
}
