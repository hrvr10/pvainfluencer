'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Campaign, CampaignStatus } from '@/lib/types';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Navbar } from '@/components/Navbar';
import { RoleGate } from '@/components/RoleGate';
import { CampaignFormModal } from '@/components/CampaignFormModal';

const STATUS_LABEL: Record<CampaignStatus, string> = {
  planning: 'Planning',
  active: 'Active',
  completed: 'Completed',
};

export default function DashboardPage() {
  const [campaigns, setCampaigns] = useState<Campaign[] | null>(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'campaigns'), orderBy('startDate', 'desc'));
    return onSnapshot(q, (snap) => {
      setCampaigns(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
    });
  }, []);

  return (
    <ProtectedRoute>
      <Navbar />
      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h1 className="font-display text-3xl">Brand campaigns</h1>
            <p className="mt-1 text-sm text-muted">
              Every collaboration, grouped by brand and campaign date.
            </p>
          </div>
          <RoleGate allow={['admin', 'manager']}>
            <button onClick={() => setShowForm(true)} className="btn-primary">
              + New campaign
            </button>
          </RoleGate>
        </div>

        {campaigns === null && <p className="text-sm text-muted">Loading campaigns…</p>}

        {campaigns?.length === 0 && (
          <div className="card p-10 text-center">
            <p className="font-display text-xl italic text-ink/70">No campaigns yet</p>
            <p className="mt-1 text-sm text-muted">
              Start one to begin tracking influencers and conversations for a brand.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {campaigns?.map((c) => (
            <Link
              key={c.id}
              href={`/campaigns/${c.id}`}
              className="card group flex flex-col justify-between p-5 transition hover:border-pine-600"
            >
              <div>
                <div className="mb-3 flex items-start justify-between">
                  <span className="inline-flex items-center rounded-full bg-pine-50 px-2.5 py-0.5 text-xs font-medium text-pine-700">
                    {STATUS_LABEL[c.status]}
                  </span>
                  <span className="text-xs text-muted">
                    {formatDate(c.startDate)}
                    {c.endDate ? ` – ${formatDate(c.endDate)}` : ''}
                  </span>
                </div>
                <h2 className="font-display text-xl italic leading-snug group-hover:text-pine-700">
                  {c.brandName}
                </h2>
                <p className="text-sm text-ink/70">{c.campaignName}</p>
              </div>
              <div className="mt-4 border-t border-line pt-3 text-xs text-muted">
                Started by {c.createdByName}
              </div>
            </Link>
          ))}
        </div>
      </main>

      {showForm && <CampaignFormModal onClose={() => setShowForm(false)} />}
    </ProtectedRoute>
  );
}

function formatDate(iso: string) {
  if (!iso) return '';
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
}
