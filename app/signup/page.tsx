'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(cred.user, { displayName: name });
      // New accounts default to 'viewer'. An existing admin promotes them
      // from Team → manage roles once they're vetted.
      await setDoc(doc(db, 'users', cred.user.uid), {
        name,
        email,
        role: 'viewer',
        createdAt: serverTimestamp(),
      });
      router.replace('/dashboard');
    } catch (err: any) {
      setError(readableAuthError(err?.code));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="font-display text-3xl italic">Roster</div>
          <p className="mt-1 text-sm text-muted">Create your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-line bg-surface p-6">
          <Field label="Full name">
            <input required value={name} onChange={(e) => setName(e.target.value)} className="input" />
          </Field>
          <Field label="Email">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
            />
          </Field>
          <Field label="Password">
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input"
            />
          </Field>

          {error && <p className="text-sm text-rust-500">{error}</p>}

          <p className="text-xs text-muted">
            New accounts start as <span className="font-medium text-ink/70">Viewer</span>. An admin can grant you
            edit access from the Team page.
          </p>

          <button type="submit" disabled={submitting} className="btn-primary w-full">
            {submitting ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-muted">
          Already have an account?{' '}
          <Link href="/login" className="text-pine-600 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
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

function readableAuthError(code?: string) {
  switch (code) {
    case 'auth/email-already-in-use':
      return 'An account with that email already exists.';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters.';
    case 'auth/invalid-email':
      return 'That email address doesn\u2019t look right.';
    default:
      return 'Something went wrong creating your account. Please try again.';
  }
}
