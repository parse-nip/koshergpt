import type { RecognizerLoadProgress } from '@/lib/hebrew-letters/recognizer';

interface RecognizerLoadingPanelProps {
  progress: RecognizerLoadProgress;
  elapsedMs: number;
}

const STAGE_LABELS: Record<RecognizerLoadProgress['stage'], string> = {
  fonts: 'Fonts',
  templates: 'Templates',
  model: 'Model',
  ready: 'Ready',
};

function formatElapsed(ms: number): string {
  return `${(ms / 1000).toFixed(1)}s`;
}

export function RecognizerLoadingPanel({ progress, elapsedMs }: RecognizerLoadingPanelProps) {
  const stageOrder: RecognizerLoadProgress['stage'][] = ['fonts', 'templates', 'model', 'ready'];
  const activeStageIndex = stageOrder.indexOf(progress.stage);

  return (
    <div className="sketch-card bg-white p-6 sm:p-8" role="status" aria-live="polite" aria-busy="true">
      <div className="mx-auto max-w-sm text-center">
        <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-gold-muted border-t-gold" />

        <p className="font-heading text-lg text-ink">Setting up handwriting recognition</p>
        <p className="mt-1 font-body text-sm text-ink/55">{progress.message}</p>
        {progress.detail ? (
          <p className="mt-1 font-body text-xs text-ink/40">{progress.detail}</p>
        ) : null}

        <div className="mt-5">
          <div className="mb-2 flex items-center justify-between font-body text-[11px] text-ink/45">
            <span>{progress.percent}%</span>
            <span>{formatElapsed(elapsedMs)} elapsed</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-parchment-dark/70">
            <div
              className="h-full rounded-full bg-gold transition-[width] duration-300 ease-out"
              style={{ width: `${progress.percent}%` }}
            />
          </div>
        </div>

        <ol className="mt-5 space-y-2 text-left">
          {stageOrder.slice(0, 3).map((stage, index) => {
            const isDone = index < activeStageIndex;
            const isActive = index === activeStageIndex;
            return (
              <li
                key={stage}
                className={`flex items-center gap-2 font-body text-xs ${
                  isDone ? 'text-gold' : isActive ? 'text-ink/75' : 'text-ink/30'
                }`}
              >
                <span
                  className={`inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                    isDone
                      ? 'border-gold bg-gold text-white'
                      : isActive
                        ? 'border-gold/50 bg-gold-muted'
                        : 'border-parchment-dark'
                  }`}
                  aria-hidden
                >
                  {isDone ? '✓' : isActive ? '…' : ''}
                </span>
                {STAGE_LABELS[stage]}
              </li>
            );
          })}
        </ol>

        <p className="mt-4 font-body text-[11px] leading-relaxed text-ink/35">
          This runs once in your browser. The page should stay responsive — if it pauses briefly, it is still working.
        </p>
      </div>
    </div>
  );
}
