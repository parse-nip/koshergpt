import React, { useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';

import { parseResponse } from '../lib/parseResponse';
import { CitationHighlight } from './CitationHighlight';
import { IconCopy, IconCheck, IconAlertTriangle } from './icons';
import type { Source, StudyMode } from '../types/chat';

interface ResponseDisplayProps {
  content: string;
  isStreaming: boolean;
  mode?: StudyMode;
  onFollowUp?: (question: string) => void;
  onReply?: () => void;
  onRetry?: () => void;
}

function renderTextWithCitations(text: string, sources: Source[]): React.ReactNode[] {
  const parts = text.split(/(\[\d+\])/g);
  const nodes: React.ReactNode[] = [];

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    const citationMatch = part.match(/^\[(\d+)\]$/);

    if (citationMatch) {
      const num = parseInt(citationMatch[1]);
      const source = sources.find((s) => s.number === num);

      if (source) {
        const prevIdx = i - 1;
        if (prevIdx >= 0 && nodes.length > 0) {
          const prevNode = nodes[nodes.length - 1];
          if (typeof prevNode === 'string') {
            const sentences = prevNode.split(/(?<=[.!?])\s+|(?<=,)\s+(?=[A-Z])/);
            const lastPart = sentences.pop() || '';
            const remainder = sentences.join(' ');

            nodes[nodes.length - 1] = remainder ? remainder + ' ' : '';
            nodes.push(
              <CitationHighlight key={`cite-${i}`} source={source}>
                {lastPart.trim()}
              </CitationHighlight>,
            );
          } else {
            nodes.push(
              <CitationHighlight key={`cite-${i}`} source={source}>
                {source.title.split(',')[0]}
              </CitationHighlight>,
            );
          }
        } else {
          nodes.push(
            <CitationHighlight key={`cite-${i}`} source={source}>
              {source.title.split(',')[0]}
            </CitationHighlight>,
          );
        }
      } else {
        nodes.push(part);
      }
    } else {
      nodes.push(part);
    }
  }

  return nodes;
}

function renderFormattedBlock(text: string, sources: Source[]): React.ReactNode {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const boldParts = line.split(/(\*\*[^*]+\*\*)/g);
    const lineNodes: React.ReactNode[] = [];

    for (let j = 0; j < boldParts.length; j++) {
      const seg = boldParts[j];
      const boldMatch = seg.match(/^\*\*(.+)\*\*$/);
      if (boldMatch) {
        lineNodes.push(<strong key={`b-${i}-${j}`}>{boldMatch[1]}</strong>);
      } else {
        const italicParts = seg.split(/(\*[^*]+\*)/g);
        for (let k = 0; k < italicParts.length; k++) {
          const iseg = italicParts[k];
          const italicMatch = iseg.match(/^\*(.+)\*$/);
          if (italicMatch) {
            lineNodes.push(<em key={`i-${i}-${j}-${k}`}>{italicMatch[1]}</em>);
          } else {
            const cited = renderTextWithCitations(iseg, sources);
            lineNodes.push(
              ...cited.map((n, idx) =>
                typeof n === 'string'
                  ? n
                  : React.cloneElement(n as React.ReactElement, {
                      key: `c-${i}-${j}-${k}-${idx}`,
                    }),
              ),
            );
          }
        }
      }
    }

    if (i > 0) elements.push(<br key={`br-${i}`} />);
    elements.push(<span key={`line-${i}`}>{lineNodes}</span>);
  }

  return <>{elements}</>;
}

function SourcePills({ sources }: { sources: Source[] }) {
  if (sources.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 border-t border-parchment-dark/60 pt-3">
      <span className="font-sketch text-base text-ink/40">Sources</span>
      {sources.map((source) => (
        <a
          key={source.number}
          href={source.url}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full border border-gold/20 bg-gold-muted/40 px-2.5 py-0.5 font-body text-xs text-ink/65 transition-all duration-150 hover:border-gold/35 hover:bg-gold-muted/70"
        >
          {source.title}
        </a>
      ))}
    </div>
  );
}

function ActionRow({
  onReply,
  onRetry,
  replyLabel,
}: {
  onReply?: () => void;
  onRetry?: () => void;
  replyLabel?: string;
}) {
  if (!onReply && !onRetry) return null;

  return (
    <div className="flex flex-col gap-2 border-t border-parchment-dark/60 pt-3 sm:flex-row sm:flex-wrap sm:items-center">
      {onRetry ? (
        <Button
          type="button"
          variant="outline"
          className="h-auto border-parchment-dark px-3 py-1.5 font-body text-xs text-ink/60 shadow-sketch hover:border-gold/30 hover:text-ink"
          onClick={onRetry}
        >
          Retry
        </Button>
      ) : null}
      {onReply ? (
        <Button
          type="button"
          variant="outline"
          className="h-auto border-parchment-dark px-3 py-1.5 font-body text-xs text-ink/60 shadow-sketch hover:border-gold/30 hover:text-ink"
          onClick={onReply}
        >
          {replyLabel ?? 'Reply in thread'}
        </Button>
      ) : null}
    </div>
  );
}

export function ResponseDisplay({
  content,
  isStreaming,
  mode = 'research',
  onFollowUp,
  onReply,
  onRetry,
}: ResponseDisplayProps) {
  const [copied, setCopied] = useState(false);
  const parsed = useMemo(() => parseResponse(content), [content]);
  const isChavrusa = mode === 'chavrusa';

  function handleCopy() {
    void navigator.clipboard.writeText(content).then(
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      },
      () => setCopied(false),
    );
  }

  const promptItems = isChavrusa ? parsed.thinkAbout : parsed.followUps;
  const promptHeading = isChavrusa ? 'For you to think about' : 'Follow-up questions';

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {!isChavrusa && parsed.summary && (
          <div className="rounded-md border border-parchment-dark bg-gold-muted/25 p-4">
            <h3 className="font-sketch mb-2 text-xl text-gold">Summary</h3>
            <div className="response-content font-body text-[15px] leading-relaxed text-ink">
              {renderFormattedBlock(parsed.summary, parsed.sources)}
            </div>
          </div>
        )}

        {!isChavrusa && parsed.keyPoints.length > 0 && (
          <div className="rounded-md border border-scholarly-blue/15 bg-scholarly-blue/5 p-4">
            <h3 className="font-sketch mb-2.5 text-xl text-scholarly-blue">Key points</h3>
            <ul className="list-none space-y-1.5 p-0">
              {parsed.keyPoints.map((point, idx) => (
                <li
                  key={`${idx}-${point.slice(0, 24)}`}
                  className="flex gap-2 font-body text-[15px] leading-relaxed text-ink"
                >
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-scholarly-blue/60" aria-hidden />
                  <span>{renderFormattedBlock(point, parsed.sources)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {parsed.inDepth && (
          <div
            className={
              isChavrusa
                ? 'response-content rounded-md border border-parchment-dark/80 bg-white/60 p-4 font-body text-[15px] leading-relaxed text-ink'
                : 'response-content font-body text-[15px] leading-relaxed text-ink'
            }
          >
            {renderFormattedBlock(parsed.inDepth, parsed.sources)}
          </div>
        )}

        {!parsed.summary && !parsed.inDepth && content && (
          <div className="response-content font-body text-[15px] leading-relaxed text-ink">
            {renderFormattedBlock(content, parsed.sources)}
          </div>
        )}

        {isStreaming && <span className="inline-block h-4 w-1.5 animate-pulse rounded-sm bg-gold/50" />}
      </div>

      {parsed.disclaimer && !isStreaming && (
        <div className="flex items-start gap-2.5 rounded-md border border-warning-text/15 bg-warning-bg px-3 py-2.5">
          <IconAlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning-text/80" aria-hidden />
          <p className="font-body text-sm leading-relaxed text-warning-text">
            For a practical ruling, please consult your Local Orthodox Rabbi.
          </p>
        </div>
      )}

      {!isStreaming && <SourcePills sources={parsed.sources} />}

      {isChavrusa && parsed.yourTurn && !isStreaming && (
        <div className="rounded-md border border-gold/30 bg-gold-muted/35 p-4">
          <h3 className="font-sketch mb-2 text-xl text-gold">Your turn</h3>
          <p className="font-body text-[15px] leading-relaxed text-ink">
            {renderFormattedBlock(parsed.yourTurn, parsed.sources)}
          </p>
          {onFollowUp ? (
            <Button
              type="button"
              variant="outline"
              className="sketch-card-hover mt-3 h-auto border-parchment-dark bg-white px-3 py-2 font-body text-[13px] text-ink/70 shadow-sketch hover:text-ink"
              onClick={() => onFollowUp(parsed.yourTurn)}
            >
              Respond to this
            </Button>
          ) : null}
        </div>
      )}

      {promptItems.length > 0 && !isStreaming && onFollowUp && (
        <div className="space-y-2 pt-2">
          <h3 className="font-sketch text-lg text-ink/40">{promptHeading}</h3>
          <ul className="grid list-none gap-2 p-0 sm:grid-cols-2">
            {promptItems.map((q, idx) => (
              <li key={`${idx}-${q}`} className="min-w-0">
                <Button
                  type="button"
                  variant="outline"
                  className="sketch-card-hover h-auto w-full min-h-10 justify-start whitespace-normal border-parchment-dark bg-white px-3 py-2 text-left font-body text-[13px] text-ink/65 shadow-sketch hover:text-ink sm:min-h-0"
                  onClick={() => onFollowUp(q)}
                >
                  {q}
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {!isStreaming && content && (onReply || onRetry) && (
        <ActionRow
          onReply={onReply}
          onRetry={onRetry}
          replyLabel={isChavrusa ? 'Reply to chavrusa' : 'Reply in thread'}
        />
      )}

      {!isStreaming && content ? (
        <div className="flex justify-end">
          <Button
            type="button"
            variant="ghost"
            className="h-auto gap-1.5 rounded-md px-2 py-1 font-body text-xs font-normal text-ink/35 shadow-none hover:bg-accent/80 hover:text-ink/60"
            onClick={handleCopy}
          >
            {copied ? <IconCheck className="h-3.5 w-3.5" /> : <IconCopy className="h-3.5 w-3.5" />}
            {copied ? 'Copied' : 'Copy response'}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
