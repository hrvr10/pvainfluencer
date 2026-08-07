'use client';

import { INFLUENCER_STAGES, InfluencerStatus, STAGE_LABELS } from '@/lib/types';

export function StageTrail({
  status,
  onAdvance,
  editable,
}: {
  status: InfluencerStatus;
  onAdvance?: (stage: InfluencerStatus) => void;
  editable: boolean;
}) {
  if (status === 'declined') {
    return (
      <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-wide text-rust-500">
        <span className="h-2 w-2 rounded-full bg-rust-500" />
        Declined — collaboration did not proceed
      </div>
    );
  }

  const currentIndex = INFLUENCER_STAGES.indexOf(status as (typeof INFLUENCER_STAGES)[number]);

  return (
    <div className="flex flex-wrap items-center gap-0">
      {INFLUENCER_STAGES.map((stage, i) => {
        const passed = i < currentIndex;
        const active = i === currentIndex;
        const clickable = editable && onAdvance && i !== currentIndex;

        return (
          <div key={stage} className="flex items-center">
            <button
              type="button"
              disabled={!clickable}
              onClick={() => clickable && onAdvance?.(stage)}
              title={clickable ? `Mark as ${STAGE_LABELS[stage]}` : STAGE_LABELS[stage]}
              className={[
                'relative flex h-9 items-center rounded-sm border px-3 font-mono text-[11px] uppercase tracking-wide transition',
                active
                  ? 'border-pine-600 bg-pine-600 text-white shadow-[0_0_0_3px_rgba(45,93,79,0.15)]'
                  : passed
                  ? 'border-pine-400/50 bg-pine-50 text-pine-700'
                  : 'border-dashed border-line text-muted',
                clickable ? 'cursor-pointer hover:border-pine-600 hover:text-pine-700' : 'cursor-default',
              ].join(' ')}
              style={active ? { transform: 'rotate(-1.5deg)' } : undefined}
            >
              {STAGE_LABELS[stage]}
            </button>
            {i < INFLUENCER_STAGES.length - 1 && (
              <div
                className={`h-px w-4 ${i < currentIndex ? 'bg-pine-400/50' : 'bg-line'}`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
