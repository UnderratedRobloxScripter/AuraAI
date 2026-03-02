import { db } from "./firebase";
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  limit, 
  serverTimestamp 
} from "firebase/firestore";

// --- Sessions Management ---

/**
 * Fetch all sessions for a specific user
 */
export const getSessions = async (userId) => {
  try {
    const q = query(
      collection(db, "users", userId, "sessions"),
      orderBy("timestamp", "desc")
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (e) {
    console.error('Failed to load sessions', e);
    return [];
  }
};

/**
 * Create a new chat session in Firestore
 */
export const createSession = async (userId, firstMessage = null) => {
  const sessionRef = doc(collection(db, "users", userId, "sessions"));
  const sessionId = sessionRef.id;
  
  let title = 'New Chat';
  if (firstMessage) {
    title = firstMessage.content.substring(0, 30);
    if (firstMessage.content.length > 30) title += '...';
  }

  const newSession = {
    title,
    messages: firstMessage ? [firstMessage] : [],
    timestamp: serverTimestamp(),
  };

  await setDoc(sessionRef, newSession);
  return { id: sessionId, ...newSession };
};

/**
 * Update messages and handle auto-titling
 */
export const updateSessionMessages = async (userId, sessionId, messages) => {
  const sessionRef = doc(db, "users", userId, "sessions", sessionId);
  const updateData = {
    messages: messages,
    timestamp: serverTimestamp()
  };

  // Auto-title logic for first exchange
  if (messages.length > 0) {
    const sessionSnap = await getDoc(sessionRef);
    if (sessionSnap.exists() && sessionSnap.data().title === 'New Chat') {
      const firstUserMsg = messages.find(m => m.role === 'user');
      if (firstUserMsg) {
        let title = firstUserMsg.content.substring(0, 30);
        if (firstUserMsg.content.length > 30) title += '...';
        updateData.title = title;
      }
    }
  }

  await updateDoc(sessionRef, updateData);
};

export const renameSession = async (userId, sessionId, newTitle) => {
  const sessionRef = doc(db, "users", userId, "sessions", sessionId);
  await updateDoc(sessionRef, { title: newTitle });
};

export const deleteSession = async (userId, sessionId) => {
  const sessionRef = doc(db, "users", userId, "sessions", sessionId);
  await deleteDoc(sessionRef);
};

// --- Library (Prompts) Management ---

export const getLibraryItems = async (userId) => {
  try {
    const q = query(
      collection(db, "users", userId, "library"),
      orderBy("timestamp", "desc")
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (e) {
    return [];
  }
};

export const addLibraryItem = async (userId, title, content) => {
  const itemRef = doc(collection(db, "users", userId, "library"));
  const newItem = {
    title: title || 'Untitled Prompt',
    content: content,
    timestamp: serverTimestamp()
  };
  await setDoc(itemRef, newItem);
  return { id: itemRef.id, ...newItem };
};

export const deleteLibraryItem = async (userId, id) => {
  const itemRef = doc(db, "users", userId, "library", id);
  await deleteDoc(itemRef);
};

// --- Theme & Active Session (UI State) ---
// Note: Theme is usually better kept in localStorage for instant 
// loading before Firebase Auth initializes, but here is the DB version:

export const saveTheme = async (userId, theme) => {
  const userRef = doc(db, "users", userId);
  await updateDoc(userRef, { theme });
};

export const saveActiveSession = async (userId, sessionId) => {
  const userRef = doc(db, "users", userId);
  await updateDoc(userRef, { lastActiveSession: sessionId });
};
