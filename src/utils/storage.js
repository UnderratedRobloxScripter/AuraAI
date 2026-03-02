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
  serverTimestamp
} from "firebase/firestore";

const ACTIVE_SESSION_KEY = "aura_active_session";
const THEME_KEY = "aura_theme";

export const getSessions = async (userId) => {
  if (!userId) return [];
  try {
    const q = query(collection(db, "users", userId, "sessions"), orderBy("timestamp", "desc"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((snapshot) => ({ id: snapshot.id, ...snapshot.data() }));
  } catch (error) {
    console.error("Failed to load sessions", error);
    return [];
  }
};

export const getSession = async (userId, sessionId) => {
  if (!userId || !sessionId) return null;
  try {
    const sessionRef = doc(db, "users", userId, "sessions", sessionId);
    const snap = await getDoc(sessionRef);
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() };
  } catch (error) {
    console.error("Failed to load session", error);
    return null;
  }
};

export const createSession = async (userId) => {
  if (!userId) return null;
  const sessionRef = doc(collection(db, "users", userId, "sessions"));
  const newSession = {
    title: "New Chat",
    messages: [],
    timestamp: serverTimestamp()
  };
  await setDoc(sessionRef, newSession);
  return { id: sessionRef.id, ...newSession };
};

export const updateSessionMessages = async (userId, sessionId, messages, title) => {
  if (!userId || !sessionId) return;
  const sessionRef = doc(db, "users", userId, "sessions", sessionId);
  const payload = {
    messages,
    timestamp: serverTimestamp()
  };

  if (title && title.trim()) {
    payload.title = title.trim();
  }

  await updateDoc(sessionRef, payload);
};

export const renameSession = async (userId, sessionId, newTitle) => {
  if (!userId || !sessionId) return;
  const sessionRef = doc(db, "users", userId, "sessions", sessionId);
  await updateDoc(sessionRef, { title: newTitle });
};

export const deleteSession = async (userId, sessionId) => {
  if (!userId || !sessionId) return;
  const sessionRef = doc(db, "users", userId, "sessions", sessionId);
  await deleteDoc(sessionRef);
};

export const clearAllSessions = async (userId) => {
  if (!userId) return;
  const sessions = await getSessions(userId);
  await Promise.all(sessions.map((session) => deleteSession(userId, session.id)));
};

export const getLibraryItems = async (userId) => {
  if (!userId) return [];
  try {
    const q = query(collection(db, "users", userId, "library"), orderBy("timestamp", "desc"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((snapshot) => ({ id: snapshot.id, ...snapshot.data() }));
  } catch (error) {
    console.error("Failed to load prompt library", error);
    return [];
  }
};

export const addLibraryItem = async (userId, title, content) => {
  if (!userId) return null;
  const itemRef = doc(collection(db, "users", userId, "library"));
  const newItem = {
    title: title || "Untitled Prompt",
    content,
    timestamp: serverTimestamp()
  };
  await setDoc(itemRef, newItem);
  return { id: itemRef.id, ...newItem };
};

export const deleteLibraryItem = async (userId, id) => {
  if (!userId || !id) return;
  const itemRef = doc(db, "users", userId, "library", id);
  await deleteDoc(itemRef);
};

export const saveTheme = (theme) => {
  localStorage.setItem(THEME_KEY, theme);
};

export const getTheme = () => localStorage.getItem(THEME_KEY) || "onyx";

export const setActiveSessionId = (sessionId) => {
  if (!sessionId) return;
  localStorage.setItem(ACTIVE_SESSION_KEY, sessionId);
};

export const getActiveSessionId = () => localStorage.getItem(ACTIVE_SESSION_KEY);
