interface ModelLoadingPanelProps {
  percent: number;
}

export function ModelLoadingPanel({ percent }: ModelLoadingPanelProps) {
  return (
    <div className="sketch-card bg-white p-6 text-center" role="status" aria-live="polite" aria-busy="true">
      <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-gold-muted border-t-gold" />
      <p className="font-heading text-lg text-ink">Loading Hebrew letter model</p>
      <p className="mt-1 font-body text-sm text-ink/55">
        HebrewManuscriptsMNIST CNN · {percent}%
      </p>
      <div className="mx-auto mt-4 h-2 max-w-xs overflow-hidden rounded-full bg-parchment-dark/70">
        <div className="h-full rounded-full bg-gold transition-[width] duration-300" style={{ width: `${percent}%` }} />
      </div>
      <p className="mt-3 font-body text-[11px] text-ink/35">Runs fully on your device — no cloud AI.</p>
    </div>
  );
}
