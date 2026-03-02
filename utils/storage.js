const STORAGE_KEY = 'grok_chat_sessions_v2';
const CURRENT_SESSION_KEY = 'grok_active_session_id';
const LIBRARY_KEY = 'grok_library_prompts';
const THEME_KEY = 'grok_ui_theme';

// Helper to generate UUID
const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2);

// --- Sessions Management ---

const getSessions = () => {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    } catch (e) {
        console.error('Failed to load sessions', e);
        return [];
    }
};

const saveSessions = (sessions) => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
    } catch (e) {
        console.error('Failed to save sessions', e);
    }
};

const createSession = (firstMessage = null) => {
    const sessions = getSessions();
    const newSession = {
        id: generateId(),
        title: 'New Chat',
        messages: firstMessage ? [firstMessage] : [],
        timestamp: new Date().toISOString()
    };
    sessions.unshift(newSession);
    saveSessions(sessions);
    return newSession;
};

const updateSessionMessages = (sessionId, messages) => {
    const sessions = getSessions();
    const sessionIndex = sessions.findIndex(s => s.id === sessionId);
    
    if (sessionIndex > -1) {
        sessions[sessionIndex].messages = messages;
        sessions[sessionIndex].timestamp = new Date().toISOString();
        
        if (sessions[sessionIndex].title === 'New Chat' && messages.length > 0) {
            const firstUserMsg = messages.find(m => m.role === 'user');
            if (firstUserMsg) {
                let title = firstUserMsg.content.substring(0, 30);
                if (firstUserMsg.content.length > 30) title += '...';
                sessions[sessionIndex].title = title;
            }
        }
        saveSessions(sessions);
    }
};

const renameSession = (sessionId, newTitle) => {
    const sessions = getSessions();
    const session = sessions.find(s => s.id === sessionId);
    if (session) {
        session.title = newTitle;
        saveSessions(sessions);
        return true;
    }
    return false;
};

const deleteSession = (sessionId) => {
    const sessions = getSessions();
    const newSessions = sessions.filter(s => s.id !== sessionId);
    saveSessions(newSessions);
    return newSessions;
};

const getSession = (sessionId) => {
    const sessions = getSessions();
    return sessions.find(s => s.id === sessionId);
};

const getActiveSessionId = () => {
    return localStorage.getItem(CURRENT_SESSION_KEY);
};

const setActiveSessionId = (id) => {
    if (id) {
        localStorage.setItem(CURRENT_SESSION_KEY, id);
    } else {
        localStorage.removeItem(CURRENT_SESSION_KEY);
    }
};

// --- Library (Prompts) Management ---

const getLibraryItems = () => {
    try {
        const data = localStorage.getItem(LIBRARY_KEY);
        return data ? JSON.parse(data) : [];
    } catch (e) {
        return [];
    }
};

const saveLibraryItems = (items) => {
    try {
        localStorage.setItem(LIBRARY_KEY, JSON.stringify(items));
    } catch (e) {
        console.error('Failed to save library', e);
    }
};

const addLibraryItem = (title, content) => {
    const items = getLibraryItems();
    const newItem = {
        id: generateId(),
        title: title || 'Untitled Prompt',
        content: content,
        timestamp: new Date().toISOString()
    };
    items.unshift(newItem);
    saveLibraryItems(items);
    return newItem;
};

const deleteLibraryItem = (id) => {
    const items = getLibraryItems();
    const newItems = items.filter(i => i.id !== id);
    saveLibraryItems(newItems);
    return newItems;
};

// --- Theme Management ---

const getTheme = () => {
    return localStorage.getItem(THEME_KEY) || 'onyx';
};

const saveTheme = (theme) => {
    localStorage.setItem(THEME_KEY, theme);
};