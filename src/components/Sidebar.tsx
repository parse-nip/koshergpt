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
    <aside className="flex h-full w-full flex-col border-r border-parchment-dark bg-white/50">
      <div className="border-b border-parchment-dark p-4">
        <Logo size="small" />
      </div>

      <div className="p-3">
        <Button
          type="button"
          variant="outline"
          className="hover:border-gold/40 hover:bg-background h-auto w-full justify-start px-3 py-2.5 font-body font-normal border-parchment-dark text-navy/70 rounded-lg shadow-none"
          onClick={onNew}
        >
          <IconPlus className="mr-2 h-4 w-4" />
          New question
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-3">
        <p className="font-heading px-3 py-2 text-xs uppercase tracking-wide text-navy/40">Recent Questions</p>
        <div className="space-y-1">
          {conversations.map((conv) => (
            <Button
              type="button"
              key={conv.id}
              variant="ghost"
              className={`h-auto min-h-[2.5rem] w-full justify-start gap-2 rounded-lg px-3 py-2.5 text-left shadow-none whitespace-normal hover:bg-accent ${
                activeId === conv.id
                  ? 'border border-gold/20 bg-gold/10 text-navy'
                  : 'text-navy/60 hover:text-navy'
              }`}
              onClick={() => onSelect(conv.id)}
            >
              <IconMessageSquare className="mt-0.5 h-3.5 w-3.5 shrink-0 self-start" />
              <span className="font-body text-sm leading-snug line-clamp-2">{conv.title}</span>
            </Button>
          ))}
        </div>
      </div>

      <div className="border-t border-parchment-dark p-4">
        <p className="text-center font-body text-xs text-navy/40">Scholarly AI Research Tool</p>
      </div>
    </aside>
  );
}
