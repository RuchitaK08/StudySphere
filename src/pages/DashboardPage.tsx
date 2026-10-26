import React, { useState } from 'react';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { RoomCard } from '../components/rooms/RoomCard';
import {
  Clock,
  CheckCircle2,
  Target,
  Flame,
  Plus,
  ArrowRight,
  Sparkles,
  KeyRound,
  UploadCloud,
  Play
} from 'lucide-react';
import type { ActiveView, StudyRoom, StudySessionRecord } from '../types';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/layout/Toast';

interface DashboardPageProps {
  onNavigate: (view: ActiveView) => void;
  rooms: StudyRoom[];
  sessions: StudySessionRecord[];
  onEnterRoom: (room: StudyRoom) => void;
  onCreateRoom: () => void;
  onJoinCode: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onNavigate,
  rooms,
  sessions,
  onEnterRoom,
  onCreateRoom,
  onJoinCode
}) => {
  const { user, updateGoal } = useAuth();
  const { showToast } = useToast();
  const [editingGoal, setEditingGoal] = useState(false);
  const [goalInput, setGoalInput] = useState(String(user?.dailyGoalMinutes || 120));

  const todayStr = new Date().toISOString().split('T')[0];
  const todaySessions = sessions.filter((s) => s.date === todayStr);

  const todayMinutes = todaySessions.reduce((acc, s) => acc + (s.minutes || 0), 0);
  const totalMinutes = sessions.reduce((acc, s) => acc + (s.minutes || 0), 0);
  const dailyGoal = user?.dailyGoalMinutes || 120;
  const goalPercent = Math.min(100, Math.round((todayMinutes / Math.max(1, dailyGoal)) * 100));

  const handleSaveGoal = async () => {
    const parsed = parseInt(goalInput, 10);
    if (isNaN(parsed) || parsed < 15 || parsed > 720) {
      showToast('Please enter a goal between 15 and 720 minutes.', 'error');
      return;
    }
    await updateGoal(parsed);
    setEditingGoal(false);
    showToast(`Daily study goal updated to ${parsed} minutes! 🎯`, 'success');
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary-600 via-indigo-600 to-purple-600 p-6 sm:p-8 text-white shadow-lg shadow-primary-500/15">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>StudySphere Daily Focus</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome back, {user?.displayName || 'Student'}! ✦
            </h1>
            <p className="text-white/80 text-xs sm:text-sm mt-1.5 leading-relaxed">
              Every focused session brings you closer to mastery. Join a virtual room or jump into a quick solo focus block.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => onNavigate('rooms')}
              className="px-5 py-3 rounded-2xl text-xs font-bold bg-white text-primary-700 hover:bg-slate-100 transition-all shadow-md active:scale-95 flex items-center gap-2"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Enter a Study Room</span>
            </button>
            <button
              onClick={onCreateRoom}
              className="px-5 py-3 rounded-2xl text-xs font-bold bg-white/20 hover:bg-white/30 text-white backdrop-blur-md transition-all border border-white/20 flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Room</span>
            </button>
          </div>
        </div>
      </div>

      {/* Key Metric Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Focus Time */}
        <Card className="flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Total Focus Time
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white tabular-nums">
              {totalMinutes}
            </span>
            <span className="text-xs font-bold text-slate-400">min</span>
            <span className="text-xs text-slate-400 ml-1">
              ({(totalMinutes / 60).toFixed(1)} hrs)
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            Logged across all study rooms & sessions
          </p>
        </Card>

        {/* Sessions Finished */}
        <Card className="flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Completed Sprints
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white tabular-nums">
              {sessions.length}
            </span>
            <span className="text-xs font-bold text-slate-400">sessions</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            {todaySessions.length} completed today
          </p>
        </Card>

        {/* Daily Goal Progress */}
        <Card className="flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Today's Goal
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Target className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white tabular-nums">
              {goalPercent}%
            </span>
            <button
              onClick={() => setEditingGoal(true)}
              className="text-[11px] text-primary-600 dark:text-primary-400 font-semibold hover:underline"
            >
              Edit Goal
            </button>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden mt-2 mb-1">
            <div
              className="bg-primary-600 h-full transition-all duration-300"
              style={{ width: `${goalPercent}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-400">
            {todayMinutes} of {dailyGoal} min target
          </p>
        </Card>

        {/* Current Study Streak */}
        <Card className="flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Study Streak
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-extrabold text-amber-600 dark:text-amber-400 tabular-nums">
              {user?.streakDays || 1}
            </span>
            <span className="text-xs font-bold text-slate-400">days streak</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            Consistency is the secret to mastery 🔥
          </p>
        </Card>
      </div>

      {/* Quick Action Shortcuts */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={onCreateRoom}
          className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-primary-400 dark:hover:border-primary-700 shadow-sm hover:shadow transition-all text-left group"
        >
          <div className="w-8 h-8 rounded-xl bg-primary-50 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
            <Plus className="w-4 h-4" />
          </div>
          <h4 className="text-xs font-bold text-slate-900 dark:text-white">Create Room</h4>
          <p className="text-[10px] text-slate-400">Host your study group</p>
        </button>

        <button
          onClick={onJoinCode}
          className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-primary-400 dark:hover:border-primary-700 shadow-sm hover:shadow transition-all text-left group"
        >
          <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
            <KeyRound className="w-4 h-4" />
          </div>
          <h4 className="text-xs font-bold text-slate-900 dark:text-white">Join with Code</h4>
          <p className="text-[10px] text-slate-400">Enter a 6-digit code</p>
        </button>

        <button
          onClick={() => onNavigate('resources')}
          className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-primary-400 dark:hover:border-primary-700 shadow-sm hover:shadow transition-all text-left group"
        >
          <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
            <UploadCloud className="w-4 h-4" />
          </div>
          <h4 className="text-xs font-bold text-slate-900 dark:text-white">Cloud Notes</h4>
          <p className="text-[10px] text-slate-400">Upload & share PDFs</p>
        </button>

        <button
          onClick={() => onNavigate('analytics')}
          className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-primary-400 dark:hover:border-primary-700 shadow-sm hover:shadow transition-all text-left group"
        >
          <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
            <Sparkles className="w-4 h-4" />
          </div>
          <h4 className="text-xs font-bold text-slate-900 dark:text-white">Analytics</h4>
          <p className="text-[10px] text-slate-400">View progress logs</p>
        </button>
      </div>

      {/* Featured Active Rooms Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Active Virtual Study Rooms
            </h2>
            <p className="text-xs text-slate-400">
              Join students currently studying in synchronized focus sessions
            </p>
          </div>
          <button
            onClick={() => onNavigate('rooms')}
            className="text-xs font-bold text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1"
          >
            <span>Explore all ({rooms.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {rooms.slice(0, 3).map((room) => (
            <RoomCard key={room.id} room={room} onEnter={onEnterRoom} />
          ))}
        </div>
      </div>

      {/* Edit Goal Inline Modal */}
      {editingGoal && (
        <div className="p-4 bg-primary-50 dark:bg-primary-950/60 rounded-2xl border border-primary-200 dark:border-primary-900 flex flex-wrap items-center justify-between gap-3 animate-slide-up">
          <div>
            <h4 className="text-xs font-bold text-primary-900 dark:text-primary-200">
              Update Daily Focus Target
            </h4>
            <p className="text-[11px] text-primary-700 dark:text-primary-400">
              Set how many minutes of deep work you want to achieve today.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={15}
              max={720}
              step={15}
              value={goalInput}
              onChange={(e) => setGoalInput(e.target.value)}
              className="w-24 px-3 py-1.5 text-xs font-bold rounded-xl border border-primary-300 dark:border-primary-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none"
            />
            <span className="text-xs font-bold text-slate-600 dark:text-slate-300">min</span>
            <button
              onClick={handleSaveGoal}
              className="px-3.5 py-1.5 text-xs font-bold text-white bg-primary-600 hover:bg-primary-700 rounded-xl"
            >
              Save
            </button>
            <button
              onClick={() => setEditingGoal(false)}
              className="px-3 py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
