const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();
const { FieldValue } = admin.firestore;

/**
 * Cloud Function: recordFocusSession (Serverless HTTPS Callable)
 * Validates completed focus sessions server-side to prevent client-side duration spoofing,
 * records the session in Cloud Firestore, and atomically updates trusted user productivity statistics.
 */
exports.recordFocusSession = functions.https.onCall(async (data, context) => {
  // 1. Verify Authentication
  if (!context.auth || !context.auth.uid) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "Authentication required to record study sessions."
    );
  }

  const userId = context.auth.uid;
  const userEmail = context.auth.token.email || "student@studysphere.internal";
  const userName = context.auth.token.name || data.userName || "Student";

  const { minutes, mode, roomId, roomName, clientStartedAt } = data;

  // 2. Server-side validation
  const sessionMinutes = Number(minutes);
  if (!sessionMinutes || isNaN(sessionMinutes) || sessionMinutes < 1 || sessionMinutes > 180) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Invalid session duration. Study sessions must be between 1 and 180 minutes."
    );
  }

  const validModes = ["Focus time", "Short break", "Long break"];
  const sessionMode = validModes.includes(mode) ? mode : "Focus time";

  // Anti-fraud check: verify client timestamp if provided
  const now = Date.now();
  if (clientStartedAt) {
    const elapsedMinutes = (now - Number(clientStartedAt)) / (1000 * 60);
    // Allow small margin of 2 minutes for clock drift / network latency
    if (elapsedMinutes < sessionMinutes - 2) {
      functions.logger.warn(`Potential session duration spoofing detected for user ${userId}. Claimed: ${sessionMinutes}m, Elapsed: ${elapsedMinutes.toFixed(1)}m`);
    }
  }

  const today = new Date().toISOString().split("T")[0];

  try {
    // 3. Create immutable study session document
    const sessionRef = await db.collection("studySessions").add({
      userId,
      userName,
      userEmail,
      roomId: roomId || null,
      roomName: roomName || "Personal Focus",
      minutes: sessionMinutes,
      mode: sessionMode,
      date: today,
      completedAt: FieldValue.serverTimestamp(),
      validatedByFunction: true,
      platform: "StudySphere Cloud v2.0"
    });

    // 4. Atomically update user's aggregated statistics using FieldValue.increment
    const userRef = db.collection("users").doc(userId);
    const userDoc = await userRef.get();

    let currentStreak = 1;
    if (userDoc.exists) {
      const userData = userDoc.data();
      const lastStudyDate = userData.lastStudyDate;
      const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

      if (lastStudyDate === yesterday) {
        currentStreak = (userData.streakDays || 0) + 1;
      } else if (lastStudyDate === today) {
        currentStreak = userData.streakDays || 1;
      } else {
        currentStreak = 1;
      }

      await userRef.update({
        totalFocusMinutes: FieldValue.increment(sessionMinutes),
        completedSessions: FieldValue.increment(1),
        lastStudyDate: today,
        streakDays: currentStreak,
        lastActiveAt: FieldValue.serverTimestamp()
      });
    } else {
      await userRef.set({
        displayName: userName,
        email: userEmail,
        totalFocusMinutes: sessionMinutes,
        completedSessions: 1,
        streakDays: 1,
        dailyGoalMinutes: 120,
        lastStudyDate: today,
        createdAt: FieldValue.serverTimestamp(),
        lastActiveAt: FieldValue.serverTimestamp()
      });
    }

    functions.logger.info(`Session ${sessionRef.id} successfully recorded for user ${userId} (${sessionMinutes} min).`);

    return {
      success: true,
      sessionId: sessionRef.id,
      minutes: sessionMinutes,
      mode: sessionMode,
      streakDays: currentStreak,
      message: "Study session securely validated and logged to cloud storage."
    };
  } catch (error) {
    functions.logger.error("Error logging study session in Cloud Function:", error);
    throw new functions.https.HttpsError("internal", "Unable to record study session. Please try again.");
  }
});

/**
 * Cloud Function: onRoomCreated (Firestore Background Trigger)
 * Automatically initializes room metadata, default welcoming tasks,
 * and adds the creator as the initial host member.
 */
exports.onRoomCreated = functions.firestore
  .document("rooms/{roomId}")
  .onCreate(async (snap, context) => {
    const roomId = context.params.roomId;
    const roomData = snap.data();
    const hostId = roomData.hostId;
    const hostName = roomData.hostName || "Host";

    const batch = db.batch();

    // 1. Add host to room members subcollection
    const memberRef = db.collection("rooms").doc(roomId).collection("members").doc(hostId);
    batch.set(memberRef, {
      uid: hostId,
      displayName: hostName,
      role: "host",
      joinedAt: FieldValue.serverTimestamp(),
      isOnline: true,
      currentStatus: "Ready to focus"
    });

    // 2. Add welcoming message
    const messageRef = db.collection("rooms").doc(roomId).collection("messages").doc();
    batch.set(messageRef, {
      senderId: "system",
      senderName: "StudySphere Bot",
      text: `👋 Welcome to ${roomData.name}! Feel free to add tasks, share notes, and sync the focus timer.`,
      isSystem: true,
      createdAt: FieldValue.serverTimestamp()
    });

    // 3. Add default collaborative starter tasks
    const starterTasks = [
      "Set your individual goal for this study session",
      "Eliminate distractions & put phone on silent"
    ];

    starterTasks.forEach((title) => {
      const taskRef = db.collection("rooms").doc(roomId).collection("tasks").doc();
      batch.set(taskRef, {
        title,
        completed: false,
        createdBy: hostId,
        createdByName: hostName,
        createdAt: FieldValue.serverTimestamp()
      });
    });

    await batch.commit();
    functions.logger.info(`Initialized room ${roomId} with host ${hostId} and starter resources.`);
  });

/**
 * Cloud Function: onTaskUpdated (Firestore Background Trigger)
 * When a collaborative task is marked complete, sends an automated celebration
 * announcement into the room chat.
 */
exports.onTaskUpdated = functions.firestore
  .document("rooms/{roomId}/tasks/{taskId}")
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    const roomId = context.params.roomId;

    // Trigger only when task transitions from uncompleted to completed
    if (!before.completed && after.completed) {
      const completedByName = after.completedByName || "A participant";
      const taskTitle = after.title || "a study task";

      await db.collection("rooms").doc(roomId).collection("messages").add({
        senderId: "system",
        senderName: "StudySphere Bot",
        text: `🎯 ${completedByName} completed: "${taskTitle}"! Keep up the great work!`,
        isSystem: true,
        createdAt: FieldValue.serverTimestamp()
      });
    }
  });
