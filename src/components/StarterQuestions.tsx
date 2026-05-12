import { Button } from '@/components/ui/button';

const STARTERS = [
  'What does the Torah say about honoring parents?',
  'What is the halacha on electricity on Shabbat?',
  'Explain the dispute between Beit Hillel and Beit Shammai on Chanukah candles',
  "What is Rambam's view on prophecy?",
  'Is there a source for saying Tehillim for the sick?',
  'What are the laws of tzniut according to the Mishnah Berurah?',
];

interface StarterQuestionsProps {
  onSelect: (question: string) => void;
}

export function StarterQuestions({ onSelect }: StarterQuestionsProps) {
  return (
    <div className="mx-auto mt-8 grid max-w-2xl grid-cols-1 gap-3 sm:grid-cols-2">
      {STARTERS.map((question) => (
        <Button
          key={question}
          type="button"
          variant="outline"
          className="hover:border-gold/40 hover:bg-background hover:shadow-sm h-auto min-h-16 justify-start border-parchment-dark bg-white/60 p-4 text-left shadow-none whitespace-normal rounded-lg transition-all duration-200 font-body font-normal text-sm leading-relaxed text-navy/80"
          onClick={() => onSelect(question)}
        >
          {question}
        </Button>
      ))}
    </div>
  );
}
