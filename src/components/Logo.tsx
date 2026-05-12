import { IconScroll, IconSearchMagnifier } from './icons';

export function Logo({ size = 'large' }: { size?: 'small' | 'large' }) {
  if (size === 'small') {
    return (
      <div className="flex items-center gap-2">
        <div className="relative">
          <IconScroll className="h-6 w-6 text-gold" />
          <IconSearchMagnifier className="-bottom-0.5 -right-0.5 absolute h-3 w-3 text-navy" />
        </div>
        <span className="font-heading text-lg font-bold text-navy">KosherGPT</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <IconScroll className="h-16 w-16 text-gold" strokeWidth={1.5} />
        <IconSearchMagnifier className="-bottom-1 -right-1 absolute h-7 w-7 text-navy" strokeWidth={2} />
      </div>
      <div className="text-center">
        <h1 className="font-heading text-4xl font-bold text-navy">KosherGPT</h1>
        <p className="font-body mt-2 text-lg italic text-navy/60">
          Torah knowledge, sourced and verified.
        </p>
      </div>
    </div>
  );
}
