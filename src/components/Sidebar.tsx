import { Button } from '@/components/ui/button';
import { Logo } from './Logo';
import { IconPlus, IconMessageSquare } from './icons';
import type { Conversation } from '../types/chat';

interface SidebarProps {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
}

export function Sidebar({ conversations, activeId, onSelect, onNew }: SidebarProps) {
  return (
    <aside className="flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden border-r border-parchment-dark bg-parchment/60">
      <div className="border-b border-parchment-dark px-4 py-3.5">
        <Logo size="small" />
      </div>

      <div className="p-3">
        <Button
          type="button"
          variant="outline"
          className="h-auto w-full justify-start rounded-md border-parchment-dark bg-white px-3 py-2 font-body text-sm font-normal text-ink/70 shadow-sketch hover:border-gold/30 hover:bg-gold-muted/30 hover:text-ink"
          onClick={onNew}
        >
          <IconPlus className="mr-2 h-4 w-4 text-gold" />
          New question
        </Button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden px-3 pb-3">
        <p className="px-2 py-2 font-sketch text-base text-ink/35">Recent questions</p>
        <div className="w-full space-y-0.5">
          {conversations.length === 0 ? (
            <p className="px-2 py-4 font-body text-xs leading-relaxed text-ink/35">
              No conversations yet — ask your first question to get started.
            </p>
          ) : (
            conversations.map((conv) => (
              <Button
                type="button"
                key={conv.id}
                variant="ghost"
                className={`h-auto min-h-[2.25rem] w-full max-w-full justify-start gap-2 whitespace-normal break-words rounded-md px-2.5 py-2 text-left shadow-none hover:bg-accent/80 ${
                  activeId === conv.id
                    ? 'border border-gold/25 bg-gold-muted/50 text-ink'
                    : 'text-ink/55 hover:text-ink'
                }`}
                onClick={() => onSelect(conv.id)}
              >
                <IconMessageSquare className="mt-0.5 h-3.5 w-3.5 shrink-0 self-start text-gold/60" />
                <span className="min-w-0 flex-1 font-body text-[13px] leading-snug line-clamp-3 text-left">
                  {conv.title}
                </span>
              </Button>
            ))
          )}
        </div>
      </div>

      <div className="border-t border-parchment-dark px-4 py-3">
        <p className="text-center font-sketch text-base text-ink/30">scholarly research tool</p>
      </div>
    </aside>
  );
}
