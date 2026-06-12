import type { FC } from 'react';

type Props = {
  bannerUrl: string;
};

const GuildBannerBackdrop: FC<Props> = ({ bannerUrl }) => (
  <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 z-0 h-48 overflow-hidden sm:h-52">
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img src={bannerUrl} alt="" className="h-full w-full object-cover opacity-75" />
    <div className="absolute inset-0 bg-gradient-to-b from-[#313338]/25 via-[#313338]/65 to-[#313338]" />
  </div>
);

export default GuildBannerBackdrop;
