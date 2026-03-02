import React from "react";
import Sidebar from "./Sidebar.jsx";
import InputBar from "./InputBar.jsx";
import CodeBlock from "./CodeBlock.jsx";
import { generateAIResponse, generateChatTitle } from "../utils/ai.js";
import MessageBubble from "./MessageBubble.jsx";
import {
    getSessions,
    getSession,
    createSession,
    updateSessionMessages,
    getActiveSessionId,
    setActiveSessionId,
    saveTheme,
    getTheme,
    addLibraryItem,
    getLibraryItems,
    deleteLibraryItem,
    renameSession,
    deleteSession,
    clearAllSessions
} from "../utils/storage.js";

function ChatInterface({ currentUser, onOpenAuth, onOpenPricing, onLogout }) {
    const [currentSessionId, setCurrentSessionId] = React.useState(null);
    const [messages, setMessages] = React.useState([]);
    const [sessions, setSessions] = React.useState([]);
    const [libraryItems, setLibraryItems] = React.useState([]);
    
    const [isTyping, setIsTyping] = React.useState(false);
    const [sidebarOpen, setSidebarOpen] = React.useState(false); 
    const [activePanel, setActivePanel] = React.useState(null); 
    const [showPremiumCard, setShowPremiumCard] = React.useState(true);
    const [editingSessionId, setEditingSessionId] = React.useState(null);
    const [editTitle, setEditTitle] = React.useState("");

    // Search State
    const [searchQuery, setSearchQuery] = React.useState('');
    
    // Library State
    const [showAddPrompt, setShowAddPrompt] = React.useState(false);
    const [newPromptTitle, setNewPromptTitle] = React.useState('');
    const [newPromptContent, setNewPromptContent] = React.useState('');

    // Theme State
    const [currentTheme, setCurrentTheme] = React.useState('onyx');

    const messagesEndRef = React.useRef(null);

    // Initial Load
    React.useEffect(() => {
        if (!currentUser?.uid) {
            setSessions([]);
            setLibraryItems([]);
            setCurrentSessionId(null);
            setMessages([]);
            return;
        }

        const init = async () => {
            await refreshSessions();
            await refreshLibrary();

            const lastActiveId = getActiveSessionId();
            if (lastActiveId) {
                await loadSession(lastActiveId);
            }

            const savedTheme = getTheme();
            applyTheme(savedTheme);
        };

        init();
    }, [currentUser?.uid]);

    // Save active session ID when it changes
    React.useEffect(() => {
        if (currentSessionId) {
            setActiveSessionId(currentSessionId);
        }
    }, [currentSessionId]);

    // Save messages to current session when they change
    React.useEffect(() => {
        const syncMessages = async () => {
            if (currentSessionId && currentUser?.uid && messages.length > 0) {
                const activeSession = sessions.find((session) => session.id === currentSessionId);
                let nextTitle;

                if (!activeSession || activeSession.title === 'New Chat') {
                    nextTitle = await generateChatTitle(messages);
                }

                await updateSessionMessages(currentUser.uid, currentSessionId, messages, nextTitle);
                await refreshSessions();
            }
            scrollToBottom();
        };

        syncMessages();
    }, [messages, currentSessionId, currentUser?.uid]);

    // Hide premium card if user is already Pro/Pro+
    React.useEffect(() => {
        if (currentUser && (currentUser.plan === 'pro' || currentUser.plan === 'pro_plus')) {
            setShowPremiumCard(false);
        } else {
            setShowPremiumCard(true);
        }
    }, [currentUser]);

    const applyTheme = (theme) => {
        setCurrentTheme(theme);
        saveTheme(theme);
        
        const root = document.documentElement;
        // Refined Colors: Deeper, more subtle, less "ugly" saturation
        switch(theme) {
            case 'midnight':
                // Deep Navy Blue
                root.style.setProperty('--bg-primary', '#020408'); 
                root.style.setProperty('--bg-secondary', '#0a0c14');
                break;
            case 'obsidian':
                // Deepest Plum/Charcoal
                root.style.setProperty('--bg-primary', '#050405'); 
                root.style.setProperty('--bg-secondary', '#0e0b0e'); 
                break;
            case 'forest':
                // Very Dark Racing Green
                root.style.setProperty('--bg-primary', '#010502'); 
                root.style.setProperty('--bg-secondary', '#050a06');
                break;
            case 'onyx':
            default:
                // Pure Black & Dark Gray
                root.style.setProperty('--bg-primary', '#000000');
                root.style.setProperty('--bg-secondary', '#121212');
                break;
        }
    };

    const refreshSessions = async () => {
        if (!currentUser?.uid) return;
        const data = await getSessions(currentUser.uid);
        setSessions(data);
    };

    const refreshLibrary = async () => {
        if (!currentUser?.uid) return;
        const data = await getLibraryItems(currentUser.uid);
        setLibraryItems(data);
    };

    const loadSession = async (sessionId) => {
        const session = await getSession(currentUser?.uid, sessionId);
        if (session) {
            setCurrentSessionId(sessionId);
            setMessages(session.messages || []);
            setSidebarOpen(false); // Close mobile sidebar if open
        } else {
            setCurrentSessionId(null);
            setMessages([]);
        }
    };

    const handleNewChat = async () => {
        if (!currentUser?.uid) {
            onOpenAuth();
            return;
        }

        const newSession = await createSession(currentUser.uid);
        setCurrentSessionId(newSession.id);
        setMessages([]);
        await refreshSessions();
        setSidebarOpen(false);
        setActivePanel(null); // Close sidebar panel for fresh start
    };

    const handleSendMessage = async (text, images, modelMode) => {
        if (!currentUser?.uid) {
            onOpenAuth();
            return;
        }

        let sessionId = currentSessionId;
        
        // If no session exists (fresh load), create one now
        if (!sessionId) {
            const newSession = await createSession(currentUser.uid);
            sessionId = newSession.id;
            setCurrentSessionId(sessionId);
        }

        const userMsg = {
            role: 'user',
            content: text,
            images: images,
            timestamp: new Date().toISOString()
        };
        
        const newMessages = [...messages, userMsg];
        setMessages(newMessages);
        setIsTyping(true);

        try {
            const responseText = await generateAIResponse(newMessages, modelMode);
            
            const aiMsg = {
                role: 'assistant',
                content: responseText,
                timestamp: new Date().toISOString()
            };
            
            setMessages(prev => [...prev, aiMsg]);
        } catch (error) {
            console.error(error);
            const errorMsg = {
                role: 'assistant',
                content: "I encountered an error processing your request.",
                timestamp: new Date().toISOString()
            };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setIsTyping(false);
        }
    };

    const handleEditMessage = async (index, newText) => {
        // 1. Slice history up to the edited message
        // We keep everything BEFORE the edited message
        const prevMessages = messages.slice(0, index);
        
        // 2. Create the new user message
        const oldMsg = messages[index];
        const newMsg = { ...oldMsg, content: newText, timestamp: new Date().toISOString() };
        
        // 3. Combine
        const newHistory = [...prevMessages, newMsg];
        setMessages(newHistory);
        setIsTyping(true);

        // 4. Regenerate from this point
        try {
             // Defaulting to Auto mode for regeneration, or we could track the original mode
            const responseText = await generateAIResponse(newHistory, 'Auto');
            
            const aiMsg = {
                role: 'assistant',
                content: responseText,
                timestamp: new Date().toISOString()
            };
            
            setMessages(prev => [...prev, aiMsg]);
        } catch (error) {
             console.error(error);
             const errorMsg = {
                role: 'assistant',
                content: "I encountered an error regenerating the response.",
                timestamp: new Date().toISOString()
            };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setIsTyping(false);
        }
    };

    const handleDeleteSession = async (e, sessionId) => {
        e.stopPropagation();
        if (confirm('Are you sure you want to delete this chat?')) {
            await deleteSession(currentUser?.uid, sessionId);
            await refreshSessions();
            if (currentSessionId === sessionId) {
                handleNewChat();
            }
        }
    };

    const startEditing = (e, session) => {
        e.stopPropagation();
        setEditingSessionId(session.id);
        setEditTitle(session.title);
    };

    const saveEditing = async (e) => {
        e.stopPropagation();
        if (editingSessionId) {
            await renameSession(currentUser?.uid, editingSessionId, editTitle);
            setEditingSessionId(null);
            await refreshSessions();
        }
    };

    const cancelEditing = (e) => {
        e.stopPropagation();
        setEditingSessionId(null);
    };

    // Library Functions
    const handleAddLibraryItem = async () => {
        if (!newPromptTitle.trim() || !newPromptContent.trim()) return;
        await addLibraryItem(currentUser?.uid, newPromptTitle, newPromptContent);
        setNewPromptTitle('');
        setNewPromptContent('');
        setShowAddPrompt(false);
        await refreshLibrary();
    };

    const handleDeleteLibraryItem = async (id) => {
         if (confirm('Remove this item from library?')) {
             await deleteLibraryItem(currentUser?.uid, id);
             await refreshLibrary();
         }
    };

    const useLibraryPrompt = (content) => {
        handleSendMessage(content, [], 'Auto');
        setActivePanel(null);
    };

    // Settings Functions
    const clearAllHistory = async () => {
        if (confirm('DANGER: This will permanently delete ALL chat history. Are you sure?')) {
            await clearAllSessions(currentUser?.uid);
            await refreshSessions();
            await handleNewChat();
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const isHome = messages.length === 0;

    // Filtered Sessions for Search
    const filteredSessions = searchQuery 
        ? sessions.filter(s => s.title.toLowerCase().includes(searchQuery.toLowerCase()))
        : sessions;

    return (
        <div className="flex h-screen w-full bg-[var(--bg-primary)] text-white overflow-hidden font-['Inter'] transition-colors duration-500">
            
            {/* Mobile Sidebar Overlay */}
            {sidebarOpen && (
                <div 
                    className="fixed inset-0 bg-black/80 z-40 md:hidden"
                    onClick={() => setSidebarOpen(false)}
                ></div>
            )}

            {/* Desktop Sidebar (Expandable) */}
            <Sidebar 
                isOpen={true} 
                onNewChat={handleNewChat}
                activePanel={activePanel}
                setActivePanel={setActivePanel}
                currentUser={currentUser}
                onOpenAuth={onOpenAuth}
                onOpenPricing={onOpenPricing}
                onLogout={onLogout}
            />
            
            {/* Side Panel (Library/History/Search/Settings) */}
            {activePanel && (
                <div className="hidden md:flex flex-col w-80 border-r border-white/5 bg-[var(--bg-secondary)] animate-fade-in-up transition-all h-full z-20 shadow-2xl">
                    <div className="p-4 border-b border-white/5 flex justify-between items-center">
                        <h2 className="font-semibold text-lg capitalize">{activePanel === 'library' ? 'Library' : activePanel}</h2>
                        <button onClick={() => setActivePanel(null)} className="text-gray-500 hover:text-white">
                            <div className="icon-x text-lg"></div>
                        </button>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto thin-scrollbar">
                        
                        {/* --- SEARCH PANEL --- */}
                        {activePanel === 'search' && (
                            <div className="p-4 space-y-4">
                                <div className="relative">
                                    <div className="icon-search absolute left-3 top-2.5 text-gray-500 text-sm"></div>
                                    <input 
                                        type="text" 
                                        placeholder="Search chats..." 
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full bg-[var(--bg-primary)] border border-white/10 rounded-lg py-2 pl-9 pr-3 text-sm text-white focus:border-white/30 focus:outline-none"
                                        autoFocus
                                    />
                                </div>
                                
                                <div className="space-y-1">
                                    {filteredSessions.length === 0 ? (
                                        <div className="text-center text-gray-500 text-sm py-8">No results found.</div>
                                    ) : (
                                        filteredSessions.map(session => (
                                            <div 
                                                key={session.id}
                                                onClick={() => loadSession(session.id)}
                                                className="p-3 rounded-lg hover:bg-white/5 cursor-pointer"
                                            >
                                                <div className="text-sm font-medium text-white truncate">{session.title}</div>
                                                <div className="text-xs text-gray-500 mt-1">{new Date(session.timestamp).toLocaleDateString()}</div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}

                        {/* --- LIBRARY PANEL --- */}
                        {activePanel === 'library' && (
                            <div className="p-4 space-y-4">
                                {!showAddPrompt ? (
                                    <button 
                                        onClick={() => setShowAddPrompt(true)}
                                        className="w-full py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                                    >
                                        <div className="icon-plus text-sm"></div> Add Prompt
                                    </button>
                                ) : (
                                    <div className="bg-[var(--bg-primary)] border border-white/10 rounded-lg p-3 space-y-2 animate-fade-in-up">
                                        <input 
                                            className="w-full bg-transparent border-b border-white/10 pb-1 text-sm focus:outline-none"
                                            placeholder="Title"
                                            value={newPromptTitle}
                                            onChange={(e) => setNewPromptTitle(e.target.value)}
                                        />
                                        <textarea 
                                            className="w-full bg-transparent text-sm text-gray-300 focus:outline-none resize-none h-20"
                                            placeholder="Prompt content..."
                                            value={newPromptContent}
                                            onChange={(e) => setNewPromptContent(e.target.value)}
                                        ></textarea>
                                        <div className="flex gap-2 justify-end">
                                            <button onClick={() => setShowAddPrompt(false)} className="text-xs text-gray-500 hover:text-white">Cancel</button>
                                            <button onClick={handleAddLibraryItem} className="text-xs bg-white text-black px-3 py-1 rounded font-bold">Save</button>
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    {libraryItems.length === 0 && !showAddPrompt && (
                                        <div className="text-center text-gray-500 text-sm py-8">
                                            <div className="icon-book-open mx-auto text-2xl mb-2 opacity-50"></div>
                                            Save your favorite prompts here.
                                        </div>
                                    )}
                                    {libraryItems.map(item => (
                                        <div key={item.id} className="group relative bg-[var(--bg-primary)] border border-white/5 rounded-lg p-3 hover:border-white/20 transition-all">
                                            <h3 className="text-sm font-bold text-gray-200 mb-1">{item.title}</h3>
                                            <p className="text-xs text-gray-500 line-clamp-3 mb-2">{item.content}</p>
                                            <div className="flex items-center gap-2 mt-2">
                                                <button 
                                                    onClick={() => useLibraryPrompt(item.content)}
                                                    className="text-xs bg-white/10 hover:bg-white/20 px-2 py-1 rounded text-white flex items-center gap-1"
                                                >
                                                    <div className="icon-play text-[10px]"></div> Use
                                                </button>
                                                <button 
                                                    onClick={() => handleDeleteLibraryItem(item.id)}
                                                    className="absolute top-2 right-2 p-1 text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <div className="icon-trash text-xs"></div>
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* --- HISTORY PANEL --- */}
                        {activePanel === 'history' && (
                            <div className="p-4 space-y-2">
                                {sessions.length === 0 && (
                                    <div className="text-gray-500 text-sm text-center py-4">No chat history yet.</div>
                                )}
                                
                                {sessions.map(session => (
                                    <div 
                                        key={session.id}
                                        onClick={() => loadSession(session.id)}
                                        className={`
                                            group p-3 rounded-lg cursor-pointer transition-colors border border-transparent
                                            ${currentSessionId === session.id ? 'bg-white/10 border-white/5' : 'hover:bg-white/5'}
                                        `}
                                    >
                                        {editingSessionId === session.id ? (
                                            <div className="flex items-center gap-2">
                                                <input 
                                                    type="text" 
                                                    value={editTitle}
                                                    onChange={(e) => setEditTitle(e.target.value)}
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="bg-black border border-white/20 rounded px-2 py-1 text-sm w-full focus:outline-none focus:border-white/50"
                                                    autoFocus
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') saveEditing(e);
                                                        if (e.key === 'Escape') cancelEditing(e);
                                                    }}
                                                />
                                                <button onClick={saveEditing} className="text-green-500 hover:text-green-400"><div className="icon-check text-sm"></div></button>
                                                <button onClick={cancelEditing} className="text-red-500 hover:text-red-400"><div className="icon-x text-sm"></div></button>
                                            </div>
                                        ) : (
                                            <div className="flex justify-between items-start gap-2">
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-white text-sm font-medium truncate">{session.title}</div>
                                                    <div className="text-xs text-gray-500 mt-1">
                                                        {new Date(session.timestamp).toLocaleDateString()}
                                                    </div>
                                                </div>
                                                
                                                {/* Actions (Rename/Delete) */}
                                                <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button 
                                                        onClick={(e) => startEditing(e, session)}
                                                        className="p-1.5 text-gray-500 hover:text-white rounded hover:bg-white/10"
                                                        title="Rename"
                                                    >
                                                        <div className="icon-pencil text-xs"></div>
                                                    </button>
                                                    <button 
                                                        onClick={(e) => handleDeleteSession(e, session.id)}
                                                        className="p-1.5 text-gray-500 hover:text-red-400 rounded hover:bg-white/10"
                                                        title="Delete"
                                                    >
                                                        <div className="icon-trash text-xs"></div>
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* --- SETTINGS PANEL --- */}
                        {activePanel === 'settings' && (
                            <div className="p-4 space-y-6">
                                <div>
                                    <h3 className="text-xs font-bold text-gray-500 uppercase mb-3">General</h3>
                                    <div className="space-y-3">
                                        {/* Theme Selector */}
                                        <div>
                                            <span className="text-sm text-gray-300 block mb-2">Theme</span>
                                            <div className="grid grid-cols-2 gap-2">
                                                {[
                                                    { id: 'onyx', label: 'Onyx', color: '#000000' },
                                                    { id: 'midnight', label: 'Midnight', color: '#020408' },
                                                    { id: 'obsidian', label: 'Obsidian', color: '#050405' },
                                                    { id: 'forest', label: 'Forest', color: '#010502' }
                                                ].map(theme => (
                                                    <button
                                                        key={theme.id}
                                                        onClick={() => applyTheme(theme.id)}
                                                        className={`
                                                            flex items-center gap-2 p-2 rounded-lg border transition-all text-xs font-medium
                                                            ${currentTheme === theme.id 
                                                                ? 'border-white bg-white/10 text-white' 
                                                                : 'border-white/5 bg-[var(--bg-primary)] text-gray-500 hover:border-white/20 hover:text-gray-300'}
                                                        `}
                                                    >
                                                        <div className="w-3 h-3 rounded-full border border-white/20" style={{ backgroundColor: theme.color }}></div>
                                                        {theme.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between p-2 hover:bg-white/5 rounded-lg cursor-not-allowed opacity-70">
                                            <span className="text-sm text-gray-300">Stream Responses</span>
                                            <div className="w-8 h-4 bg-green-500/20 rounded-full relative"><div className="absolute right-0 top-0 w-4 h-4 bg-green-500 rounded-full"></div></div>
                                        </div>

                                        {/* Groq API Key Input (Removed - using internal key) */}
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-xs font-bold text-gray-500 uppercase mb-3">Account</h3>
                                    {currentUser ? (
                                        <div className="p-3 bg-[var(--bg-primary)] rounded-lg border border-white/5 mb-3">
                                            <div className="flex items-center gap-3 mb-2">
                                                <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center font-bold text-xs text-white">
                                                    {currentUser.name.substring(0,2).toUpperCase()}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-white">{currentUser.name}</span>
                                                    <span className="text-xs text-gray-500">{currentUser.email}</span>
                                                </div>
                                            </div>
                                            <div className="flex justify-between items-center mt-3 pt-3 border-t border-white/5">
                                                <span className="text-xs text-gray-400">Current Plan: <span className="text-white font-bold capitalize">{currentUser.plan.replace('_', ' ')}</span></span>
                                                <button onClick={onOpenPricing} className="text-xs text-blue-400 hover:text-blue-300">Change</button>
                                            </div>
                                        </div>
                                    ) : (
                                        <button 
                                            onClick={onOpenAuth}
                                            className="w-full text-left p-2 hover:bg-white/10 text-gray-300 rounded-lg text-sm transition-colors flex items-center gap-2 mb-3"
                                        >
                                            <div className="icon-user text-sm"></div> Sign In / Sign Up
                                        </button>
                                    )}

                                    <h3 className="text-xs font-bold text-gray-500 uppercase mb-3 mt-6">Data</h3>
                                    <button 
                                        onClick={clearAllHistory}
                                        className="w-full text-left p-2 hover:bg-red-500/10 text-red-400 hover:text-red-300 rounded-lg text-sm transition-colors flex items-center gap-2"
                                    >
                                        <div className="icon-trash text-sm"></div> Clear All History
                                    </button>
                                </div>

                                <div>
                                    <h3 className="text-xs font-bold text-gray-500 uppercase mb-3">About</h3>
                                    <div className="p-3 bg-[var(--bg-primary)] rounded-lg border border-white/5">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="icon-orbit text-white"></div>
                                            <span className="font-bold">Aura v1.5</span>
                                        </div>
                                        <p className="text-xs text-gray-500">
                                            A minimalist AI interface designed for speed and clarity.
                                            Inspired by Grok.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Mobile Sidebar (Drawer) */}
            <div className={`fixed inset-y-0 left-0 w-64 bg-[var(--bg-primary)] z-50 transform transition-transform duration-300 md:hidden ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                 <div className="p-4 border-b border-white/10 flex justify-between items-center">
                    <span className="font-bold">Aura</span>
                    <button onClick={() => setSidebarOpen(false)}><div className="icon-x"></div></button>
                 </div>
                 <div className="p-4 space-y-4">
                    <button onClick={handleNewChat} className="flex items-center gap-3 text-white w-full p-2 hover:bg-white/10 rounded-lg">
                        <div className="icon-square-pen"></div> New Chat
                    </button>

                    {/* Mobile Auth Button */}
                    <button 
                        onClick={() => {
                            if (currentUser) onOpenPricing();
                            else onOpenAuth();
                        }}
                        className="flex items-center gap-3 text-white w-full p-2 hover:bg-white/10 rounded-lg"
                    >
                        <div className="icon-user"></div> {currentUser ? 'Manage Account' : 'Sign In'}
                    </button>
                    
                    <div className="border-t border-white/10 pt-4">
                        <div className="text-xs font-bold text-gray-500 uppercase mb-2">Recent History</div>
                        <div className="space-y-1">
                             {sessions.slice(0, 5).map(session => (
                                <button 
                                    key={session.id}
                                    onClick={() => loadSession(session.id)}
                                    className="block w-full text-left text-sm text-gray-300 p-2 hover:bg-white/5 rounded truncate"
                                >
                                    {session.title}
                                </button>
                             ))}
                        </div>
                    </div>
                 </div>
            </div>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col relative h-full w-full min-w-0">
                
                {/* Mobile Header */}
                <header className="md:hidden absolute top-0 left-0 right-0 h-16 flex items-center justify-between px-4 z-20 bg-black/50 backdrop-blur-md">
                    <button onClick={() => setSidebarOpen(true)} className="p-2 text-gray-400">
                        <div className="icon-menu text-xl"></div>
                    </button>
                    <span className="font-bold">Aura</span>
                    <div className="w-8"></div>
                </header>

                {/* Content Container */}
                <div className="flex-1 overflow-y-auto thin-scrollbar relative flex flex-col">
                    
                    {isHome ? (
                        /* HOME STATE - ALIGNMENT FIXED */
                        <div className="flex-1 flex flex-col items-center justify-center p-4 w-full h-full min-h-[calc(100vh-64px)] max-w-3xl mx-auto animate-fade-in-up">
                            
                            {/* Big Logo */}
                            <div className="mb-10 flex flex-col items-center select-none">
                                <span className="text-5xl md:text-6xl font-bold tracking-tight text-white mb-6">Aura</span>
                            </div>

                            {/* Input Bar - Centered */}
                            <div className="w-full mb-8 z-30">
                                <InputBar onSendMessage={handleSendMessage} isTyping={isTyping} compact={false} />
                            </div>

                            {/* Connect Saturn Banner (Only if guest) */}
                            {!currentUser && (
                                <div 
                                    onClick={onOpenAuth}
                                    className="flex items-center gap-4 bg-[var(--bg-secondary)] border border-white/10 rounded-full px-5 py-3 hover:bg-[#1a1a1a] transition-colors cursor-pointer group"
                                >
                                    <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center border border-white/10">
                                        <div className="icon-orbit text-white text-lg"></div>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-semibold text-white group-hover:underline decoration-1 underline-offset-2">Connect your Aura account</span>
                                        <span className="text-xs text-gray-500">Unlock early features and personalized content.</span>
                                    </div>
                                    <button className="ml-4 px-4 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-sm font-medium transition-colors">
                                        Connect
                                    </button>
                                </div>
                            )}

                        </div>
                    ) : (
                        /* CHAT STATE */
                        <div className="flex flex-col min-h-full">
                            {/* Messages */}
                            <div className="flex-1 w-full max-w-3xl mx-auto px-4 pt-20 pb-4">
                                {messages.map((msg, idx) => (
                                    <MessageBubble 
                                        key={idx} 
                                        index={idx} 
                                        message={msg} 
                                        onEdit={handleEditMessage} 
                                    />
                                ))}
                                
                                {isTyping && (
                                    <div className="flex items-center space-x-1 ml-4 mb-8 text-gray-500">
                                        <div className="w-2 h-2 bg-white rounded-full typing-dot"></div>
                                        <div className="w-2 h-2 bg-white rounded-full typing-dot"></div>
                                        <div className="w-2 h-2 bg-white rounded-full typing-dot"></div>
                                    </div>
                                )}
                                <div ref={messagesEndRef}></div>
                            </div>
                            
                            {/* Sticky Bottom Input */}
                            <div className="sticky bottom-0 w-full bg-gradient-to-t from-[var(--bg-primary)] via-[var(--bg-primary)] to-transparent pt-10 pb-6 px-4 z-20 transition-colors duration-500">
                                <div className="max-w-3xl mx-auto">
                                    <InputBar onSendMessage={handleSendMessage} isTyping={isTyping} compact={true} />
                                    <div className="text-center mt-3 text-xs text-[#555] font-medium tracking-wide pb-2">
                                        Aura can make mistakes.
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Bottom Right Floating "Aura Premium" Card */}
                {showPremiumCard && (
                    <div 
                        onClick={onOpenPricing}
                        className="fixed bottom-6 right-6 hidden lg:flex items-center gap-3 bg-[#111] border border-white/10 p-2 pr-4 rounded-full shadow-2xl cursor-pointer hover:border-white/20 transition-all z-30 group"
                    >
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-900 to-black flex items-center justify-center">
                            <div className="icon-sparkles text-white text-lg"></div>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-bold text-white">Aura Premium</span>
                            <span className="text-[10px] text-gray-400">Unlock extended capabilities</span>
                        </div>
                        <button className="ml-2 px-3 py-1 bg-white text-black text-xs font-bold rounded-full">Upgrade</button>
                        
                        {/* Close Button on Hover */}
                        <button 
                            onClick={(e) => { e.stopPropagation(); setShowPremiumCard(false); }}
                            className="absolute -top-2 -right-2 bg-black border border-white/20 rounded-full p-0.5 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <div className="icon-x text-xs"></div>
                        </button>
                    </div>
                )}

            </main>
        </div>
    );
}


export default ChatInterface;
