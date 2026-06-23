import { Button } from '@/components/ui/button';
import { IconAlertTriangle, IconRefresh } from './icons';
import type { ChatError } from '@/lib/chatErrors';

interface ErrorDisplayProps {
  error: ChatError;
  onRetry?: () => void;
  onReply?: () => void;
}

export function ErrorDisplay({ error, onRetry, onReply }: ErrorDisplayProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 rounded-md border border-warning-text/15 bg-warning-bg/80 px-4 py-3.5">
        <IconAlertTriangle
          className="mt-0.5 h-5 w-5 shrink-0 text-warning-text/70"
          aria-hidden
        />
        <div className="min-w-0 space-y-1.5">
          <h3 className="font-heading text-base font-semibold text-warning-text">{error.title}</h3>
          <p className="font-body text-sm leading-relaxed text-warning-text/90">{error.message}</p>
          {error.hint ? (
            <p className="font-body text-xs leading-relaxed text-warning-text/60">{error.hint}</p>
          ) : null}
        </div>
      </div>

      {(onRetry || onReply) && (
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          {error.retryable && onRetry ? (
            <Button
              type="button"
              variant="default"
              className="h-auto gap-1.5 bg-gold px-3 py-1.5 font-body text-xs text-white shadow-sketch hover:bg-gold-light"
              onClick={onRetry}
            >
              <IconRefresh className="h-3.5 w-3.5" />
              Try again
            </Button>
          ) : null}
          {onReply ? (
            <Button
              type="button"
              variant="outline"
              className="h-auto border-parchment-dark px-3 py-1.5 font-body text-xs text-ink/60 shadow-sketch hover:border-gold/30 hover:text-ink"
              onClick={onReply}
            >
              Reply in thread
            </Button>
          ) : null}
        </div>
      )}
    </div>
  );
}
