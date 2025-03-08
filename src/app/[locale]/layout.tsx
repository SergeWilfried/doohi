import '@/styles/global.css';
import { Providers } from "@/components/theme-provider"

import type { Metadata } from 'next';
import { NextIntlClientProvider, useMessages } from 'next-intl';
import { unstable_setRequestLocale } from 'next-intl/server';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import { AllLocales } from '@/utils/AppConfig';

export const metadata: Metadata = {
  title: "Crowdfunding Central",
  description: "Support our community projects",
  icons: [
    {
      rel: 'apple-touch-icon',
      url: '/apple-touch-icon.png',
    },
    {
      rel: 'icon',
      type: 'image/png',
      sizes: '32x32',
      url: '/favicon-32x32.png',
    },
    {
      rel: 'icon',
      type: 'image/png',
      sizes: '16x16',
      url: '/favicon-16x16.png',
    },
    {
      rel: 'icon',
      url: '/favicon.ico',
    },
  ],
};

export function generateStaticParams() {
  return AllLocales.map(locale => ({ locale }));
}

export default function RootLayout(props: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  unstable_setRequestLocale(props.params.locale);

  // Using internationalization in Client Components
  const messages = useMessages();

  // The `suppressHydrationWarning` in <html> is used to prevent hydration errors caused by `next-themes`.
  // Solution provided by the package itself: https://github.com/pacocoursey/next-themes?tab=readme-ov-file#with-app

  // The `suppressHydrationWarning` attribute in <body> is used to prevent hydration errors caused by Sentry Overlay,
  // which dynamically adds a `style` attribute to the body tag.
  return (
    <html lang={props.params.locale} suppressHydrationWarning>
      <body className={`bg-background text-foreground ${GeistSans.variable} ${GeistMono.variable} font-sans antialiased`} suppressHydrationWarning>
      <Providers>

        {/* PRO: Dark mode support for Shadcn UI */}
        <NextIntlClientProvider
          locale={props.params.locale}
          messages={messages}
        >
           <div className="min-h-screen bg-background text-foreground">
            <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <div className="max-w-4xl mx-auto">{props.children}</div>
            </main>
          </div>
        </NextIntlClientProvider>
        </Providers>
      </body>
    </html>
  );
}
