'use client';

import type { FC } from 'react';
import { Button } from '@heroui/react';

const SignInButton: FC = () => (
  <Button type="submit" variant="primary">
    Sign in with Discord
  </Button>
);

export default SignInButton;
