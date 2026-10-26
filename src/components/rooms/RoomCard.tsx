import React from 'react';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { Users, Copy, Check, ArrowUpRight, ShieldCheck } from 'lucide-react';
import type { StudyRoom } from '../../types';
import { useToast } from '../layout/Toast';

interface RoomCardProps {
  room: StudyRoom;
  onEnter: (room: StudyRoom) => void;
}

export const RoomCard: React.FC<RoomCardProps> = ({ room, onEnter }) => {
  const [copied, setCopied] = React.useState(false);
  const { showToast } = useToast();

  const copyCode = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (room.code) {
      navigator.clipboard.writeText(room.code);
      setCopied(true);
      showToast(`Room code ${room.code} copied to clipboard!`, 'info');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const categoryVariants: Record<string, 'purple' | 'blue' | 'amber' | 'emerald'> = {
    Technology: 'blue',
    'Exam prep': 'amber',
    Creative: 'purple',
    General: 'emerald'
  };

  return (
    <Card
      hoverable
      onClick={() => onEnter(room)}
      className="cursor-pointer flex flex-col justify-between group transition-all"
    >
      <div>
        {/* Top badges */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            <Badge variant={categoryVariants[room.category] || 'purple'}>
              {room.category}
            </Badge>
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
              {room.vibe}
            </span>
          </div>

          {/* Room Code Badge */}
          <button
            onClick={copyCode}
            title="Click to copy room code"
            className="flex items-center gap-1 px-2 py-0.5 rounded-md font-mono text-[11px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <span>{room.code || 'CODE'}</span>
            {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
          </button>
        </div>

        {/* Room Title */}
        <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors line-clamp-1 mb-1.5">
          {room.name}
        </h3>

        {/* Description */}
        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed mb-4">
          {room.description}
        </p>
      </div>

      {/* Footer: Host & Members */}
      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Member avatar stack */}
          <div className="flex -space-x-1.5 overflow-hidden">
            <div className="w-6 h-6 rounded-full bg-purple-200 dark:bg-purple-900 text-purple-800 dark:text-purple-200 text-[10px] font-bold flex items-center justify-center ring-2 ring-white dark:ring-slate-900">
              M
            </div>
            <div className="w-6 h-6 rounded-full bg-blue-200 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-[10px] font-bold flex items-center justify-center ring-2 ring-white dark:ring-slate-900">
              A
            </div>
            <div className="w-6 h-6 rounded-full bg-emerald-200 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 text-[10px] font-bold flex items-center justify-center ring-2 ring-white dark:ring-slate-900">
              I
            </div>
          </div>
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1">
            <Users className="w-3.5 h-3.5 text-slate-400" />
            {room.memberCount || 3} studying
          </span>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onEnter(room);
          }}
          className="text-xs font-bold text-primary-600 dark:text-primary-400 group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5"
        >
          <span>Join</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </Card>
  );
};
