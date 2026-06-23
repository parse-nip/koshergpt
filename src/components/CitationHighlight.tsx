import { useState, useRef } from 'react';
import { IconExternalLink } from './icons';
import type { Source } from '../types/chat';

interface CitationHighlightProps {
  source: Source;
  children: string;
}

export function CitationHighlight({ source, children }: CitationHighlightProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  function handleMouseEnter() {
    clearTimeout(timeoutRef.current);
    setShowTooltip(true);
  }

  function handleMouseLeave() {
    timeoutRef.current = setTimeout(() => setShowTooltip(false), 200);
  }

  function handleClick() {
    window.open(source.url, '_blank', 'noopener');
  }

  return (
    <span
      className="relative inline"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <span
        onClick={handleClick}
        className="cursor-pointer rounded-sm border-b-2 border-gold/35 bg-gold-muted/50 px-0.5 text-ink transition-all duration-150 hover:border-gold/60 hover:bg-gold-muted/80"
      >
        {children}
      </span>

      {showTooltip && (
        <span
          className="absolute bottom-full left-1/2 z-50 mb-2 w-64 -translate-x-1/2 pointer-events-auto"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <span className="block rounded-md border border-parchment-dark bg-white p-3 text-left shadow-soft">
            <span className="block font-body text-xs font-medium leading-snug text-ink">
              {source.title}
            </span>
            {source.description && (
              <span className="mt-1 block text-xs leading-relaxed text-ink/55">
                {source.description}
              </span>
            )}
            <span className="mt-2 flex items-center gap-1 text-xs font-medium text-scholarly-blue">
              <IconExternalLink className="h-3 w-3 shrink-0" aria-hidden />
              <span className="truncate">{new URL(source.url).hostname}</span>
            </span>
          </span>
          <span className="absolute -bottom-1 left-1/2 block h-2 w-2 -translate-x-1/2 rotate-45 border-b border-r border-parchment-dark bg-white" />
        </span>
      )}
    </span>
  );
}
