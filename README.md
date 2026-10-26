# StudySphere — Cloud-Based Collaborative Virtual Study Room

[![Cloud Computing Mini-Project](https://img.shields.io/badge/Project-Cloud%20Computing%20Mini--Project-7c3aed.svg)](https://firebase.google.com/)
[![React](https://img.shields.io/badge/Frontend-React%2018%20%2B%20Vite%20%2B%20TypeScript-61dafb.svg)](https://react.dev/)
[![Firebase](https://img.shields.io/badge/BaaS-Firebase%20v10%20(GCP)-ffca28.svg)](https://firebase.google.com/)
[![Tailwind CSS](https://img.shields.io/badge/Styling-Tailwind%20CSS%203.4-38bdf8.svg)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/Status-Faculty%20Evaluation%20Ready-success.svg)](#)

> **StudySphere** is a modern, responsive, full-stack cloud application designed for college students to study together online in real time, synchronize Pomodoro focus timers, collaborate on sprint checklists, exchange cloud notes and PDFs, and track daily productivity streaks.

---

## 🏛️ Cloud Computing Architecture & Concepts

StudySphere implements all **six required Cloud Computing concepts** end-to-end:

```text
 ┌────────────────────────────────────────────────────────────────────────┐
 │                      STUDENT CLIENT APPLICATION                         │
 │     React 18 + Vite SPA · TypeScript · Tailwind CSS · Web Audio API     │
 └───────┬────────────────────────────┬────────────────────────────┬──────┘
         │ (1) Firebase Hosting (CDN) │ (2) Firebase Auth (IAM)    │
         ▼                            ▼                            ▼
 ┌────────────────┐           ┌────────────────┐           ┌──────────────┐
 │ Google Cloud   │           │ Firebase Auth  │           │ Web Audio    │
 │ Edge Global CDN│           │ Email/Password │           │ Client Synth │
 │ (SSL & SPA)    │           │ Google OAuth   │           │ (Ambience)   │
 └────────────────┘           └───────┬────────┘           └──────────────┘
                                      │ Authenticated JWT Token
         ┌────────────────────────────┼────────────────────────────┐
         │                            │                            │
         ▼                            ▼                            ▼
 ┌──────────────────────┐   ┌──────────────────────┐   ┌──────────────────┐
 │ (3) Cloud Firestore  │   │ (4) Cloud Storage    │   │ (5) Cloud FaaS   │
 │ Multi-Region NoSQL DB│   │ Object Storage       │   │ Serverless Node  │
 │ • onSnapshot WS      │   │ • PDF Notes & Cheats │   │ • Anti-spoof     │
 │ • Rooms & Members    │   │ • 15MB MIME Guard    │   │   session audit  │
 │ • Real-Time Chat     │   │ • Storage Security   │   │ • Atomic Stats   │
 │ • Sync Pomodoro State│   │   Rules              │   │   Increments     │
 └──────────────────────┘   └──────────────────────┘   └──────────────────┘
                                      │
                                      ▼
                        ┌───────────────────────────┐
                        │ (6) Collaborative Presence │
                        │ • Distributed Timestamps  │
                        │ • Live Room Member Badges │
                        │ • Real-time Task Board    │
                        └───────────────────────────┘
```

| Cloud Computing Concept | Implementation in StudySphere | Real-World Benefit |
| :--- | :--- | :--- |
| **A. Cloud Storage (BaaS)** | Firebase Cloud Storage bucket with MIME validation, progress bar, and uploader security rules. | Safe, scalable storage for PDFs, exam revision sheets, and lecture slides. |
| **B. Real-Time Database** | Cloud Firestore multi-region NoSQL database with WebSocket `onSnapshot` distributed listeners. | Instant synchronization of rooms, active tasks, and peer discussion. |
| **C. Cloud Authentication (IAM)** | Firebase Authentication with email/password, Google Sign-in popup, and password reset flows. | Industry-standard token-based identity, preventing manual password leaks. |
| **D. Serverless Functions (FaaS)** | Firebase Cloud Functions (Node.js 18) for anti-spoof session validation and atomic counters. | Executes server-side business logic without maintaining or patching Linux servers. |
| **E. Real-Time Collaboration** | Shared Pomodoro timer using server epoch timestamps (`endsAt`), presence indicators, and task toggle. | Prevents timer drift between students on different devices or network speeds. |
| **F. High-Availability Hosting** | Firebase Edge Hosting with global CDN cache, HTTP/2, automated SSL certificates, and SPA rewrites. | 99.99% availability accessible worldwide from any smartphone, tablet, or laptop. |

---

## 🚀 Quick Start (2 Minutes)

StudySphere includes a **Zero-Setup Interactive Demo Mode** allowing faculty and students to run and test all pages, timers, audio synthesis, task boards, and upload workflows immediately without needing to create a cloud billing account beforehand.

### 1. Install & Run Locally
```bash
# Navigate to the project directory
cd StudySphere_Mini_Project

# Install dependencies (React, Vite, Firebase, Tailwind, Lucide, Confetti)
npm install

# Start the development server
npm run dev
```

Visit **`http://localhost:3000`** in your browser.

### 2. Build for Production
```bash
npm run build
```
This produces an optimized, minified production build in the `dist/` directory ready for deployment to Firebase Hosting or Vercel.

---

## ☁️ Connecting Your Live Firebase Project (Optional Full Cloud Sync)

To connect your own Google Cloud / Firebase project for live multi-device synchronization:

### Step 1: Create a Firebase Project
1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Click **Add Project** and name it (e.g., `studysphere-college-project`).
3. Disable Google Analytics (optional) and click **Create Project**.

### Step 2: Register a Web App & Copy Configuration
1. In Project Overview, click the **Web icon (`</>`)** to add a web application.
2. Enter the app nickname: `studysphere-web`.
3. Copy your project configuration keys.

### Step 3: Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Update `.env` with your actual Firebase credentials:
```env
VITE_FIREBASE_API_KEY=AIzaSyD...
VITE_FIREBASE_AUTH_DOMAIN=studysphere-college-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=studysphere-college-project
VITE_FIREBASE_STORAGE_BUCKET=studysphere-college-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef123456
```

### Step 4: Enable Firebase Services in Console
1. **Authentication**: Go to *Build -> Authentication* -> Click *Get Started* -> Enable **Email/Password** and **Google**.
2. **Cloud Firestore**: Go to *Build -> Firestore Database* -> Click *Create Database* -> Choose a location (e.g. `nam5` or `asia-south1`) -> Start in **Test mode** or deploy `firestore.rules`.
3. **Cloud Storage**: Go to *Build -> Storage* -> Click *Get Started* -> Accept default bucket.

### Step 5: Deploy Security Rules & Hosting
Install the Firebase CLI globally:
```bash
npm install -g firebase-tools
firebase login
firebase use --add studysphere-college-project

# Deploy Firestore & Storage rules
firebase deploy --only firestore:rules,storage

# Build and deploy hosting
npm run build
firebase deploy --only hosting
```

Your app will be live at: `https://<YOUR-PROJECT-ID>.web.app`

---

## 📁 Project Structure

```text
StudySphere_Mini_Project/
├── functions/                     # Serverless Cloud Functions (Node.js 18)
│   ├── index.js                   # recordFocusSession, onRoomCreated, onTaskUpdated
│   └── package.json               # firebase-functions & firebase-admin
├── prototype_v1/                  # Preserved Phase 1 starter prototype archive
├── public/                        # Static public assets
├── src/
│   ├── components/
│   │   ├── auth/                  # AuthModal (Email/Pass, Google, Demo Student Login)
│   │   ├── chat/                  # RoomChat (Real-time messages, Bot announcements)
│   │   ├── common/                # Card, Badge, Modal, EmptyState
│   │   ├── layout/                # Sidebar, Topbar, Toast Provider
│   │   ├── resources/             # ResourceCard, ResourceUploadModal
│   │   ├── rooms/                 # RoomCard, CreateRoomModal, JoinRoomModal
│   │   ├── tasks/                 # CollaborativeTasks (Real-time toggle & progress)
│   │   └── timer/                 # PomodoroTimer (Synced SVG ring, Web Audio ambience)
│   ├── config/
│   │   └── firebase.ts            # Firebase SDK init & live cloud diagnostic report
│   ├── context/
│   │   ├── AuthContext.tsx        # User state, profile, goal updates
│   │   └── ThemeContext.tsx       # Dark & Light mode management
│   ├── pages/
│   │   ├── AnalyticsPage.tsx      # 7-day focus chart, CSV log exporter
│   │   ├── DashboardPage.tsx      # Overview metrics, streak, today's goals
│   │   ├── LandingPage.tsx        # Project intro, 6 cloud computing concepts
│   │   ├── ProfilePage.tsx        # Student identity, daily goals, cloud diagnostics
│   │   ├── ResourcesPage.tsx      # Cloud notes & PDF file manager
│   │   ├── RoomsPage.tsx          # Study room directory, search & category filters
│   │   └── StudyRoomPage.tsx      # Live collaborative room (Timer + Tasks + Chat)
│   ├── services/
│   │   ├── audioService.ts        # Synthesized Web Audio chimes & ambient sounds
│   │   ├── authService.ts         # Firebase Auth & demo profile bridge
│   │   ├── firestoreService.ts    # Firestore real-time onSnapshot queries & CRUD
│   │   └── storageService.ts      # Cloud Storage upload progress & validation
│   ├── types/
│   │   └── index.ts               # Complete TypeScript domain models
│   ├── App.tsx                    # Main orchestrator & hash router
│   ├── index.css                  # Tailwind CSS styling
│   └── main.tsx                   # React root entry
├── .env.example                   # Environment variable template
├── firebase.json                  # Hosting, Firestore, Storage & Functions configuration
├── firestore.rules                # Production Firestore security rules
├── storage.rules                  # Production Cloud Storage security rules
├── tailwind.config.js             # Calm lavender / slate palette & animations
├── tsconfig.json                  # Strict TypeScript compiler options
└── vite.config.ts                 # Vite bundle configuration with manual chunk splitting
```

---

## 🎓 Faculty Evaluation & Viva Voce Guide

When presenting this project to your college faculty, use these standard questions and technical answers:

### Q1: How does StudySphere solve the problem of timer drift in distributed rooms?
> **Answer:** Client timers using `setInterval` drift due to CPU throttling, background tab sleep, and device clock variances. StudySphere solves this using a **Server Timestamp Synchronization Model**. When the timer starts, the server computes and stores `endsAt = serverTimestamp() + remainingSeconds * 1000`. Every connected client derives their remaining countdown locally using `Math.max(0, Math.round((endsAt - Date.now()) / 1000))`. This guarantees that all participants remain 100% synchronized even across different operating systems or network latencies.

### Q2: What security measures prevent fraudulent study time claims?
> **Answer:** In `functions/index.js`, the serverless function `recordFocusSession` verifies that:
> 1. The caller possesses a valid cryptographically signed Firebase JWT session token (`context.auth`).
> 2. The session duration lies within realistic bounds (1 to 180 minutes).
> 3. The elapsed time between client session start and submission matches the claimed study duration.
> 4. User total minutes and completed sessions are incremented atomically using Firestore `FieldValue.increment` on the server, preventing race conditions and client-side payload tampering.

### Q3: How do Cloud Firestore Security Rules enforce multi-tenant isolation?
> **Answer:** In `firestore.rules`, access is controlled at the document path level:
> - Users can only write to their own profile: `request.auth.uid == userId`.
> - Room deletion is strictly restricted to the room host: `resource.data.hostId == request.auth.uid`.
> - File deletion in Cloud Storage (`storage.rules`) is restricted to the original uploader (`request.auth.uid == userId`).

### Q4: Why is Firebase classified as Backend-as-a-Service (BaaS) and Functions as Function-as-a-Service (FaaS)?
> **Answer:**
> - **BaaS (Backend-as-a-Service):** Firebase Authentication, Cloud Firestore, and Cloud Storage eliminate the need to write and host redundant CRUD REST APIs, database clustering software, or file storage daemons.
> - **FaaS (Function-as-a-Service):** Firebase Cloud Functions allows event-driven microservices (like session validation or celebratory chat bot triggers) to run on-demand in ephemeral containers, scaling down to zero when idle with zero idle server cost.

---

## 🛠️ Diagnostics & Troubleshooting

| Issue | Cause | Solution |
| :--- | :--- | :--- |
| **"Local Demo Mode Active"** | No `.env` file present or credentials contain placeholders. | The app functions in interactive demo mode. To connect live cloud, copy `.env.example` to `.env` and insert your Firebase Project keys. |
| **"Firestore permission-denied"** | Security rules not deployed or user unauthenticated. | Run `firebase deploy --only firestore:rules`, or verify that the user is logged in via the Auth modal. |
| **"Storage upload fails"** | File exceeds 15MB limit or unapproved file extension. | Upload documents in PDF, DOCX, TXT, MD, PNG, JPG, or ZIP format under 15 MB. |
| **"Firebase Cloud Functions not deploying"** | Google Cloud project requires Blaze (Pay-as-you-go) plan for external Node.js functions. | Cloud Functions source code is fully provided in `functions/index.js`. The frontend includes automated fallback to direct secure Firestore logging if functions are unavailable. |

---

## 📄 License & Credits
Developed as an advanced **Cloud Computing College Mini-Project**. Built with React, TypeScript, Tailwind CSS, and Google Firebase Cloud Services.
