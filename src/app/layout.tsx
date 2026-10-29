import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { cn } from '@/utils/cn';
import { ClerkProvider } from '@clerk/nextjs';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: 'University Complaint and Issue Tracking Platform',
  description:
    'Submit, track and manage university complaints and issues in one place.',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang='en'
      className={cn('h-full', 'antialiased', 'font-sans', inter.variable)}
    >
      <body className='flex min-h-full flex-col'>
        <ClerkProvider>{children}</ClerkProvider>
      </body>
    </html>
  );
}
