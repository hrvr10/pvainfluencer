'use client';

import { useState } from 'react';
import { collection, addDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from './AuthProvider';
import { Modal } from './CampaignFormModal';
import { prepareScreenshot, uploadScreenshot, authedFetch, PreparedScreenshot } from '@/lib/screenshots';
import { Influencer, InfluencerStatus, STAGE_LABELS } from '@/lib/types';

interface DetectedField<T = string> {
  value: T;
  apply: boolean;
}

interface DetectedUpdates {
  email?: DetectedField;
  phone?: DetectedField;
  shippingAddress?: DetectedField;
  productChosen?: DetectedField;
  status?: DetectedField<InfluencerStatus>;
}

export function ConversationFormModal({
  campaignId,
  influencer,
  onClose,
}: {
  campaignId: string;
  influencer: Influencer;
  onClose: () => void;
}) {
  const { profile } = useAuth();
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [summary, setSummary] = useState('');
  const [nextFollowUp, setNextFollowUp] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [screenshots, setScreenshots] = useState<PreparedScreenshot[]>([]);
  const [screenshotPreviews, setScreenshotPreviews] = useState<string[]>([]);
  const [extracting, setExtracting] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);
  const [detected, setDetected] = useState<DetectedUpdates>({});

  async function handleScreenshotsChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (files.length === 0) return;
    setExtractError(null);
    setExtracting(true);
    try {
      const prepared = await Promise.all(files.map(prepareScreenshot));
      const nextScreenshots = [...screenshots, ...prepared];
      setScreenshots(nextScreenshots);
      setScreenshotPreviews((prev) => [...prev, ...prepared.map((p) => URL.createObjectURL(p.blob))]);

      const res = await authedFetch('/api/extract-conversation', {
        images: nextScreenshots.map((p) => ({ base64: p.base64, mediaType: p.mediaType })),
        currentStatus: influencer.status,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Extraction failed');

      if (data.summary) setSummary(data.summary);
      if (data.nextFollowUp) setNextFollowUp(data.nextFollowUp);

      const nextDetected: DetectedUpdates = {};
      if (data.email && data.email !== influencer.email) {
        nextDetected.email = { value: data.email, apply: true };
      }
      if (data.phone && data.phone !== influencer.phone) {
        nextDetected.phone = { value: data.phone, apply: true };
      }
      if (data.shippingAddress && data.shippingAddress !== influencer.shippingAddress) {
        nextDetected.shippingAddress = { value: data.shippingAddress, apply: true };
      }
      if (data.productChosen && data.productChosen !== influencer.productChosen) {
        nextDetected.productChosen = { value: data.productChosen, apply: true };
      }
      if (data.suggestedStatus && data.suggestedStatus !== influencer.status) {
        nextDetected.status = { value: data.suggestedStatus, apply: true };
      }
      setDetected(nextDetected);
    } catch (err: any) {
      setExtractError(err.message || 'Could not read those screenshots — fill the summary in manually.');
    } finally {
      setExtracting(false);
    }
  }

  function removeScreenshot(index: number) {
    setScreenshots((prev) => prev.filter((_, i) => i !== index));
    setScreenshotPreviews((prev) => prev.filter((_, i) => i !== index));
  }

  function updateDetected<K extends keyof DetectedUpdates>(field: K, patch: Partial<DetectedField<any>>) {
    setDetected((prev) => ({
      ...prev,
      [field]: prev[field] ? { ...prev[field], ...patch } : prev[field],
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    const loggedByName = profile?.name || profile?.email || 'Unknown';
    const influencerRef = doc(db, 'campaigns', campaignId, 'influencers', influencer.id);

    const screenshotUrls = await Promise.all(
      screenshots.map((s) => {
        const path = `screenshots/conversations/${campaignId}/${influencer.id}/${crypto.randomUUID()}.jpg`;
        return uploadScreenshot(path, s);
      }),
    );

    await addDoc(collection(influencerRef, 'conversations'), {
      date,
      summary,
      nextFollowUp: nextFollowUp || null,
      loggedByName,
      screenshotUrls,
      createdAt: serverTimestamp(),
    });

    // Denormalize onto the influencer doc so the campaign roster table can
    // show "last conversation" without a query per row, and apply whichever
    // AI-detected contact/status updates the user left checked.
    await updateDoc(influencerRef, {
      lastConversationDate: date,
      lastConversationSummary: summary,
      lastConversationScreenshotUrl: screenshotUrls[0] || null,
      ...(detected.email?.apply ? { email: detected.email.value } : {}),
      ...(detected.phone?.apply ? { phone: detected.phone.value } : {}),
      ...(detected.shippingAddress?.apply ? { shippingAddress: detected.shippingAddress.value } : {}),
      ...(detected.productChosen?.apply ? { productChosen: detected.productChosen.value } : {}),
      ...(detected.status?.apply ? { status: detected.status.value } : {}),
    });

    setSubmitting(false);
    onClose();
  }

  const hasDetected = Object.keys(detected).length > 0;

  return (
    <Modal title="Log a conversation" onClose={onClose}>
      <form onSubmit={handleSubmit} className="max-h-[75vh] space-y-4 overflow-y-auto pr-1">
        <Field label="Chat screenshots (optional — auto-fills the fields below)">
          <div className="space-y-2">
            {screenshotPreviews.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {screenshotPreviews.map((src, i) => (
                  <div key={i} className="group relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt="" className="h-16 w-16 rounded object-cover" />
                    <button
                      type="button"
                      onClick={() => removeScreenshot(i)}
                      aria-label="Remove screenshot"
                      className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-ink text-xs text-white opacity-0 transition group-hover:opacity-100"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleScreenshotsChange}
              className="input file:mr-3 file:rounded file:border-0 file:bg-pine-600 file:px-3 file:py-1.5 file:text-sm file:text-white"
            />
            <p className="font-mono text-[10px] text-muted">
              Select multiple at once, or add more after — useful for a chat you had to scroll through.
            </p>
          </div>
          {extracting && <p className="mt-1.5 font-mono text-xs text-muted">Reading screenshots…</p>}
          {extractError && <p className="mt-1.5 text-xs text-rust-500">{extractError}</p>}
        </Field>

        {hasDetected && (
          <div className="rounded-md border border-pine-600/30 bg-pine-600/5 p-3">
            <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-pine-700">
              Detected from screenshots — review before saving
            </p>
            <div className="space-y-2">
              {detected.email && (
                <DetectedRow
                  label="Email"
                  value={detected.email.value}
                  checked={detected.email.apply}
                  onToggle={(apply) => updateDetected('email', { apply })}
                  onChange={(value) => updateDetected('email', { value })}
                />
              )}
              {detected.phone && (
                <DetectedRow
                  label="Phone"
                  value={detected.phone.value}
                  checked={detected.phone.apply}
                  onToggle={(apply) => updateDetected('phone', { apply })}
                  onChange={(value) => updateDetected('phone', { value })}
                />
              )}
              {detected.shippingAddress && (
                <DetectedRow
                  label="Shipping address"
                  value={detected.shippingAddress.value}
                  checked={detected.shippingAddress.apply}
                  onToggle={(apply) => updateDetected('shippingAddress', { apply })}
                  onChange={(value) => updateDetected('shippingAddress', { value })}
                />
              )}
              {detected.productChosen && (
                <DetectedRow
                  label="Product chosen"
                  value={detected.productChosen.value}
                  checked={detected.productChosen.apply}
                  onToggle={(apply) => updateDetected('productChosen', { apply })}
                  onChange={(value) => updateDetected('productChosen', { value })}
                />
              )}
              {detected.status && (
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={detected.status.apply}
                    onChange={(e) => updateDetected('status', { apply: e.target.checked })}
                  />
                  <span className="w-32 shrink-0 text-ink/60">Advance status</span>
                  <span className="font-medium text-ink">
                    {STAGE_LABELS[influencer.status]} → {STAGE_LABELS[detected.status.value]}
                  </span>
                </label>
              )}
            </div>
          </div>
        )}

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

function DetectedRow({
  label,
  value,
  checked,
  onToggle,
  onChange,
}: {
  label: string;
  value: string;
  checked: boolean;
  onToggle: (checked: boolean) => void;
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <input type="checkbox" checked={checked} onChange={(e) => onToggle(e.target.checked)} />
      <span className="w-32 shrink-0 text-ink/60">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input flex-1 py-1 text-sm"
      />
    </label>
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
