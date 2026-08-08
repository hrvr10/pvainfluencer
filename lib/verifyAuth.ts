// Confirms the request carries a valid Firebase Auth ID token, without
// needing the Admin SDK / a service account — just asks Google to vouch
// for the token via the same public API key the client already uses.
export async function verifyIdToken(req: Request): Promise<string | null> {
  const authHeader = req.headers.get('authorization') || '';
  const idToken = authHeader.replace(/^Bearer\s+/i, '');
  if (!idToken) return null;

  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${process.env.NEXT_PUBLIC_FIREBASE_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
    },
  );
  if (!res.ok) return null;
  const data = await res.json();
  return data.users?.[0]?.localId || null;
}
