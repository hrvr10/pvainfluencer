'use client';

import { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Platform } from '@/lib/types';
import { Modal } from './CampaignFormModal';

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
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
      status: 'shortlisted',
      createdAt: serverTimestamp(),
    });
    setSubmitting(false);
    onClose();
  }

  return (
    <Modal title="Add influencer" onClose={onClose}>
      <form onSubmit={handleSubmit} className="max-h-[70vh] space-y-4 overflow-y-auto pr-1">
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
          <button type="submit" disabled={submitting} className="btn-primary">
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
