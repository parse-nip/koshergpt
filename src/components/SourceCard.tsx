import { IconGlobe, IconBookOpen, IconScroll } from './icons';
import type { Source } from '../types/chat';

function getSourceIcon(title: string) {
  const lower = title.toLowerCase();
  if (
    lower.includes('talmud') ||
    lower.includes('torah') ||
    lower.includes('tanakh') ||
    lower.includes('midrash')
  ) {
    return <IconScroll className="h-4 w-4 text-gold" />;
  }
  if (lower.includes('.org') || lower.includes('sefaria') || lower.includes('chabad')) {
    return <IconGlobe className="h-4 w-4 text-scholarly-blue" />;
  }
  return <IconBookOpen className="h-4 w-4 text-navy/60" />;
}

export function SourceCard({ source }: { source: Source }) {
  return (
    <div className="source-card">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 shrink-0">{getSourceIcon(source.title)}</div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-medium text-scholarly-blue">[{source.number}]</span>
            <span className="font-body truncate text-sm font-medium text-navy">{source.title}</span>
          </div>
          {source.description && (
            <p className="font-body mt-1 text-sm leading-relaxed text-navy/60">{source.description}</p>
          )}
        </div>
      </div>
    </div>
  );
}
