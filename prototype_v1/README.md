# StudySphere — Cloud-Based Virtual Study Room

A responsive Cloud Computing mini-project built with HTML, CSS, JavaScript and optional Firebase Cloud Firestore.

## Features
- Responsive student dashboard and room discovery
- Create and join study rooms; search and filter rooms
- Pomodoro focus timer (25-minute focus, 5-minute and 15-minute breaks)
- Study-session history, daily goal, and progress statistics
- Saves settings and study history to browser `localStorage` in demo mode
- Optional Firebase Cloud Firestore integration for shared room listings and cloud study-session records

## Run the demo in 2 minutes
1. Extract the ZIP.
2. Open the `studysphere` folder in VS Code.
3. Use the VS Code **Live Server** extension to open `index.html` (recommended because `app.js` uses ES modules), or run a local server from this folder with `python -m http.server 8000` and visit `http://localhost:8000`.
4. Create a room, join one, start the focus timer, and view your progress.

No Firebase account is required for local demo mode. Data is stored in the browser you use; it is not shared between different browsers or devices unless cloud sync is configured.

## Optional Firebase setup (for actual cloud persistence)
1. Open https://console.firebase.google.com/ and create a project.
2. Add a **Web app** in Project Overview and copy its Firebase configuration.
3. In Firebase Console, open **Firestore Database** and create a database.
4. In `app.js`, replace the placeholder values in `firebaseConfig` with the values from your Firebase web app.
5. Publish the app using Firebase Hosting (or another static web host).
6. For a classroom demo, use a suitable Firestore security rule and do not expose private data. The code currently writes to `studyRooms` and `studySessions` and listens to `studyRooms`.

### Simple temporary Firestore rules for a controlled demo only
These rules allow public reads and writes. They are **not safe for a public production app**. Use Firebase Authentication and owner-based rules before real public use.

```text
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /studyRooms/{doc} {
      allow read, write: if true;
    }
    match /studySessions/{doc} {
      allow read, write: if true;
    }
  }
}
```

## Cloud computing concepts to explain in viva
- **Cloud storage / database:** Firestore stores shared room data and session records remotely when configured.
- **Availability:** Static hosting allows access over the internet.
- **Scalability:** Managed services can scale with demand within the chosen plan and quotas.
- **Real-time data:** Firestore `onSnapshot` listens for changes to shared study rooms.
- **Local vs cloud persistence:** Local mode uses `localStorage`; cloud mode writes to Firestore. This makes it easy to demonstrate the difference.

## Limitations / honest demo notes
- Room membership count is a demonstration interaction, not a secure real-time presence system.
- This starter project does not include login or private chat. Do not describe these as implemented features in your report.
- The focus timer runs in the active browser tab. Session completion is recorded when the timer reaches zero.
- Firebase must be configured by you; the included project starts in local demo mode until then.
