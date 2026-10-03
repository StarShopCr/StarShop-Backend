import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { TrustlessWorkProvider } from '@/providers/trustless-work-provider';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'StarShop Backend',
  description: 'StarShop Backend - Review & Rating System for Sellers',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <TrustlessWorkProvider>{children}</TrustlessWorkProvider>
      </body>
    </html>
  );
}
