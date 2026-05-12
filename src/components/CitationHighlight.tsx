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
        className="bg-gold/15 border-b-2 border-gold/40 text-navy cursor-pointer hover:bg-gold/25 hover:border-gold/70 transition-all duration-150 rounded-sm px-0.5"
      >
        {children}
      </span>

      {showTooltip && (
        <span
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 w-64 pointer-events-auto"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <span className="block bg-white border border-parchment-dark rounded-lg shadow-lg p-3 text-left">
            <span className="block font-body text-xs font-medium text-navy leading-snug">
              {source.title}
            </span>
            {source.description && (
              <span className="block text-xs text-navy/60 mt-1 leading-relaxed">
                {source.description}
              </span>
            )}
            <span className="flex items-center gap-1 mt-2 text-scholarly-blue text-xs font-medium">
              <IconExternalLink className="w-3 h-3 shrink-0" aria-hidden />
              <span className="truncate">{new URL(source.url).hostname}</span>
            </span>
          </span>
          <span className="block w-2 h-2 bg-white border-r border-b border-parchment-dark rotate-45 absolute left-1/2 -translate-x-1/2 -bottom-1" />
        </span>
      )}
    </span>
  );
}
