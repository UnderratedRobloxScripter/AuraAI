import React from "react";
import Sidebar from "./Sidebar.jsx";
import InputBar from "./InputBar.jsx";
import CodeBlock from "./CodeBlock.jsx";
import { generateAIResponse } from "../utils/ai.js";
import MessageBubble from "./MessageBubble.jsx"; 
// Firebase Firestore imports
import { 
    collection, 
    addDoc, 
    updateDoc, 
    doc, 
    deleteDoc, 
    query, 
    where, 
    orderBy, 
    onSnapshot, 
    serverTimestamp,
    writeBatch
} from "firebase/firestore";
import { db } from "../utils/firebase.js";

function ChatInterface({ currentUser, onOpenAuth, onOpenPricing, onLogout }) {
    // --- State Management ---
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

    const [searchQuery, setSearchQuery] = React.useState('');
    const [showAddPrompt, setShowAddPrompt] = React.useState(false);
    const [newPromptTitle, setNewPromptTitle] = React.useState('');
    const [newPromptContent, setNewPromptContent] = React.useState('');

    const [currentTheme, setCurrentTheme] = React.useState(localStorage.getItem('theme') || 'onyx');
    const messagesEndRef = React.useRef(null);

    // --- Firebase Real-time Sync ---
    React.useEffect(() => {
        if (!currentUser) {
            setSessions([]);
            setLibraryItems([]);
            return;
        }

        const qChats = query(
            collection(db, "chats"),
            where("userId", "==", currentUser.uid),
            orderBy("timestamp", "desc")
        );

        const unsubChats = onSnapshot(qChats, (snapshot) => {
            const sessionsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setSessions(sessionsData);
        });

        const qLib = query(
            collection(db, "library"),
            where("userId", "==", currentUser.uid),
            orderBy("timestamp", "desc")
        );

        const unsubLib = onSnapshot(qLib, (snapshot) => {
            const libData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setLibraryItems(libData);
        });

        return () => {
            unsubChats();
            unsubLib();
        };
    }, [currentUser]);

    // --- Theme & Persistence Logic ---
    React.useEffect(() => {
        applyTheme(currentTheme);
    }, []);

    React.useEffect(() => {
        if (currentUser && (currentUser.plan === 'pro' || currentUser.plan === 'pro_plus')) {
            setShowPremiumCard(false);
        } else {
            setShowPremiumCard(true);
        }
    }, [currentUser]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    React.useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    const applyTheme = (theme) => {
        setCurrentTheme(theme);
        localStorage.setItem('theme', theme);
        const root = document.documentElement;
        switch(theme) {
            case 'midnight':
                root.style.setProperty('--bg-primary', '#020408'); 
                root.style.setProperty('--bg-secondary', '#0a0c14');
                break;
            case 'obsidian':
                root.style.setProperty('--bg-primary', '#050405'); 
                root.style.setProperty('--bg-secondary', '#0e0b0e'); 
                break;
            case 'forest':
                root.style.setProperty('--bg-primary', '#010502'); 
                root.style.setProperty('--bg-secondary', '#050a06');
                break;
            case 'onyx':
            default:
                root.style.setProperty('--bg-primary', '#000000');
                root.style.setProperty('--bg-secondary', '#121212');
                break;
        }
    };

    // --- Chat Logic ---
    const handleNewChat = () => {
        setCurrentSessionId(null);
        setMessages([]);
        setSidebarOpen(false);
        setActivePanel(null);
    };

    const loadSession = (session) => {
        setCurrentSessionId(session.id);
        setMessages(session.messages || []);
        setSidebarOpen(false);
    };

    const handleSendMessage = async (text, images, modelMode) => {
        if (!currentUser) return onOpenAuth();

        let sessionId = currentSessionId;
        const userMsg = {
            role: 'user',
            content: text,
            images: images || [],
            timestamp: new Date().toISOString()
        };
        
        const newMessages = [...messages, userMsg];
        setMessages(newMessages);
        setIsTyping(true);

        try {
            if (!sessionId) {
                const docRef = await addDoc(collection(db, "chats"), {
                    userId: currentUser.uid,
                    title: text.substring(0, 40) || "New Chat",
                    messages: newMessages,
                    timestamp: serverTimestamp()
                });
                sessionId = docRef.id;
                setCurrentSessionId(sessionId);
            } else {
                await updateDoc(doc(db, "chats", sessionId), {
                    messages: newMessages,
                    timestamp: serverTimestamp()
                });
            }

            const responseText = await generateAIResponse(newMessages, modelMode);
            
            const aiMsg = {
                role: 'assistant',
                content: responseText,
                timestamp: new Date().toISOString()
            };
            
            const finalMessages = [...newMessages, aiMsg];
            setMessages(finalMessages);

            await updateDoc(doc(db, "chats", sessionId), {
                messages: finalMessages
            });

        } catch (error) {
            console.error("Chat Error:", error);
            const errorMsg = { role: 'assistant', content: "Sorry, I encountered an error. Please try again.", timestamp: new Date().toISOString() };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setIsTyping(false);
        }
    };

    const handleEditMessage = async (index, newText) => {
        if (!currentSessionId) return;
        
        const prevMessages = messages.slice(0, index);
        const editedMsg = { ...messages[index], content: newText, timestamp: new Date().toISOString() };
        const newHistory = [...prevMessages, editedMsg];
        
        setMessages(newHistory);
        setIsTyping(true);

        try {
            const responseText = await generateAIResponse(newHistory, 'Auto');
            const aiMsg = { role: 'assistant', content: responseText, timestamp: new Date().toISOString() };
            const finalHistory = [...newHistory, aiMsg];
            
            setMessages(finalHistory);
            await updateDoc(doc(db, "chats", currentSessionId), {
                messages: finalHistory,
                timestamp: serverTimestamp()
            });
        } catch (error) {
            console.error(error);
        } finally {
            setIsTyping(false);
        }
    };

    const handleDeleteSession = async (e, sessionId) => {
        e.stopPropagation();
        if (window.confirm('Are you sure you want to delete this chat?')) {
            try {
                await deleteDoc(doc(db, "chats", sessionId));
                if (currentSessionId === sessionId) {
                    handleNewChat();
                }
            } catch (err) {
                console.error("Failed to delete session", err);
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
            await updateDoc(doc(db, "chats", editingSessionId), { title: editTitle });
            setEditingSessionId(null);
        }
    };

    const clearAllHistory = async () => {
        if (window.confirm('DANGER: This will permanently delete ALL chat history. This cannot be undone.')) {
            const batch = writeBatch(db);
            sessions.forEach((session) => {
                batch.delete(doc(db, "chats", session.id));
            });
            await batch.commit();
            handleNewChat();
        }
    };

    // --- Library Logic ---
    const handleAddLibraryItem = async () => {
        if (!newPromptTitle.trim() || !newPromptContent.trim()) return;
        try {
            await addDoc(collection(db, "library"), {
                userId: currentUser.uid,
                title: newPromptTitle,
                content: newPromptContent,
                timestamp: serverTimestamp()
            });
            setNewPromptTitle('');
            setNewPromptContent('');
            setShowAddPrompt(false);
        } catch (err) {
            console.error("Library Error:", err);
        }
    };

    const handleDeleteLibraryItem = async (id) => {
         if (window.confirm('Remove this item from your library?')) {
             await deleteDoc(doc(db, "library", id));
         }
    };

    const useLibraryPrompt = (content) => {
        handleSendMessage(content, [], 'Auto');
        setActivePanel(null);
    };

    // --- Filter logic ---
    const isHome = messages.length === 0;
    const filteredSessions = searchQuery 
        ? sessions.filter(s => s.title.toLowerCase().includes(searchQuery.toLowerCase()))
        : sessions;

    return (
        <div className="flex h-screen w-full bg-[var(--bg-primary)] text-white overflow-hidden font-['Inter'] transition-colors duration-500">
            {/* Mobile Sidebar Overlay */}
            {sidebarOpen && (
                <div 
                    className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 md:hidden animate-fade-in"
                    onClick={() => setSidebarOpen(false)}
                ></div>
            )}

            {/* Sidebar Component */}
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
            
            {/* Dynamic Panels */}
            {activePanel && (
                <div className="hidden md:flex flex-col w-80 border-r border-white/5 bg-[var(--bg-secondary)] animate-fade-in-up transition-all h-full z-20 shadow-2xl">
                    <div className="p-4 border-b border-white/5 flex justify-between items-center">
                        <h2 className="font-semibold text-lg capitalize">{activePanel === 'library' ? 'Library' : activePanel}</h2>
                        <button 
                            onClick={() => setActivePanel(null)}
                            className="text-gray-500 hover:text-white transition-colors"
                        >
                            <div className="icon-x text-lg"></div>
                        </button>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto thin-scrollbar">
                        {/* Search Panel */}
                        {activePanel === 'search' && (
                            <div className="p-4 space-y-4">
                                <div className="relative">
                                    <div className="icon-search absolute left-3 top-2.5 text-gray-500 text-sm"></div>
                                    <input 
                                        type="text" 
                                        placeholder="Search chats..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full bg-[var(--bg-primary)] border border-white/10 rounded-lg py-2 pl-9 pr-3 text-sm text-white focus:outline-none focus:border-white/30 transition-all"
                                    />
                                </div>
                                <div className="space-y-1">
                                    {filteredSessions.map(session => (
                                        <div 
                                            key={session.id}
                                            onClick={() => loadSession(session)}
                                            className="p-3 rounded-lg hover:bg-white/5 cursor-pointer transition-colors group"
                                        >
                                            <div className="text-sm font-medium text-white truncate">{session.title}</div>
                                            <div className="text-[10px] text-gray-500 mt-1">
                                                {session.timestamp?.seconds ? new Date(session.timestamp.seconds * 1000).toLocaleDateString() : 'Just now'}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Library Panel */}
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
                                    <div className="bg-[var(--bg-primary)] border border-white/10 rounded-lg p-3 space-y-2 animate-fade-in">
                                        <input 
                                            className="w-full bg-transparent border-b border-white/10 pb-1 text-sm focus:outline-none focus:border-white/30"
                                            placeholder="Prompt Title"
                                            value={newPromptTitle}
                                            onChange={(e) => setNewPromptTitle(e.target.value)}
                                        />
                                        <textarea 
                                            className="w-full bg-transparent text-sm text-gray-300 focus:outline-none resize-none h-20 thin-scrollbar"
                                            placeholder="Write your prompt here..."
                                            value={newPromptContent}
                                            onChange={(e) => setNewPromptContent(e.target.value)}
                                        ></textarea>
                                        <div className="flex gap-2 justify-end">
                                            <button onClick={() => setShowAddPrompt(false)} className="text-xs text-gray-500 hover:text-white">Cancel</button>
                                            <button onClick={handleAddLibraryItem} className="text-xs bg-white text-black px-3 py-1 rounded font-bold hover:bg-gray-200">Save</button>
                                        </div>
                                    </div>
                                )}
                                
                                <div className="space-y-2">
                                    {libraryItems.map(item => (
                                        <div key={item.id} className="group relative bg-[var(--bg-primary)] border border-white/5 rounded-lg p-3 hover:border-white/20 transition-all">
                                            <h3 className="text-sm font-bold text-gray-200 mb-1">{item.title}</h3>
                                            <p className="text-xs text-gray-500 line-clamp-3 mb-2">{item.content}</p>
                                            <button 
                                                onClick={() => useLibraryPrompt(item.content)}
                                                className="text-xs bg-white/10 hover:bg-white/20 px-2 py-1 rounded text-white transition-colors"
                                            >Use</button>
                                            <button 
                                                onClick={() => handleDeleteLibraryItem(item.id)}
                                                className="absolute top-2 right-2 p-1 text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <div className="icon-trash text-xs"></div>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* History Panel */}
                        {activePanel === 'history' && (
                            <div className="p-4 space-y-2">
                                {sessions.map(session => (
                                    <div 
                                        key={session.id}
                                        onClick={() => loadSession(session)}
                                        className={`group p-3 rounded-lg cursor-pointer transition-colors border border-transparent ${currentSessionId === session.id ? 'bg-white/10 border-white/10' : 'hover:bg-white/5'}`}
                                    >
                                        {editingSessionId === session.id ? (
                                            <div className="flex items-center gap-2">
                                                <input 
                                                    type="text" 
                                                    value={editTitle} 
                                                    onChange={(e) => setEditTitle(e.target.value)}
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="bg-black border border-white/20 rounded px-2 py-1 text-sm w-full focus:outline-none"
                                                    autoFocus
                                                    onKeyDown={(e) => e.key === 'Enter' && saveEditing(e)}
                                                />
                                                <button onClick={saveEditing} className="text-green-500"><div className="icon-check text-sm"></div></button>
                                            </div>
                                        ) : (
                                            <div className="flex justify-between items-start gap-2">
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-white text-sm font-medium truncate">{session.title}</div>
                                                    <div className="text-[10px] text-gray-500 mt-1">
                                                        {session.timestamp?.seconds ? new Date(session.timestamp.seconds * 1000).toLocaleDateString() : 'Just now'}
                                                    </div>
                                                </div>
                                                <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button 
                                                        onClick={(e) => startEditing(e, session)}
                                                        className="p-1.5 text-gray-500 hover:text-white"
                                                    >
                                                        <div className="icon-pencil text-xs"></div>
                                                    </button>
                                                    <button 
                                                        onClick={(e) => handleDeleteSession(e, session.id)}
                                                        className="p-1.5 text-gray-500 hover:text-red-400"
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

                        {/* Settings Panel */}
                        {activePanel === 'settings' && (
                            <div className="p-4 space-y-6">
                                <div>
                                    <h3 className="text-xs font-bold text-gray-500 uppercase mb-3 tracking-wider">Appearance</h3>
                                    <div className="grid grid-cols-2 gap-2">
                                        {['onyx', 'midnight', 'obsidian', 'forest'].map(t => (
                                            <button 
                                                key={t}
                                                onClick={() => applyTheme(t)}
                                                className={`p-2 rounded-lg border text-xs capitalize transition-all ${currentTheme === t ? 'border-white bg-white/10' : 'border-white/5 hover:border-white/20'}`}
                                            >
                                                {t}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-xs font-bold text-gray-500 uppercase mb-3 tracking-wider">Account</h3>
                                    {currentUser ? (
                                        <div className="p-3 bg-white/5 rounded-lg border border-white/5">
                                            <div className="text-sm font-bold text-white mb-1">{currentUser.name || 'User'}</div>
                                            <div className="text-xs text-gray-500 mb-3">{currentUser.email}</div>
                                            <button 
                                                onClick={onLogout}
                                                className="text-xs text-red-400 hover:underline"
                                            >Sign Out</button>
                                        </div>
                                    ) : (
                                        <button 
                                            onClick={onOpenAuth}
                                            className="w-full text-left p-3 bg-white/5 border border-white/5 rounded-lg text-gray-300 text-sm hover:bg-white/10 transition-colors"
                                        >Sign In</button>
                                    )}

                                    <button 
                                        onClick={clearAllHistory}
                                        className="w-full text-left p-3 mt-4 text-red-500/80 hover:text-red-500 text-sm flex items-center gap-2 group transition-colors"
                                    >
                                        <div className="icon-trash group-hover:scale-110 transition-transform"></div>
                                        Clear Chat History
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Main Chat Area */}
            <main className="flex-1 flex flex-col relative h-full w-full min-w-0">
                {/* Mobile Header */}
                <header className="md:hidden absolute top-0 left-0 right-0 h-16 flex items-center justify-between px-4 z-20 bg-black/50 backdrop-blur-md border-b border-white/5">
                    <button 
                        onClick={() => setSidebarOpen(true)}
                        className="p-2 text-gray-400 hover:text-white"
                    >
                        <div className="icon-menu text-xl"></div>
                    </button>
                    <span className="font-bold tracking-tight text-white">Aura</span>
                    <button 
                        onClick={handleNewChat}
                        className="p-2 text-gray-400 hover:text-white"
                    >
                        <div className="icon-square-pen text-xl"></div>
                    </button>
                </header>

                <div className="flex-1 overflow-y-auto thin-scrollbar relative flex flex-col">
                    {isHome ? (
                        /* Home State */
                        <div className="flex-1 flex flex-col items-center justify-center p-4 w-full h-full max-w-3xl mx-auto animate-fade-in-up">
                            <div className="mb-10 flex flex-col items-center select-none">
                                <span className="text-5xl md:text-6xl font-bold tracking-tight text-white mb-6">Aura</span>
                            </div>

                            {/* Center Input */}
                            <div className="w-full mb-8 z-30">
                                <InputBar 
                                    onSendMessage={handleSendMessage} 
                                    isTyping={isTyping} 
                                    compact={false}
                                />
                            </div>

                            {/* Guest Welcome */}
                            {!currentUser && (
                                <div 
                                    onClick={onOpenAuth}
                                    className="flex items-center gap-4 bg-[var(--bg-secondary)] border border-white/10 rounded-full px-5 py-3 hover:bg-[#1a1a1a] transition-all cursor-pointer group scale-95 hover:scale-100"
                                >
                                    <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center border border-white/10">
                                        <div className="icon-orbit text-white text-lg"></div>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-semibold text-white group-hover:underline">Connect your Aura account</span>
                                        <span className="text-xs text-gray-500">Unlock early features and personalized content.</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        /* Active Chat State */
                        <div className="flex flex-col min-h-full">
                            <div className="flex-1 w-full max-w-3xl mx-auto px-4 pt-24 md:pt-10 pb-4">
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
                                        <div className="w-2 h-2 bg-white rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                        <div className="w-2 h-2 bg-white rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                        <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
                                    </div>
                                )}
                                <div ref={messagesEndRef} className="h-4 w-full" />
                            </div>

                            {/* Bottom Input Area */}
                            <div className="sticky bottom-0 w-full bg-gradient-to-t from-[var(--bg-primary)] via-[var(--bg-primary)] to-transparent pt-10 pb-6 px-4 z-20">
                                <div className="max-w-3xl mx-auto">
                                    <InputBar 
                                        onSendMessage={handleSendMessage} 
                                        isTyping={isTyping} 
                                        compact={true}
                                    />
                                    <div className="text-center mt-3 text-xs text-[#555] font-medium tracking-wide select-none">
                                        Aura can make mistakes. Check important info.
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Premium Promo Card */}
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
