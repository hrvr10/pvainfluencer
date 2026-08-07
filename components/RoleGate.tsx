'use client';

import { ReactNode } from 'react';
import { useAuth } from './AuthProvider';
import { Role } from '@/lib/types';

export function RoleGate({ allow, children }: { allow: Role[]; children: ReactNode }) {
  const { profile } = useAuth();
  if (!profile || !allow.includes(profile.role)) return null;
  return <>{children}</>;
}
