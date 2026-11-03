import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { cn } from '@/utils/cn';
import { ClerkProvider } from '@clerk/nextjs';
import { TooltipProvider } from '@/ui/common/tooltip';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: {
    default: 'University Complaint and Issue Tracking Platform',
    template: '%s | University Complaint and Issue Tracking Platform',
  },
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
        <ClerkProvider
          appearance={{
            variables: {
              colorPrimary: '#155dfc',
              borderRadius: '0.625rem',
              fontFamily: 'inherit',
            },
          }}
        >
          <TooltipProvider>{children}</TooltipProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
