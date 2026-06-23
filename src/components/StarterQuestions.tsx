import { Button } from '@/components/ui/button';
import type { StudyMode } from '@/types/chat';

const RESEARCH_STARTERS = [
  'What does the Torah say about honoring parents?',
  'What is the halacha on electricity on Shabbat?',
  'Explain the dispute between Beit Hillel and Beit Shammai on Chanukah candles',
  "What is Rambam's view on prophecy?",
  'Is there a source for saying Tehillim for the sick?',
  'What are the laws of tzniut according to the Mishnah Berurah?',
];

const CHAVRUSA_STARTERS = [
  "Let's learn Berachot 21a together — what do you think the core question is?",
  'I think bitul b\'shishim only works for accidental mixtures — push back on me.',
  'Help me understand why Rashi asks his question on Bereishit 1:1.',
  'Quiz me on the three categories of melacha on Shabbat.',
  'I read that Rama disagrees with Mechaber on waiting between meat and milk — walk me through it.',
  'What difficulty would you ask on the Rambam\'s definition of prophecy?',
];

interface StarterQuestionsProps {
  mode: StudyMode;
  onSelect: (question: string) => void;
}

export function StarterQuestions({ mode, onSelect }: StarterQuestionsProps) {
  const starters = mode === 'chavrusa' ? CHAVRUSA_STARTERS : RESEARCH_STARTERS;
  const heading = mode === 'chavrusa' ? 'Start a chavrusa session…' : 'Try asking…';

  return (
    <div className="mx-auto mt-10 w-full max-w-xl">
      <p className="mb-3 text-center font-sketch text-xl text-ink/40">{heading}</p>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {starters.map((question, i) => (
          <Button
            key={question}
            type="button"
            variant="outline"
            className="sketch-card-hover h-auto min-h-14 justify-start whitespace-normal border-parchment-dark bg-white p-3.5 text-left font-body text-[13px] font-normal leading-snug text-ink/75 shadow-sketch hover:text-ink"
            style={{ transform: i % 2 === 0 ? 'rotate(-0.3deg)' : 'rotate(0.3deg)' }}
            onClick={() => onSelect(question)}
          >
            {question}
          </Button>
        ))}
      </div>
    </div>
  );
}
