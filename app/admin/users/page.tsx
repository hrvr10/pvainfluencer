'use client';

import { useEffect, useState } from 'react';
import { collection, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Role, UserProfile } from '@/lib/types';
import { ROLE_LABELS } from '@/lib/roles';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Navbar } from '@/components/Navbar';
import { useAuth } from '@/components/AuthProvider';

const ROLES: Role[] = ['admin', 'manager', 'viewer'];

export default function TeamPage() {
  const { profile } = useAuth();
  const [users, setUsers] = useState<UserProfile[] | null>(null);

  useEffect(() => {
    return onSnapshot(collection(db, 'users'), (snap) => {
      setUsers(snap.docs.map((d) => ({ uid: d.id, ...(d.data() as any) })));
    });
  }, []);

  async function changeRole(uid: string, role: Role) {
    await updateDoc(doc(db, 'users', uid), { role });
  }

  const isAdmin = profile?.role === 'admin';

  return (
    <ProtectedRoute>
      <Navbar />
      <main className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="font-display text-3xl">Team</h1>
        <p className="mt-1 text-sm text-muted">
          Manage who can view campaigns and who can edit them.
        </p>

        {!isAdmin && (
          <p className="mt-6 text-sm text-rust-500">
            Only admins can view and manage team roles.
          </p>
        )}

        {isAdmin && (
          <div className="card mt-6 overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-line bg-canvas/60">
                <tr className="text-xs font-medium text-muted">
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Role</th>
                </tr>
              </thead>
              <tbody>
                {users?.map((u) => (
                  <tr key={u.uid} className="border-b border-line last:border-0">
                    <td className="px-4 py-3">{u.name || '—'}</td>
                    <td className="px-4 py-3 text-ink/70">{u.email}</td>
                    <td className="px-4 py-3">
                      <select
                        value={u.role}
                        onChange={(e) => changeRole(u.uid, e.target.value as Role)}
                        disabled={u.uid === profile?.uid}
                        className="input w-auto py-1"
                      >
                        {ROLES.map((r) => (
                          <option key={r} value={r}>
                            {ROLE_LABELS[r]}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </ProtectedRoute>
  );
}
