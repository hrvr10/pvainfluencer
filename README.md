# PVA InfluenceOS — Influencer Collaboration Portal

Track brand campaigns, the influencers shortlisted for each one, their contact
details, and a running log of every conversation with them.

- **Frontend:** Next.js 14 (App Router) + Tailwind
- **Backend/data:** Firebase Auth + Firestore
- **Hosting:** Vercel

## How the data is organized

```
/users/{uid}                                        → name, email, role (admin | manager | viewer)
/campaigns/{campaignId}                              → brandName, campaignName, startDate, endDate, status, notes
/campaigns/{campaignId}/influencers/{influencerId}    → name, handle, platform, followers, email, phone,
                                                         niche, location, rate, status, notes,
                                                         lastConversationDate, lastConversationSummary
/campaigns/{campaignId}/influencers/{influencerId}/conversations/{conversationId}
                                                       → date, summary, nextFollowUp, loggedByName
```

Each brand campaign holds its own roster of influencers, and each influencer
holds their own conversation history — so "what was the last conversation
with them" is answered right on the campaign roster table, and the full
history lives on the influencer's page.

**Roles**
- **Viewer** — read-only. This is the default for anyone who signs up.
- **Manager** — can create campaigns, add/edit influencers, advance their
  stage, and log conversations.
- **Admin** — everything a manager can do, plus managing team roles from the
  Team page.

Role checks are enforced twice: in the UI (so people only see actions they
can take) and in `firestore.rules` (so the rule is real, not cosmetic).

## 1. Create the Firebase project

1. Go to [console.firebase.google.com](https://console.firebase.google.com) → **Add project**.
2. In the new project, go to **Build → Authentication → Get started**, and
   enable the **Email/Password** sign-in provider.
3. Go to **Build → Firestore Database → Create database**. Start in
   **production mode** (the rules in this repo will lock it down).
4. Go to **Project settings → General → Your apps → Add app → Web**, register
   an app, and copy the `firebaseConfig` values.

## 2. Configure the app

```bash
cp .env.local.example .env.local
```

Paste the values from step 1.4 into `.env.local`.

## 3. Deploy the Firestore security rules

Install the Firebase CLI once if you don't have it, then from this folder:

```bash
npm install -g firebase-tools
firebase login
firebase init firestore   # choose the project you created; keep firestore.rules as-is
firebase deploy --only firestore:rules
```

## 4. Run it locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`, sign up — your first account will be a
**Viewer**. To promote yourself to **Admin** the first time (before there's
any admin who could do it from the Team page), open Firestore in the Firebase
Console, find your document under `users/{your-uid}`, and change `role` to
`admin` directly. After that, use the in-app Team page for everyone else.

## 5. Deploy to Vercel

```bash
npm install -g vercel
vercel
```

When prompted, add the same six `NEXT_PUBLIC_FIREBASE_*` variables from your
`.env.local` as Environment Variables (or add them afterwards in the Vercel
project's **Settings → Environment Variables**, then redeploy).

Or connect the repo at [vercel.com/new](https://vercel.com/new) and add the
env vars there — either way, Vercel auto-detects the Next.js app and needs no
extra config.

## Notes / next steps you may want

- **Google/OAuth sign-in** — swap or add a provider in `lib/firebase.ts` and
  the login/signup pages if email/password isn't the right fit for your team.
- **Editing an influencer's saved details** — the scaffold covers adding
  influencers and logging conversations; a quick "edit" form on the detail
  page is the natural next addition using the same `updateDoc` pattern
  already used for stage changes.
- **Search/filter** across all campaigns — right now the roster is per
  campaign; a global influencer search would need a top-level `influencers`
  collection or a Cloud Function to keep one in sync.
