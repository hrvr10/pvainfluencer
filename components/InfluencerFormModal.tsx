'use client';

import { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Platform } from '@/lib/types';
import { Modal } from './CampaignFormModal';
import { prepareScreenshot, uploadScreenshot, authedFetch, PreparedScreenshot } from '@/lib/screenshots';

const PLATFORMS: { value: Platform; label: string }[] = [
  { value: 'instagram', label: 'Instagram' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'twitter', label: 'X / Twitter' },
  { value: 'other', label: 'Other' },
];

export function InfluencerFormModal({
  campaignId,
  onClose,
}: {
  campaignId: string;
  onClose: () => void;
}) {
  const [name, setName] = useState('');
  const [handle, setHandle] = useState('');
  const [platform, setPlatform] = useState<Platform>('instagram');
  const [followers, setFollowers] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [niche, setNiche] = useState('');
  const [location, setLocation] = useState('');
  const [rate, setRate] = useState('');
  const [notes, setNotes] = useState('');
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

      const res = await authedFetch('/api/extract-profile', {
        imageBase64: prepared.base64,
        mediaType: prepared.mediaType,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Extraction failed');

      if (data.name) setName(data.name);
      if (data.handle) setHandle(data.handle);
      if (data.platform) setPlatform(data.platform);
      if (data.followers) setFollowers(String(data.followers));
      if (data.niche) setNiche(data.niche);
    } catch (err: any) {
      setExtractError(err.message || 'Could not read that screenshot — fill the fields in manually.');
    } finally {
      setExtracting(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    let profileScreenshotUrl: string | null = null;
    if (screenshot) {
      const path = `screenshots/profiles/${campaignId}/${crypto.randomUUID()}.jpg`;
      profileScreenshotUrl = await uploadScreenshot(path, screenshot);
    }

    await addDoc(collection(db, 'campaigns', campaignId, 'influencers'), {
      name,
      handle,
      platform,
      followers: followers ? Number(followers) : null,
      email,
      phone,
      niche,
      location,
      rate,
      notes,
      profileScreenshotUrl,
      status: 'shortlisted',
      createdAt: serverTimestamp(),
    });
    setSubmitting(false);
    onClose();
  }

  return (
    <Modal title="Add influencer" onClose={onClose}>
      <form onSubmit={handleSubmit} className="max-h-[70vh] space-y-4 overflow-y-auto pr-1">
        <Field label="Profile screenshot (optional — auto-fills the fields below)">
          <div className="flex items-center gap-3">
            {screenshotPreview && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={screenshotPreview}
                alt="Profile screenshot preview"
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
          <Field label="Name">
            <input required value={name} onChange={(e) => setName(e.target.value)} className="input" />
          </Field>
          <Field label="Handle">
            <input
              required
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              className="input"
              placeholder="@username"
            />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Platform">
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value as Platform)}
              className="input"
            >
              {PLATFORMS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Followers (optional)">
            <input
              type="number"
              min={0}
              value={followers}
              onChange={(e) => setFollowers(e.target.value)}
              className="input"
            />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Email (optional)">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
            />
          </Field>
          <Field label="Phone (optional)">
            <input value={phone} onChange={(e) => setPhone(e.target.value)} className="input" />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Niche (optional)">
            <input
              value={niche}
              onChange={(e) => setNiche(e.target.value)}
              className="input"
              placeholder="Streetwear, fitness…"
            />
          </Field>
          <Field label="Location (optional)">
            <input value={location} onChange={(e) => setLocation(e.target.value)} className="input" />
          </Field>
        </div>
        <Field label="Rate / quote (optional)">
          <input
            value={rate}
            onChange={(e) => setRate(e.target.value)}
            className="input"
            placeholder="e.g. ₹25,000 per reel"
          />
        </Field>
        <Field label="Notes (optional)">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="input min-h-16"
          />
        </Field>

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <button type="submit" disabled={submitting || extracting} className="btn-primary">
            {submitting ? 'Adding…' : 'Add influencer'}
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
