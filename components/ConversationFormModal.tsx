'use client';

import { useState } from 'react';
import { collection, addDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from './AuthProvider';
import { Modal } from './CampaignFormModal';
import { prepareScreenshot, uploadScreenshot, authedFetch, PreparedScreenshot } from '@/lib/screenshots';

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

  const [screenshot, setScreenshot] = useState<PreparedScreenshot | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);

  async function handleScreenshotChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setExtractError(null);
    setExtracting(true);
    try {
      const prepared = await prepareScreenshot(file);
      setScreenshot(prepared);
      setScreenshotPreview(URL.createObjectURL(prepared.blob));

      const res = await authedFetch('/api/extract-conversation', {
        imageBase64: prepared.base64,
        mediaType: prepared.mediaType,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Extraction failed');

      if (data.summary) setSummary(data.summary);
      if (data.nextFollowUp) setNextFollowUp(data.nextFollowUp);
    } catch (err: any) {
      setExtractError(err.message || 'Could not read that screenshot — fill the summary in manually.');
    } finally {
      setExtracting(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    const loggedByName = profile?.name || profile?.email || 'Unknown';
    const influencerRef = doc(db, 'campaigns', campaignId, 'influencers', influencerId);

    let screenshotUrl: string | null = null;
    if (screenshot) {
      const path = `screenshots/conversations/${campaignId}/${influencerId}/${crypto.randomUUID()}.jpg`;
      screenshotUrl = await uploadScreenshot(path, screenshot);
    }

    await addDoc(collection(influencerRef, 'conversations'), {
      date,
      summary,
      nextFollowUp: nextFollowUp || null,
      loggedByName,
      screenshotUrl,
      createdAt: serverTimestamp(),
    });

    // Denormalize onto the influencer doc so the campaign roster table can
    // show "last conversation" without a query per row.
    await updateDoc(influencerRef, {
      lastConversationDate: date,
      lastConversationSummary: summary,
      lastConversationScreenshotUrl: screenshotUrl,
    });

    setSubmitting(false);
    onClose();
  }

  return (
    <Modal title="Log a conversation" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Chat screenshot (optional — auto-fills the summary below)">
          <div className="flex items-center gap-3">
            {screenshotPreview && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={screenshotPreview}
                alt="Chat screenshot preview"
                className="h-16 w-16 rounded object-cover"
              />
            )}
            <input
              type="file"
              accept="image/*"
              onChange={handleScreenshotChange}
              className="input file:mr-3 file:rounded file:border-0 file:bg-pine-600 file:px-3 file:py-1.5 file:text-sm file:text-white"
            />
          </div>
          {extracting && <p className="mt-1.5 font-mono text-xs text-muted">Reading screenshot…</p>}
          {extractError && <p className="mt-1.5 text-xs text-rust-500">{extractError}</p>}
        </Field>

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
          <button type="submit" disabled={submitting || extracting} className="btn-primary">
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
