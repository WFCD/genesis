'use client';

import Image from 'next/image';
import { useEffect, useState, type FC } from 'react';
import { cn } from '@heroui/react';

type Props = {
  className?: string;
};

const HomeBanner: FC<Props> = ({ className }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div className={cn('relative w-full overflow-hidden', className)}>
      <Image
        src="/banner.png"
        alt=""
        width={1920}
        height={480}
        priority
        className={cn(
          'h-44 w-full object-cover transition-opacity duration-[1400ms] ease-out sm:h-52 md:h-60',
          visible ? 'opacity-80' : 'opacity-0'
        )}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#313338]/20 via-[#313338]/55 to-[#313338]"
      />
    </div>
  );
};

export default HomeBanner;
