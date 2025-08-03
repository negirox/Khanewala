
import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { appConfigPromise } from "@/lib/config";
import { PT_Sans, Roboto_Slab } from 'next/font/google';

const ptSans = PT_Sans({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-pt-sans',
});

const robotoSlab = Roboto_Slab({
  subsets: ['latin'],
  variable: '--font-roboto-slab',
});

export async function generateMetadata(): Promise<Metadata> {
  const appConfig = await appConfigPromise;
  return {
    title: appConfig.title,
    description: "Restaurant Management System",
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const appConfig = await appConfigPromise;

  return (
    <html lang="en" className={appConfig.theme}>
      <body className={`${appConfig.font === 'pt-sans' ? ptSans.variable : robotoSlab.variable} ${appConfig.font === 'pt-sans' ? 'font-body' : 'font-headline'} antialiased`} suppressHydrationWarning>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
