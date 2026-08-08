import { InfluencerStatus, STAGE_LABELS } from '@/lib/types';

const COLORS: Record<InfluencerStatus, string> = {
  shortlisted: 'bg-stone-100 text-stone-600 border-stone-300',
  contacted: 'bg-citrine-400/15 text-citrine-600 border-citrine-400/40',
  negotiating: 'bg-citrine-500/20 text-citrine-600 border-citrine-500/40',
  confirmed: 'bg-pine-50 text-pine-700 border-pine-400/40',
  content_live: 'bg-pine-100 text-pine-700 border-pine-400/60',
  paid: 'bg-pine-700 text-white border-pine-700',
  declined: 'bg-rust-500/10 text-rust-500 border-rust-500/40',
};

export function StatusBadge({ status }: { status: InfluencerStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${COLORS[status]}`}
    >
      {STAGE_LABELS[status]}
    </span>
  );
}
