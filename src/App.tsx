import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider, useToast } from './components/layout/Toast';
import { Sidebar } from './components/layout/Sidebar';
import { Topbar } from './components/layout/Topbar';
import { AuthModal } from './components/auth/AuthModal';
import { CreateRoomModal } from './components/rooms/CreateRoomModal';
import { JoinRoomModal } from './components/rooms/JoinRoomModal';
import { ResourceUploadModal } from './components/resources/ResourceUploadModal';

import { LandingPage } from './pages/LandingPage';
import { DashboardPage } from './pages/DashboardPage';
import { RoomsPage } from './pages/RoomsPage';
import { StudyRoomPage } from './pages/StudyRoomPage';
import { ResourcesPage } from './pages/ResourcesPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { ProfilePage } from './pages/ProfilePage';

import { firestoreService } from './services/firestoreService';
import { storageService } from './services/storageService';
import type { ActiveView, StudyRoom, StudyResource, StudySessionRecord } from './types';

const MainApp: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [currentView, setCurrentView] = useState<ActiveView>('landing');
  const [activeRoom, setActiveRoom] = useState<StudyRoom | null>(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Modals state
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isCreateRoomModalOpen, setIsCreateRoomModalOpen] = useState(false);
  const [isJoinRoomModalOpen, setIsJoinRoomModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadRoomId, setUploadRoomId] = useState<string | null>(null);

  // Real-time datasets
  const [rooms, setRooms] = useState<StudyRoom[]>([]);
  const [resources, setResources] = useState<StudyResource[]>([]);
  const [sessions, setSessions] = useState<StudySessionRecord[]>([]);

  // Subscribe to live Rooms
  useEffect(() => {
    const unsub = firestoreService.subscribeRooms((roomList) => {
      setRooms(roomList);
    });
    return () => unsub();
  }, []);

  // Subscribe to live Resources
  useEffect(() => {
    const unsub = firestoreService.subscribeResources((resList) => {
      setResources(resList);
    });
    return () => unsub();
  }, []);

  // Subscribe to user study sessions
  useEffect(() => {
    if (!user) return;
    const unsub = firestoreService.subscribeUserSessions(user.uid, (sessionList) => {
      setSessions(sessionList);
    });
    return () => unsub();
  }, [user]);

  // Handle URL hash navigation
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace('#', '') as ActiveView;
      if (['dashboard', 'rooms', 'resources', 'analytics', 'profile', 'landing'].includes(hash)) {
        setCurrentView(hash);
      }
    };
    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const navigateTo = (view: ActiveView) => {
    setCurrentView(view);
    window.location.hash = view;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleEnterRoom = (room: StudyRoom) => {
    setActiveRoom(room);
    setCurrentView('room-detail');
    showToast(`Entered ${room.name}. Let’s focus! ✦`, 'info');
  };

  const handleLeaveRoom = () => {
    setActiveRoom(null);
    navigateTo('rooms');
    showToast('Left study room.', 'info');
  };

  const handleOpenUploadForRoom = (roomId: string) => {
    setUploadRoomId(roomId);
    setIsUploadModalOpen(true);
  };

  const handleDeleteResource = async (resource: StudyResource) => {
    await storageService.deleteStudyResource(resource);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans selection:bg-primary-500 selection:text-white">
      {currentView === 'landing' ? (
        <LandingPage
          onNavigate={navigateTo}
          onOpenAuth={() => setIsAuthModalOpen(true)}
          featuredRooms={rooms}
          onEnterRoom={handleEnterRoom}
        />
      ) : (
        <div className="flex min-h-screen">
          {/* Main Workspace Sidebar */}
          <Sidebar
            currentView={currentView}
            onNavigate={navigateTo}
            roomCount={rooms.length}
            isOpenMobile={isMobileSidebarOpen}
            onCloseMobile={() => setIsMobileSidebarOpen(false)}
          />

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col lg:pl-64 min-w-0">
            <Topbar
              currentView={currentView}
              activeRoom={activeRoom}
              onOpenMobile={() => setIsMobileSidebarOpen(true)}
              onNavigate={navigateTo}
              onCreateRoom={() => setIsCreateRoomModalOpen(true)}
            />

            <main className="flex-1 p-4 sm:p-8">
              {currentView === 'dashboard' && (
                <DashboardPage
                  onNavigate={navigateTo}
                  rooms={rooms}
                  sessions={sessions}
                  onEnterRoom={handleEnterRoom}
                  onCreateRoom={() => setIsCreateRoomModalOpen(true)}
                  onJoinCode={() => setIsJoinRoomModalOpen(true)}
                />
              )}

              {currentView === 'rooms' && (
                <RoomsPage
                  rooms={rooms}
                  onEnterRoom={handleEnterRoom}
                  onCreateRoom={() => setIsCreateRoomModalOpen(true)}
                  onJoinCode={() => setIsJoinRoomModalOpen(true)}
                />
              )}

              {currentView === 'room-detail' && activeRoom && (
                <StudyRoomPage
                  room={activeRoom}
                  onLeaveRoom={handleLeaveRoom}
                  onOpenUpload={handleOpenUploadForRoom}
                />
              )}

              {currentView === 'resources' && (
                <ResourcesPage
                  resources={resources}
                  onOpenUpload={() => {
                    setUploadRoomId(null);
                    setIsUploadModalOpen(true);
                  }}
                  onDeleteResource={handleDeleteResource}
                />
              )}

              {currentView === 'analytics' && (
                <AnalyticsPage sessions={sessions} />
              )}

              {currentView === 'profile' && <ProfilePage />}
            </main>
          </div>
        </div>
      )}

      {/* Global Modals */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      <CreateRoomModal
        isOpen={isCreateRoomModalOpen}
        onClose={() => setIsCreateRoomModalOpen(false)}
        onRoomCreated={(newRoom) => {
          handleEnterRoom(newRoom);
        }}
      />

      <JoinRoomModal
        isOpen={isJoinRoomModalOpen}
        onClose={() => setIsJoinRoomModalOpen(false)}
        rooms={rooms}
        onJoinSuccess={handleEnterRoom}
      />

      <ResourceUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => {
          setIsUploadModalOpen(false);
          setUploadRoomId(null);
        }}
        roomId={uploadRoomId}
        onUploadSuccess={() => {}}
      />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <MainApp />
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
