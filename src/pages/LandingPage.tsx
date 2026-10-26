import React from 'react';
import {
  Sparkles,
  ArrowRight,
  Cloud,
  Database,
  Lock,
  Zap,
  Users,
  Globe,
  CheckCircle2,
  Clock,
  BookOpen,
  ShieldCheck
} from 'lucide-react';
import type { ActiveView, StudyRoom } from '../types';
import { useAuth } from '../context/AuthContext';

interface LandingPageProps {
  onNavigate: (view: ActiveView) => void;
  onOpenAuth: () => void;
  featuredRooms: StudyRoom[];
  onEnterRoom: (room: StudyRoom) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onNavigate,
  onOpenAuth,
  featuredRooms,
  onEnterRoom
}) => {
  const { user, isFirebaseConnected } = useAuth();

  const cloudConcepts = [
    {
      icon: Cloud,
      title: 'Cloud Storage (BaaS)',
      color: 'text-blue-500 bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-900',
      description: 'Firebase Cloud Storage bucket for uploading lecture notes and PDFs with progress tracking and metadata indexing.'
    },
    {
      icon: Database,
      title: 'Real-Time Database',
      color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-900',
      description: 'Cloud Firestore multi-region NoSQL database with WebSocket onSnapshot listeners for live room state and instant task sync.'
    },
    {
      icon: Lock,
      title: 'Cloud Authentication (IAM)',
      color: 'text-purple-500 bg-purple-50 dark:bg-purple-950/60 border-purple-200 dark:border-purple-900',
      description: 'Firebase Auth identity service supporting secure email/password sessions, Google OAuth, and encrypted JWT tokens.'
    },
    {
      icon: Zap,
      title: 'Serverless Functions (FaaS)',
      color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-900',
      description: 'Cloud Functions for server-side focus session verification, anti-spoof duration validation, and atomic database increments.'
    },
    {
      icon: Users,
      title: 'Real-Time Collaboration',
      color: 'text-rose-500 bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-900',
      description: 'Distributed synchronized Pomodoro timer, shared task boards, presence indicators, and peer room chat.'
    },
    {
      icon: Globe,
      title: 'Edge Cloud Hosting',
      color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-900',
      description: 'Fast, secure CDN hosting on Google Cloud infrastructure with global SSL certificates and single-page routing rewrites.'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* Top landing navigation bar */}
      <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 px-6 py-4 flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary-600 to-indigo-500 text-white flex items-center justify-center shadow-md shadow-primary-500/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-lg text-slate-900 dark:text-white tracking-tight">
              Study<span className="text-primary-600 dark:text-primary-400">Sphere</span>
            </span>
            <span className="ml-2 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-primary-100 dark:bg-primary-950 text-primary-700 dark:text-primary-300">
              Cloud v2.0
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <button
              onClick={() => onNavigate('dashboard')}
              className="px-4 py-2 text-xs font-bold text-white bg-primary-600 hover:bg-primary-700 rounded-xl transition-all shadow-md shadow-primary-500/20 flex items-center gap-1.5"
            >
              <span>Go to Workspace</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <>
              <button
                onClick={onOpenAuth}
                className="px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              >
                Sign In
              </button>
              <button
                onClick={onOpenAuth}
                className="px-4 py-2 text-xs font-bold text-white bg-primary-600 hover:bg-primary-700 rounded-xl transition-all shadow-md shadow-primary-500/20"
              >
                Get Started
              </button>
            </>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 px-6 max-w-7xl mx-auto text-center">
        {/* Subtle background blurs */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary-50 dark:bg-primary-950/60 border border-primary-200/80 dark:border-primary-800 text-primary-700 dark:text-primary-300 text-xs font-bold tracking-tight mb-6 animate-fade-in">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Cloud Computing Collaborative Virtual Study Platform</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white max-w-3xl mx-auto leading-tight mb-6">
          Where focused minds <br />
          <span className="bg-gradient-to-r from-primary-600 via-indigo-500 to-purple-600 bg-clip-text text-transparent">
            build together in the cloud.
          </span>
        </h1>

        <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed mb-8">
          A modern virtual study room for college students. Synchronize Pomodoro timers across peers, collaborate on shared tasks, exchange cloud notes, and track real-time study streaks.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4">
          <button
            onClick={() => onNavigate('dashboard')}
            className="px-6 py-3.5 rounded-2xl text-sm font-bold text-white bg-primary-600 hover:bg-primary-700 active:scale-95 transition-all shadow-lg shadow-primary-500/30 flex items-center gap-2"
          >
            <span>Enter Study Workspace</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => onNavigate('rooms')}
            className="px-6 py-3.5 rounded-2xl text-sm font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all shadow-sm"
          >
            Browse Study Rooms
          </button>
        </div>

        {/* Status banner */}
        <div className="mt-10 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 shadow-sm">
          <span className={`w-2 h-2 rounded-full ${isFirebaseConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
          <span>{isFirebaseConnected ? 'Google Cloud & Firebase live sync active' : 'Interactive Demo Mode active (Zero setup required to explore)'}</span>
        </div>
      </section>

      {/* Cloud Computing Architecture Showcase */}
      <section className="py-16 px-6 max-w-7xl mx-auto border-t border-slate-200 dark:border-slate-800">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-widest text-primary-600 dark:text-primary-400">
            College Mini-Project Architecture
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-2">
            6 Core Cloud Computing Concepts Implemented
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
            Full-stack implementation demonstrating real-world cloud services, serverless execution, and multi-client distributed synchronization.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cloudConcepts.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm hover:shadow-md transition-all hover:-translate-y-1"
              >
                <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center mb-4 ${item.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
                  {item.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  {item.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Featured Rooms Showcase */}
      <section className="py-16 px-6 max-w-7xl mx-auto border-t border-slate-200 dark:border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-primary-600 dark:text-primary-400">
              Live Virtual Rooms
            </span>
            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
              Join an Active Study Vibe
            </h2>
          </div>
          <button
            onClick={() => onNavigate('rooms')}
            className="text-xs font-bold text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1 self-start sm:self-auto"
          >
            <span>View all rooms</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {featuredRooms.slice(0, 3).map((room) => (
            <div
              key={room.id}
              onClick={() => onEnterRoom(room)}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm hover:shadow-md hover:border-primary-300 dark:hover:border-primary-800 transition-all cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-950 px-2.5 py-0.5 rounded-full">
                    {room.category}
                  </span>
                  <span className="font-mono text-xs font-bold text-slate-400">
                    {room.code}
                  </span>
                </div>
                <h4 className="text-base font-bold text-slate-900 dark:text-white mb-1.5">
                  {room.name}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed mb-4">
                  {room.description}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">
                  Host: {room.hostName}
                </span>
                <span className="font-bold text-primary-600 dark:text-primary-400 flex items-center gap-0.5">
                  Enter Room →
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400">
        <p className="font-medium text-slate-500 dark:text-slate-400">
          StudySphere — Cloud Computing Mini-Project · Powered by Firebase & React
        </p>
        <p className="mt-1 text-[11px]">
          Demonstrates Cloud Storage, Firestore Real-Time Database, Authentication, Serverless Cloud Functions, and CDN Hosting.
        </p>
      </footer>
    </div>
  );
};
