import type { FC } from 'react';

type Props = {
  label?: string;
};

const LoadingIndicator: FC<Props> = ({ label = 'Loading…' }) => (
  <div className="flex items-center gap-2 text-sm text-[#949ba4]">
    <div
      aria-hidden="true"
      className="h-4 w-4 animate-spin rounded-full border-2 border-[#5865f2] border-t-transparent"
    />
    <span>{label}</span>
  </div>
);

export default LoadingIndicator;
