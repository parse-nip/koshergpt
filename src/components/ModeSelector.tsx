import { Button } from '@/components/ui/button';
import { IconBookOpen, IconSearchMagnifier } from './icons';
import { MODE_META, STUDY_MODES } from '@/lib/modes';
import type { StudyMode } from '@/types/chat';
import { cn } from '@/lib/utils';

interface ModeSelectorProps {
  mode: StudyMode;
  onChange: (mode: StudyMode) => void;
  disabled?: boolean;
  compact?: boolean;
}

const MODE_ICONS: Record<StudyMode, typeof IconSearchMagnifier> = {
  research: IconSearchMagnifier,
  chavrusa: IconBookOpen,
};

export function ModeSelector({ mode, onChange, disabled, compact }: ModeSelectorProps) {
  return (
    <div
      className={cn(
        'inline-flex rounded-md border border-parchment-dark bg-white p-0.5 shadow-sketch',
        compact ? 'scale-[0.92] origin-center' : '',
      )}
      role="radiogroup"
      aria-label="Learning mode"
    >
      {STUDY_MODES.map((option) => {
        const meta = MODE_META[option];
        const Icon = MODE_ICONS[option];
        const selected = mode === option;

        return (
          <Button
            key={option}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={disabled}
            variant="ghost"
            className={cn(
              'h-auto gap-1.5 rounded-[5px] px-2.5 py-1.5 font-body text-xs shadow-none transition-colors',
              selected
                ? 'bg-gold-muted/70 text-ink hover:bg-gold-muted/70'
                : 'text-ink/50 hover:bg-accent/60 hover:text-ink/75',
            )}
            title={meta.description}
            onClick={() => onChange(option)}
          >
            <Icon className="h-3.5 w-3.5 shrink-0 text-gold" strokeWidth={selected ? 2 : 1.75} />
            <span className={compact ? 'hidden sm:inline' : ''}>{meta.shortLabel}</span>
          </Button>
        );
      })}
    </div>
  );
}
