'use client';

import { useEffect, useState, type FC } from 'react';
import { cn } from '@heroui/react';

import HomeBanner from './HomeBanner';

type Props = {
  appName: string;
  logoUrl: string;
};

const HomeSignInHeader: FC<Props> = ({ appName, logoUrl }) => {
  const [logoVisible, setLogoVisible] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setLogoVisible(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div className="relative shrink-0">
      <HomeBanner />
      <div className="absolute inset-x-0 bottom-0 z-10 flex translate-y-1/2 justify-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={logoUrl}
          alt={appName}
          width={112}
          height={112}
          className={cn(
            'h-28 w-28 rounded-full border-[6px] border-[#313338] bg-[#313338] object-cover shadow-[0_8px_24px_rgba(0,0,0,0.45)] transition-opacity duration-[1400ms] ease-out',
            logoVisible ? 'opacity-100' : 'opacity-0'
          )}
        />
      </div>
    </div>
  );
};

export default HomeSignInHeader;
