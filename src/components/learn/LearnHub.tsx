import { IconBookOpen, IconScroll } from '@/components/icons';

export type LearnModule = 'hebrew-letters' | 'gematria';

interface LearnModuleCard {
  id: LearnModule;
  title: string;
  subtitle: string;
  description: string;
  tags: string[];
}

const LEARN_MODULES: LearnModuleCard[] = [
  {
    id: 'hebrew-letters',
    title: 'Hebrew letters',
    subtitle: 'Block ↔ script',
    description: 'Quiz yourself on matching print and cursive letters, or draw practice with self-check.',
    tags: ['Quiz', 'Draw', '22 letters'],
  },
  {
    id: 'gematria',
    title: 'Gematria values',
    subtitle: 'Letter ↔ number',
    description: 'Memorize classic letter values — essential for Chumash, midrash, and Torah numerology.',
    tags: ['Quiz', 'Timed', 'א–ת'],
  },
];

interface LearnHubProps {
  onOpenModule: (module: LearnModule) => void;
}

export function LearnHub({ onOpenModule }: LearnHubProps) {
  return (
    <div className="mx-auto max-w-chat space-y-6 pb-[max(1rem,env(safe-area-inset-bottom))]">
      <div className="text-center">
        <p className="font-sketch text-xl text-gold">Learn</p>
        <h2 className="mt-1 font-heading text-2xl text-ink">Teaching tools</h2>
        <p className="mt-2 font-body text-sm text-ink/50">
          Short drills to build Hebrew literacy — no AI grading, just practice.
        </p>
      </div>

      <div className="space-y-3">
        {LEARN_MODULES.map((module) => (
          <button
            key={module.id}
            type="button"
            className="sketch-card-hover w-full touch-manipulation rounded-xl border border-parchment-dark bg-white p-5 text-left transition-colors"
            onClick={() => onOpenModule(module.id)}
          >
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-gold-muted/60">
                {module.id === 'hebrew-letters' ? (
                  <IconBookOpen className="h-5 w-5 text-gold" />
                ) : (
                  <IconScroll className="h-5 w-5 text-gold" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-sketch text-lg text-gold">{module.title}</p>
                <p className="font-heading text-base text-ink">{module.subtitle}</p>
                <p className="mt-1.5 font-body text-sm leading-relaxed text-ink/55">{module.description}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {module.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-parchment-dark px-2 py-0.5 font-body text-[10px] uppercase tracking-wide text-ink/45"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>

      <p className="text-center font-body text-xs text-ink/35">More modules coming soon.</p>
    </div>
  );
}
