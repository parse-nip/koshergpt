export function TypingIndicator() {
  return (
    <div className="flex items-center gap-3 px-2 py-3">
      <div className="flex gap-1">
        <span className="typing-dot" />
        <span className="typing-dot" />
        <span className="typing-dot" />
      </div>
      <span className="font-sketch text-lg text-ink/45">Searching the sources…</span>
    </div>
  );
}
