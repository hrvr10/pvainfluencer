'use client';

import Link from 'next/link';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useAuth } from './AuthProvider';
import { ROLE_LABELS } from '@/lib/roles';
import { RoleGate } from './RoleGate';

export function Navbar() {
  const { profile } = useAuth();

  return (
    <header className="border-b border-line bg-surface">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/dashboard" className="flex items-baseline gap-2">
          <span className="font-display text-lg italic tracking-tight">PVA InfluenceOS</span>
          <span className="hidden text-sm text-muted sm:inline">Influencer collabs</span>
        </Link>

        <nav className="flex items-center gap-5">
          <Link href="/dashboard" className="text-sm text-ink/80 hover:text-ink">
            Campaigns
          </Link>
          <RoleGate allow={['admin']}>
            <Link href="/admin/users" className="text-sm text-ink/80 hover:text-ink">
              Team
            </Link>
          </RoleGate>

          {profile && (
            <div className="flex items-center gap-3 border-l border-line pl-5">
              <div className="text-right leading-tight">
                <div className="text-sm">{profile.name || profile.email}</div>
                <div className="text-xs text-muted">{ROLE_LABELS[profile.role]}</div>
              </div>
              <button
                onClick={() => signOut(auth)}
                className="rounded-sm border border-line px-3 py-1.5 text-xs text-muted transition hover:border-rust-500 hover:text-rust-500"
              >
                Sign out
              </button>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
