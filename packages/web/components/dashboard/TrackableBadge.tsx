'use client';

import type { FC } from 'react';
import { Tooltip } from '@heroui/react';

import { formatTrackableLabel } from '@/lib/meta/trackableLabels';

import { RemoveButton } from './FormControls';

type Props = {
  trackable: string;
  onRemove: () => void;
};

const TrackableBadge: FC<Props> = ({ trackable, onRemove }) => {
  const label = formatTrackableLabel(trackable);

  return (
    <div className="flex items-center gap-0.5 rounded-full border border-white/10 bg-[#1e1f22] py-0.5 pl-2.5 pr-0.5">
      <Tooltip>
        <Tooltip.Trigger>
          <span className="max-w-[16rem] truncate text-sm text-[#dbdee1]">{label}</span>
        </Tooltip.Trigger>
        <Tooltip.Content>{trackable}</Tooltip.Content>
      </Tooltip>
      <div className="translate-y-0.5 shrink-0">
        <RemoveButton compact label={`Remove ${label}`} onPress={onRemove} />
      </div>
    </div>
  );
};

export default TrackableBadge;
