'use client';

import type { FC } from 'react';
import { Button, Dropdown, Tooltip } from '@heroui/react';

import { signOutUser } from '@/app/actions/auth';

function SettingsIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-current">
      <path d="M19.14 12.936c.036-.315.06-.636.06-.936s-.024-.621-.07-.936l2.03-1.58a.48.48 0 0 0 .12-.61l-1.92-3.32a.488.488 0 0 0-.57-.22l-2.39.96a7.38 7.38 0 0 0-1.62-.936l-.36-2.54A.488.488 0 0 0 14 2h-4a.49.49 0 0 0-.49.42l-.36 2.54c-.59.24-1.13.56-1.62.936l-2.39-.96a.488.488 0 0 0-.57.22L2.74 8.87a.486.486 0 0 0 .12.61l2.03 1.58c-.046.315-.07.636-.07.936s.024.621.07.936l-2.03 1.58a.48.48 0 0 0-.12.61l1.92 3.32c.14.24.39.31.57.22l2.39-.96c.49.38 1.03.7 1.62.936l.36 2.54c.05.24.27.42.49.42h4c.24 0 .44-.18.49-.42l.36-2.54c.59-.24 1.13-.56 1.62-.936l2.39.96c.19.09.44.02.57-.22l1.92-3.32a.486.486 0 0 0-.12-.61l-2.03-1.58ZM12 15.6A3.6 3.6 0 1 1 12 8.4a3.6 3.6 0 0 1 0 7.2Z" />
    </svg>
  );
}

type Props = {
  userName?: string | null;
};

const SidebarFooter: FC<Props> = ({ userName }) => (
  <Dropdown>
    <Tooltip>
      <Dropdown.Trigger>
        <Tooltip.Trigger>
          <Button
            isIconOnly
            aria-label="User settings"
            className="h-12 w-12 rounded-[24px] bg-[#313338] text-[#dbdee1] hover:rounded-[16px] hover:bg-[#5865f2] hover:text-white"
            variant="ghost"
          >
            <SettingsIcon />
          </Button>
        </Tooltip.Trigger>
      </Dropdown.Trigger>
      <Tooltip.Content>Settings</Tooltip.Content>
    </Tooltip>
    <Dropdown.Popover placement="right bottom">
      <Dropdown.Menu aria-label="User menu">
        {userName ? (
          <Dropdown.Item id="user" isDisabled className="text-[#b5bac1]">
            {userName}
          </Dropdown.Item>
        ) : null}
        <Dropdown.Item
          id="sign-out"
          className="text-danger"
          onAction={() => {
            void signOutUser();
          }}
        >
          Sign out
        </Dropdown.Item>
      </Dropdown.Menu>
    </Dropdown.Popover>
  </Dropdown>
);

export default SidebarFooter;
