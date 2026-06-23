import { IconScroll, IconSearchMagnifier } from './icons';

export function Logo({ size = 'large' }: { size?: 'small' | 'large' }) {
  if (size === 'small') {
    return (
      <div className="flex items-center gap-2.5">
        <div className="relative flex h-8 w-8 items-center justify-center">
          <span
            className="absolute inset-0 border border-gold/25 bg-gold-muted/40 sketch-border"
            aria-hidden
          />
          <IconScroll className="relative h-4 w-4 text-gold" strokeWidth={1.75} />
        </div>
        <span className="font-heading text-base font-semibold tracking-tight text-ink">KosherGPT</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-5 px-4">
      <div className="relative flex h-24 w-24 items-center justify-center">
        <span
          className="absolute inset-0 border-2 border-gold/20 bg-gold-muted/30 sketch-border"
          aria-hidden
        />
        <IconScroll className="relative h-12 w-12 text-gold" strokeWidth={1.5} />
        <IconSearchMagnifier
          className="absolute -bottom-0.5 -right-0.5 h-6 w-6 text-ink/70"
          strokeWidth={2}
        />
      </div>
      <div className="text-center">
        <h1 className="font-heading text-3xl font-bold tracking-tight text-ink sm:text-4xl">KosherGPT</h1>
        <p className="font-sketch mt-2 text-2xl text-gold/90">Torah knowledge, sourced & verified</p>
        <p className="mt-3 max-w-sm font-body text-sm leading-relaxed text-ink/50">
          Ask about halacha, texts, and tradition — with citations you can follow.
        </p>
      </div>
    </div>
  );
}
