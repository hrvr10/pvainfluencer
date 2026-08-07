'use client';

import { useState } from 'react';
import { collection, addDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from './AuthProvider';
import { Modal } from './CampaignFormModal';

export function ConversationFormModal({
  campaignId,
  influencerId,
  onClose,
}: {
  campaignId: string;
  influencerId: string;
  onClose: () => void;
}) {
  const { profile } = useAuth();
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [summary, setSummary] = useState('');
  const [nextFollowUp, setNextFollowUp] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    const loggedByName = profile?.name || profile?.email || 'Unknown';
    const influencerRef = doc(db, 'campaigns', campaignId, 'influencers', influencerId);

    await addDoc(collection(influencerRef, 'conversations'), {
      date,
      summary,
      nextFollowUp: nextFollowUp || null,
      loggedByName,
      createdAt: serverTimestamp(),
    });

    // Denormalize onto the influencer doc so the campaign roster table can
    // show "last conversation" without a query per row.
    await updateDoc(influencerRef, {
      lastConversationDate: date,
      lastConversationSummary: summary,
    });

    setSubmitting(false);
    onClose();
  }

  return (
    <Modal title="Log a conversation" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Date">
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="input"
            />
          </Field>
          <Field label="Next follow-up (optional)">
            <input
              type="date"
              value={nextFollowUp}
              onChange={(e) => setNextFollowUp(e.target.value)}
              className="input"
            />
          </Field>
        </div>
        <Field label="What was discussed">
          <textarea
            required
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            className="input min-h-24"
            placeholder="e.g. Sent the rate card, they asked for two extra reels…"
          />
        </Field>

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <button type="submit" disabled={submitting} className="btn-primary">
            {submitting ? 'Saving…' : 'Save conversation'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm text-ink/80">{label}</span>
      {children}
    </label>
  );
}
