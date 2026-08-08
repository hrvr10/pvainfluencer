'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { collection, doc, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Campaign, INFLUENCER_STAGES, Influencer } from '@/lib/types';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Navbar } from '@/components/Navbar';
import { RoleGate } from '@/components/RoleGate';
import { StatusBadge } from '@/components/StatusBadge';
import { InfluencerFormModal } from '@/components/InfluencerFormModal';

const STAGE_ORDER = [...INFLUENCER_STAGES, 'declined'];

type SortKey = 'name' | 'followers' | 'status' | 'lastConversationDate';
type SortDir = 'asc' | 'desc';

export default function CampaignDetailPage() {
  const { campaignId } = useParams<{ campaignId: string }>();
  const [campaign, setCampaign] = useState<Campaign | null | undefined>(undefined);
  const [influencers, setInfluencers] = useState<Influencer[] | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  useEffect(() => {
    return onSnapshot(doc(db, 'campaigns', campaignId), (snap) => {
      setCampaign(snap.exists() ? ({ id: snap.id, ...(snap.data() as any) }) : null);
    });
  }, [campaignId]);

  useEffect(() => {
    const q = query(
      collection(db, 'campaigns', campaignId, 'influencers'),
      orderBy('createdAt', 'desc'),
    );
    return onSnapshot(q, (snap) => {
      setInfluencers(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
    });
  }, [campaignId]);

  function toggleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  }

  const sortedInfluencers = useMemo(() => {
    if (!influencers) return influencers;
    const sorted = [...influencers].sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case 'name':
          cmp = a.name.localeCompare(b.name);
          break;
        case 'followers':
          cmp = (a.followers || 0) - (b.followers || 0);
          break;
        case 'status':
          cmp = STAGE_ORDER.indexOf(a.status) - STAGE_ORDER.indexOf(b.status);
          break;
        case 'lastConversationDate':
          cmp = (a.lastConversationDate || '').localeCompare(b.lastConversationDate || '');
          break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return sorted;
  }, [influencers, sortKey, sortDir]);

  return (
    <ProtectedRoute>
      <Navbar />
      <main className="mx-auto max-w-6xl px-6 py-10">
        <Link href="/dashboard" className="text-sm text-muted hover:text-pine-700">
          ← All campaigns
        </Link>

        {campaign === undefined && <p className="mt-4 text-sm text-muted">Loading…</p>}
        {campaign === null && <p className="mt-4 text-sm text-rust-500">Campaign not found.</p>}

        {campaign && (
          <>
            <div className="mb-8 mt-3 flex items-end justify-between">
              <div>
                <p className="text-sm text-muted">{campaign.brandName}</p>
                <h1 className="font-display text-3xl">{campaign.campaignName}</h1>
                <p className="mt-1 text-sm text-muted">
                  {formatDate(campaign.startDate)}
                  {campaign.endDate ? ` – ${formatDate(campaign.endDate)}` : ''}
                </p>
                {campaign.notes && <p className="mt-2 max-w-xl text-sm text-ink/70">{campaign.notes}</p>}
              </div>
              <RoleGate allow={['admin', 'manager']}>
                <button onClick={() => setShowForm(true)} className="btn-primary">
                  + Add influencer
                </button>
              </RoleGate>
            </div>

            {influencers?.length === 0 && (
              <div className="card p-10 text-center">
                <p className="font-display text-xl italic text-ink/70">No influencers yet</p>
                <p className="mt-1 text-sm text-muted">Add the creators shortlisted for this campaign.</p>
              </div>
            )}

            {sortedInfluencers && sortedInfluencers.length > 0 && (
              <div className="card overflow-hidden overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-line bg-canvas/60">
                    <tr className="text-xs font-medium text-muted">
                      <SortableHeader label="Influencer" sortKey="name" activeKey={sortKey} dir={sortDir} onClick={toggleSort} />
                      <th className="px-4 py-3 font-medium">Platform</th>
                      <SortableHeader label="Followers" sortKey="followers" activeKey={sortKey} dir={sortDir} onClick={toggleSort} />
                      <SortableHeader label="Status" sortKey="status" activeKey={sortKey} dir={sortDir} onClick={toggleSort} />
                      <th className="px-4 py-3 font-medium">Product chosen</th>
                      <SortableHeader
                        label="Last conversation"
                        sortKey="lastConversationDate"
                        activeKey={sortKey}
                        dir={sortDir}
                        onClick={toggleSort}
                      />
                    </tr>
                  </thead>
                  <tbody>
                    {sortedInfluencers.map((inf) => (
                      <tr key={inf.id} className="border-b border-line last:border-0 hover:bg-canvas/40">
                        <td className="px-4 py-3">
                          <Link
                            href={`/campaigns/${campaignId}/influencers/${inf.id}`}
                            className="flex items-center gap-3"
                          >
                            {inf.profileScreenshotUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={inf.profileScreenshotUrl}
                                alt=""
                                className="h-9 w-9 shrink-0 rounded-full object-cover"
                              />
                            ) : (
                              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-canvas font-display text-sm italic text-muted">
                                {inf.name?.[0]?.toUpperCase()}
                              </span>
                            )}
                            <div>
                              <span className="font-medium text-ink hover:text-pine-700">{inf.name}</span>
                              <div className="text-xs text-muted">{inf.handle}</div>
                            </div>
                          </Link>
                        </td>
                        <td className="px-4 py-3 capitalize text-ink/80">{inf.platform}</td>
                        <td className="px-4 py-3 text-ink/80">
                          {inf.followers ? inf.followers.toLocaleString() : '—'}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={inf.status} />
                        </td>
                        <td className="px-4 py-3 text-ink/80">{inf.productChosen || '—'}</td>
                        <td className="px-4 py-3 text-ink/70">
                          {inf.lastConversationDate ? (
                            <div className="flex items-center gap-2">
                              {inf.lastConversationScreenshotUrl && (
                                <a
                                  href={inf.lastConversationScreenshotUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={inf.lastConversationScreenshotUrl}
                                    alt="Last chat screenshot"
                                    className="h-9 w-9 shrink-0 rounded object-cover"
                                  />
                                </a>
                              )}
                              <div>
                                <div>{formatDate(inf.lastConversationDate)}</div>
                                <div className="max-w-xs truncate text-xs text-muted">
                                  {inf.lastConversationSummary}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <span className="text-muted">No contact logged</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </main>

      {showForm && (
        <InfluencerFormModal campaignId={campaignId} onClose={() => setShowForm(false)} />
      )}
    </ProtectedRoute>
  );
}

function SortableHeader({
  label,
  sortKey,
  activeKey,
  dir,
  onClick,
}: {
  label: string;
  sortKey: SortKey;
  activeKey: SortKey;
  dir: SortDir;
  onClick: (key: SortKey) => void;
}) {
  const active = sortKey === activeKey;
  return (
    <th className="px-4 py-3 font-medium">
      <button
        type="button"
        onClick={() => onClick(sortKey)}
        className={`flex items-center gap-1 ${active ? 'text-pine-700' : 'hover:text-ink'}`}
      >
        {label}
        <span>{active ? (dir === 'asc' ? '↑' : '↓') : ''}</span>
      </button>
    </th>
  );
}

function formatDate(iso: string) {
  if (!iso) return '';
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
}
