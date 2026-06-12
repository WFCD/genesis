import type { FC } from 'react';
import Link from 'next/link';

const SiteFooter: FC = () => (
  <footer className="mt-auto border-t border-white/10 px-6 py-4 text-sm text-[#949ba4]">
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
      <Link href="/privacy" className="hover:text-[#dbdee1]">
        Privacy Policy
      </Link>
      <Link href="/tos" className="hover:text-[#dbdee1]">
        Terms of Service
      </Link>
    </div>
  </footer>
);

export default SiteFooter;
