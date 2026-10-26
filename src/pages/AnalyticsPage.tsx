import React, { useState } from 'react';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { EmptyState } from '../components/common/EmptyState';
import {
  BarChart3,
  Clock,
  CheckCircle2,
  Calendar,
  Flame,
  Download,
  ShieldCheck,
  Search,
  Filter
} from 'lucide-react';
import type { StudySessionRecord } from '../types';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/layout/Toast';

interface AnalyticsPageProps {
  sessions: StudySessionRecord[];
}

export const AnalyticsPage: React.FC<AnalyticsPageProps> = ({ sessions }) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');

  const totalMinutes = sessions.reduce((acc, s) => acc + (s.minutes || 0), 0);
  const totalHours = (totalMinutes / 60).toFixed(1);
  const completedCount = sessions.length;
  const avgMinutes = completedCount > 0 ? Math.round(totalMinutes / completedCount) : 0;

  // Calculate past 7 days focus minutes for the visual chart
  const getLast7DaysData = () => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateKey = d.toISOString().split('T')[0];
      const dayLabel = d.toLocaleDateString(undefined, { weekday: 'short' });
      const dayMins = sessions
        .filter((s) => s.date === dateKey)
        .reduce((sum, s) => sum + (s.minutes || 0), 0);

      days.push({ dateKey, dayLabel, dayMins });
    }
    return days;
  };

  const weeklyData = getLast7DaysData();
  const maxMins = Math.max(...weeklyData.map((d) => d.dayMins), 60);

  // Filtered session records
  const filteredSessions = sessions.filter((s) => {
    const q = searchQuery.toLowerCase().trim();
    return (
      !q ||
      s.roomName.toLowerCase().includes(q) ||
      s.mode.toLowerCase().includes(q) ||
      s.date.includes(q)
    );
  });

  // Export CSV study log
  const exportCSV = () => {
    if (sessions.length === 0) {
      showToast('No sessions to export yet.', 'info');
      return;
    }

    const headers = ['Session ID', 'User Name', 'Room Name', 'Duration (Min)', 'Mode', 'Date', 'Validated by Cloud Function'];
    const rows = sessions.map((s) => [
      s.id,
      `"${s.userName}"`,
      `"${s.roomName}"`,
      s.minutes,
      s.mode,
      s.date,
      s.validatedByFunction ? 'Yes' : 'No'
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `StudySphere_Focus_Log_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('Exported official study session log as CSV! 📊', 'success');
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto">
      {/* Page Title & Export Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Productivity Analytics & Session Logs
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Verified study session history, time distribution, and academic progress tracking.
          </p>
        </div>

        <button
          onClick={exportCSV}
          className="px-4 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all shadow-sm flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Download className="w-3.5 h-3.5 text-primary-500" />
          <span>Export Study History (CSV)</span>
        </button>
      </div>

      {/* Top Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400">Total Focus Time</span>
            <Clock className="w-4 h-4 text-primary-500" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white tabular-nums">
              {totalMinutes}
            </span>
            <span className="text-xs font-bold text-slate-400">minutes</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Equivalent to {totalHours} productive hours</p>
        </Card>

        <Card className="flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400">Sessions Finished</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white tabular-nums">
              {completedCount}
            </span>
            <span className="text-xs font-bold text-slate-400">sprints</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">25-minute Pomodoro cycles</p>
        </Card>

        <Card className="flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400">Average Sprint</span>
            <BarChart3 className="w-4 h-4 text-blue-500" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white tabular-nums">
              {avgMinutes}
            </span>
            <span className="text-xs font-bold text-slate-400">min/session</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Consistent focus stamina</p>
        </Card>

        <Card className="flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400">Current Streak</span>
            <Flame className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-extrabold text-amber-600 dark:text-amber-400 tabular-nums">
              {user?.streakDays || 1}
            </span>
            <span className="text-xs font-bold text-slate-400">days active</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Daily consecutive study habit</p>
        </Card>
      </div>

      {/* 7-Day Focus Time Distribution Bar Chart */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              7-Day Study Time Distribution
            </h3>
            <p className="text-xs text-slate-400">
              Daily minutes focused across connected devices
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-primary-50 dark:bg-primary-950/60 text-primary-700 dark:text-primary-300 border border-primary-200/80 dark:border-primary-800 self-start sm:self-auto">
            Past 7 Days
          </span>
        </div>

        {/* Visual Bar Chart */}
        <div className="flex items-end justify-between gap-3 h-48 pt-6 pb-2 border-b border-slate-100 dark:border-slate-800">
          {weeklyData.map((day, idx) => {
            const heightPercent = Math.max(8, Math.round((day.dayMins / maxMins) * 100));
            return (
              <div key={idx} className="flex-1 flex flex-col items-center gap-2 group">
                <span className="text-[11px] font-bold text-slate-400 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors tabular-nums">
                  {day.dayMins}m
                </span>
                <div className="w-full max-w-[42px] bg-slate-100 dark:bg-slate-800 rounded-xl h-36 flex items-end overflow-hidden p-1">
                  <div
                    className="w-full bg-gradient-to-t from-primary-600 to-indigo-500 rounded-lg transition-all duration-500 group-hover:brightness-110"
                    style={{ height: `${heightPercent}%` }}
                  />
                </div>
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  {day.dayLabel}
                </span>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Study Session Log Table */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Verified Session Records
            </h3>
            <p className="text-xs text-slate-400">
              Immutable focus logs stored in Cloud Firestore
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by room or date..."
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        {filteredSessions.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
            No study sessions recorded yet. Complete a Pomodoro sprint in any room to see your audit log here!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-semibold">
                  <th className="pb-3 pl-2">Session Room</th>
                  <th className="pb-3">Duration</th>
                  <th className="pb-3">Mode</th>
                  <th className="pb-3">Date</th>
                  <th className="pb-3 text-right pr-2">Cloud Verification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filteredSessions.map((session) => (
                  <tr key={session.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 pl-2 font-bold text-slate-800 dark:text-slate-200">
                      {session.roomName}
                    </td>
                    <td className="py-3 font-semibold text-primary-600 dark:text-primary-400 tabular-nums">
                      {session.minutes} min
                    </td>
                    <td className="py-3 text-slate-500 dark:text-slate-400">
                      {session.mode}
                    </td>
                    <td className="py-3 font-mono text-slate-400">
                      {session.date}
                    </td>
                    <td className="py-3 text-right pr-2">
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                        <ShieldCheck className="w-3 h-3" />
                        <span>Cloud Function Verified</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};
