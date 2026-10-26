import React from 'react';
import { Menu, Calendar, Sparkles, Plus, ArrowLeft } from 'lucide-react';
import type { ActiveView, StudyRoom } from '../../types';
import { useAuth } from '../../context/AuthContext';

interface TopbarProps {
  currentView: ActiveView;
  activeRoom: StudyRoom | null;
  onOpenMobile: () => void;
  onNavigate: (view: ActiveView) => void;
  onCreateRoom: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({
  currentView,
  activeRoom,
  onOpenMobile,
  onNavigate,
  onCreateRoom
}) => {
  const { user } = useAuth();

  const viewTitles: Record<ActiveView, string> = {
    landing: 'Home',
    dashboard: 'Dashboard Overview',
    rooms: 'Study Rooms Directory',
    'room-detail': activeRoom ? activeRoom.name : 'Virtual Study Room',
    resources: 'Cloud Notes & Resources',
    analytics: 'Productivity Analytics',
    profile: 'Profile & Cloud Settings'
  };

  const todayStr = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  }).format(new Date());

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 px-4 sm:px-8 flex items-center justify-between">
      {/* Left breadcrumb area */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobile}
          className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden"
          aria-label="Toggle navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {currentView === 'room-detail' ? (
          <button
            onClick={() => onNavigate('rooms')}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>All Rooms</span>
            <span className="text-slate-300 dark:text-slate-700">/</span>
            <span className="text-slate-900 dark:text-white font-bold truncate max-w-[200px] sm:max-w-xs">
              {activeRoom?.name || 'Study Room'}
            </span>
          </button>
        ) : (
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span className="hidden sm:inline">Workspace</span>
            <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">/</span>
            <span className="font-bold text-slate-900 dark:text-white text-sm">
              {viewTitles[currentView]}
            </span>
          </div>
        )}
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-3">
        {/* Today date pill */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100/80 dark:bg-slate-800/80 text-xs font-medium text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60">
          <Calendar className="w-3.5 h-3.5 text-primary-500" />
          <span>{todayStr}</span>
        </div>

        {/* Quick Create Room Button */}
        <button
          onClick={onCreateRoom}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-xl transition-all shadow-sm hover:shadow"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden xs:inline">Create Room</span>
        </button>

        {/* User avatar */}
        <div
          onClick={() => onNavigate('profile')}
          className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-600 text-white font-bold text-xs flex items-center justify-center cursor-pointer shadow-sm ring-2 ring-primary-100 dark:ring-primary-950"
          title={user?.displayName || 'Student Profile'}
        >
          {user?.displayName ? user.displayName.substring(0, 2).toUpperCase() : 'ST'}
        </div>
      </div>
    </header>
  );
};
