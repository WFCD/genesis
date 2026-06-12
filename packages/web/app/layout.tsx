import type { FC, ReactNode } from 'react';
import type { Metadata } from 'next';

import './globals.css';

import { getAppName, getDashboardTitle } from '@/lib/content/branding';
import { fetchBotAvatarUrl } from '@/lib/discord';

export async function generateMetadata(): Promise<Metadata> {
  const icon = await fetchBotAvatarUrl(32);
  const appName = getAppName();

  return {
    title: getDashboardTitle(),
    description: `Manage ${appName} bot settings for your Discord server`,
    icons: {
      icon: icon,
      apple: icon,
    },
  };
}

type Props = {
  children: ReactNode;
};

const RootLayout: FC<Props> = ({ children }) => (
  <html lang="en" className="dark h-full">
    <body className="min-h-full bg-[#313338] font-sans antialiased">{children}</body>
  </html>
);

export default RootLayout;
