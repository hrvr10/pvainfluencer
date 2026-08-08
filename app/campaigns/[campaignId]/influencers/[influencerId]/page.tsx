'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Conversation, Influencer, InfluencerStatus } from '@/lib/types';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Navbar } from '@/components/Navbar';
import { RoleGate } from '@/components/RoleGate';
import { useAuth } from '@/components/AuthProvider';
import { canEdit } from '@/lib/roles';
import { StageTrail } from '@/components/StageTrail';
import { ConversationFormModal } from '@/components/ConversationFormModal';

export default function InfluencerDetailPage() {
  const { campaignId, influencerId } = useParams<{ campaignId: string; influencerId: string }>();
  const { profile } = useAuth();
  const [influencer, setInfluencer] = useState<Influencer | null | undefined>(undefined);
  const [conversations, setConversations] = useState<Conversation[] | null>(null);
  const [showLogForm, setShowLogForm] = useState(false);

  const influencerRef = doc(db, 'campaigns', campaignId, 'influencers', influencerId);

  useEffect(() => {
    return onSnapshot(influencerRef, (snap) => {
      setInfluencer(snap.exists() ? ({ id: snap.id, ...(snap.data() as any) }) : null);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaignId, influencerId]);

  useEffect(() => {
    const q = query(collection(influencerRef, 'conversations'), orderBy('date', 'desc'));
    return onSnapshot(q, (snap) => {
      setConversations(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaignId, influencerId]);

  async function setStatus(status: InfluencerStatus) {
    await updateDoc(influencerRef, { status });
  }

  return (
    <ProtectedRoute>
      <Navbar />
      <main className="mx-auto max-w-4xl px-6 py-10">
        <Link
          href={`/campaigns/${campaignId}`}
          className="font-mono text-xs uppercase tracking-wide text-muted hover:text-pine-700"
        >
          ← Back to campaign
        </Link>

        {influencer === undefined && <p className="mt-4 font-mono text-sm text-muted">loading…</p>}
        {influencer === null && <p className="mt-4 text-sm text-rust-500">Influencer not found.</p>}

        {influencer && (
          <>
            <div className="mt-3 flex items-start justify-between">
              <div className="flex items-start gap-4">
                {influencer.profileScreenshotUrl && (
                  <a href={influencer.profileScreenshotUrl} target="_blank" rel="noreferrer">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={influencer.profileScreenshotUrl}
                      alt=""
                      className="h-16 w-16 rounded-full object-cover"
                    />
                  </a>
                )}
                <div>
                  <h1 className="font-display text-3xl">{influencer.name}</h1>
                  <p className="font-mono text-sm text-muted">
                    {influencer.handle} · <span className="capitalize">{influencer.platform}</span>
                    {influencer.followers ? ` · ${influencer.followers.toLocaleString()} followers` : ''}
                  </p>
                </div>
              </div>
              <RoleGate allow={['admin', 'manager']}>
                {influencer.status !== 'declined' && (
                  <button
                    onClick={() => setStatus('declined')}
                    className="font-mono text-xs uppercase tracking-wide text-muted hover:text-rust-500"
                  >
                    Mark declined
                  </button>
                )}
              </RoleGate>
            </div>

            <section className="mt-6">
              <StageTrail
                status={influencer.status}
                editable={canEdit(profile?.role)}
                onAdvance={setStatus}
              />
            </section>

            <section className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <DetailCard label="Email" value={influencer.email} />
              <DetailCard label="Phone" value={influencer.phone} />
              <DetailCard label="Niche" value={influencer.niche} />
              <DetailCard label="Location" value={influencer.location} />
              <DetailCard label="Rate / quote" value={influencer.rate} />
              <DetailCard label="Product chosen" value={influencer.productChosen} />
              <DetailCard label="Shipping address" value={influencer.shippingAddress} />
            </section>

            {influencer.notes && (
              <section className="mt-6 card p-4">
                <p className="mb-1 font-mono text-[10px] uppercase tracking-widest text-muted">Notes</p>
                <p className="text-sm text-ink/80">{influencer.notes}</p>
              </section>
            )}

            <section className="mt-10">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-display text-xl">Conversation history</h2>
                <RoleGate allow={['admin', 'manager']}>
                  <button onClick={() => setShowLogForm(true)} className="btn-primary">
                    + Log conversation
                  </button>
                </RoleGate>
              </div>

              {conversations?.length === 0 && (
                <p className="text-sm text-muted">No conversations logged yet.</p>
              )}

              <ol className="space-y-3">
                {conversations?.map((c) => {
                  const shots = c.screenshotUrls?.length ? c.screenshotUrls : c.screenshotUrl ? [c.screenshotUrl] : [];
                  return (
                    <li key={c.id} className="card p-4">
                      <div className="mb-1 flex items-center justify-between">
                        <span className="font-mono text-xs text-pine-700">{formatDate(c.date)}</span>
                        <span className="text-xs text-muted">logged by {c.loggedByName}</span>
                      </div>
                      <p className="text-sm text-ink/80">{c.summary}</p>
                      {c.nextFollowUp && (
                        <p className="mt-2 font-mono text-xs uppercase tracking-wide text-citrine-600">
                          Follow up by {formatDate(c.nextFollowUp)}
                        </p>
                      )}
                      {shots.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {shots.map((url, i) => (
                            <a key={i} href={url} target="_blank" rel="noreferrer">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={url}
                                alt="Chat screenshot"
                                className="h-16 w-16 rounded object-cover"
                              />
                            </a>
                          ))}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ol>
            </section>
          </>
        )}
      </main>

      {showLogForm && influencer && (
        <ConversationFormModal
          campaignId={campaignId}
          influencer={influencer}
          onClose={() => setShowLogForm(false)}
        />
      )}
    </ProtectedRoute>
  );
}

function DetailCard({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="card p-4">
      <p className="mb-1 font-mono text-[10px] uppercase tracking-widest text-muted">{label}</p>
      <p className="text-sm text-ink/80">{value || '—'}</p>
    </div>
  );
}

function formatDate(iso: string) {
  if (!iso) return '';
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
}
