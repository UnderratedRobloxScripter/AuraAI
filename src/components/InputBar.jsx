import React from "react";
function InputBar({ onSendMessage, isTyping, compact = false }) {
    const [text, setText] = React.useState('');
    const [images, setImages] = React.useState([]);
    const [modelMode, setModelMode] = React.useState('Auto'); 
    const [showModelMenu, setShowModelMenu] = React.useState(false);
    const [showAttachMenu, setShowAttachMenu] = React.useState(false);
    
    const fileInputRef = React.useRef(null);
    const textareaRef = React.useRef(null);
    const attachMenuRef = React.useRef(null);
    const modelMenuRef = React.useRef(null);

    const handleSend = () => {
        if ((!text.trim() && images.length === 0) || isTyping) return;
        
        onSendMessage(text, images, modelMode);
        setText('');
        setImages([]);
        
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handlePaste = (e) => {
        const items = e.clipboardData.items;
        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== -1) {
                e.preventDefault();
                const blob = items[i].getAsFile();
                const reader = new FileReader();
                reader.onload = (event) => {
                    setImages(prev => [...prev, event.target.result]);
                };
                reader.readAsDataURL(blob);
            }
        }
    };

    const handleFileSelect = (e) => {
        const files = Array.from(e.target.files);
        files.forEach(file => {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImages(prev => [...prev, reader.result]);
            };
            reader.readAsDataURL(file);
        });
        setShowAttachMenu(false);
    };

    // Click outside handler
    React.useEffect(() => {
        const handleClickOutside = (event) => {
            if (attachMenuRef.current && !attachMenuRef.current.contains(event.target)) {
                setShowAttachMenu(false);
            }
            if (modelMenuRef.current && !modelMenuRef.current.contains(event.target)) {
                setShowModelMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    React.useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px';
        }
    }, [text]);

    const handleContainerClick = () => {
        textareaRef.current?.focus();
    };

    const getModelIcon = (mode) => {
        switch(mode) {
            case 'Fast': return 'icon-zap';
            case 'Thinking': return 'icon-brain';
            default: return 'icon-sparkles';
        }
    };

    return (
        <div className={`w-full mx-auto transition-all duration-500 ${compact ? 'max-w-4xl' : 'max-w-2xl'}`}>
            <div className="relative group">
                
                {/* Image Previews */}
                {images.length > 0 && (
                    <div className="absolute bottom-full left-0 mb-4 flex gap-2 overflow-x-auto p-2 w-full">
                        {images.map((img, idx) => (
                            <div key={idx} className="relative group/img">
                                <img src={img} className="h-16 w-16 rounded-md object-cover border border-white/20" />
                                <button 
                                    onClick={() => setImages(images.filter((_, i) => i !== idx))}
                                    className="absolute -top-1 -right-1 bg-black rounded-full p-0.5 text-white opacity-0 group-hover/img:opacity-100 transition-opacity"
                                >
                                    <div className="icon-x text-xs"></div>
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* Main Input Pill */}
                <div 
                    onClick={handleContainerClick}
                    className="
                        relative flex items-center gap-3 px-4 py-3 rounded-[32px]
                        bg-[#121212] border border-white/10
                        hover:border-white/20
                        focus-within:border-white/20 focus-within:bg-[#161616]
                        transition-all duration-200 ease-out
                        cursor-text
                        shadow-lg shadow-black/50
                    "
                >
                    
                    {/* Left: Attach Button & Menu */}
                    <div className="relative" ref={attachMenuRef}>
                        <button 
                            onClick={(e) => { e.stopPropagation(); setShowAttachMenu(!showAttachMenu); }}
                            className={`
                                flex-shrink-0 p-2 text-gray-400 hover:text-white transition-colors rounded-full hover:bg-white/5
                                ${showAttachMenu ? 'bg-white/10 text-white' : ''}
                            `}
                            title="Attach media"
                        >
                            <div className="icon-paperclip text-xl transform rotate-45"></div>
                        </button>
                        
                        {/* Hidden Input */}
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            className="hidden" 
                            accept="image/*" 
                            multiple 
                            onChange={handleFileSelect}
                        />

                        {/* Attach Dropdown Menu */}
                        {showAttachMenu && (
                            <div className={`
                                absolute left-0 w-72 bg-[#1e1e1e] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50 flex flex-col
                                ${compact 
                                    ? 'bottom-full mb-4 animate-fade-in-up' // Open Up (Chat Mode)
                                    : 'top-full mt-4 animate-fade-in-down'  // Open Down (Home Mode)
                                }
                            `}>
                                <div className="p-2 space-y-1">
                                    {/* Upload File */}
                                    <button 
                                        onClick={() => fileInputRef.current?.click()}
                                        className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-white/5 rounded-xl transition-colors group text-left"
                                    >
                                        <div className="icon-file-plus text-lg text-gray-400 group-hover:text-white"></div>
                                        <span className="text-sm font-medium text-gray-200 group-hover:text-white">Upload a file</span>
                                    </button>

                                    {/* Add text content */}
                                    <button 
                                        onClick={() => { setShowAttachMenu(false); textareaRef.current?.focus(); }}
                                        className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-white/5 rounded-xl transition-colors group text-left"
                                    >
                                        <div className="icon-pencil text-lg text-gray-400 group-hover:text-white"></div>
                                        <span className="text-sm font-medium text-gray-200 group-hover:text-white">Add text content</span>
                                    </button>

                                    {/* Draw a sketch */}
                                    <button 
                                        onClick={() => { setShowAttachMenu(false); alert('Sketching coming soon!'); }}
                                        className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-white/5 rounded-xl transition-colors group text-left"
                                    >
                                        <div className="icon-pen-tool text-lg text-gray-400 group-hover:text-white"></div>
                                        <span className="text-sm font-medium text-gray-200 group-hover:text-white">Draw a sketch</span>
                                    </button>

                                    {/* Divider */}
                                    <div className="h-px bg-white/5 my-1 mx-2"></div>

                                    {/* Connect Google Drive */}
                                    <button 
                                        onClick={() => { setShowAttachMenu(false); alert('Drive Integration coming soon!'); }}
                                        className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-white/5 rounded-xl transition-colors group text-left"
                                    >
                                        <div className="icon-hard-drive text-lg text-green-500/80 group-hover:text-green-400"></div>
                                        <span className="text-sm font-medium text-gray-200 group-hover:text-white">Connect Google Drive</span>
                                    </button>

                                    {/* Connect OneDrive */}
                                    <button 
                                        onClick={() => { setShowAttachMenu(false); alert('OneDrive Integration coming soon!'); }}
                                        className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-white/5 rounded-xl transition-colors group text-left"
                                    >
                                        <div className="icon-cloud text-lg text-blue-500/80 group-hover:text-blue-400"></div>
                                        <span className="text-sm font-medium text-gray-200 group-hover:text-white">Connect Microsoft OneDrive</span>
                                    </button>
                                </div>
                                
                                {/* Footer: Recent */}
                                <div className="border-t border-white/5 p-2 mt-1">
                                    <button 
                                        className="w-full flex items-center justify-between px-3 py-2 hover:bg-white/5 rounded-xl transition-colors group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="icon-file-clock text-lg text-gray-500 group-hover:text-gray-300"></div>
                                            <span className="text-sm font-medium text-gray-400 group-hover:text-gray-200">Recent</span>
                                        </div>
                                        <div className="icon-chevron-right text-xs text-gray-600 group-hover:text-gray-400"></div>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Center: Text Area */}
                    <textarea
                        ref={textareaRef}
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        onKeyDown={handleKeyDown}
                        onPaste={handlePaste}
                        placeholder={modelMode === 'Thinking' ? "Ask a complex question..." : "What do you want to know?"}
                        rows={1}
                        className="
                            flex-1 bg-transparent border-none outline-none ring-0 focus:ring-0 
                            text-white placeholder-gray-500 text-[16px] leading-relaxed
                            resize-none py-1 max-h-[200px]
                        "
                        style={{ minHeight: '24px' }}
                    />

                    {/* Right Side Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0 relative" ref={modelMenuRef}>
                        
                        {/* Model Dropdown Trigger */}
                        <div 
                            onClick={(e) => { e.stopPropagation(); setShowModelMenu(!showModelMenu); }}
                            className="hidden sm:flex items-center gap-2 pl-2 pr-2 py-1.5 rounded-full hover:bg-white/5 cursor-pointer transition-colors group/model select-none"
                            title={`Current mode: ${modelMode}`}
                        >
                            <div className={`
                                ${getModelIcon(modelMode)} text-lg transition-colors duration-200
                                ${modelMode === 'Fast' ? 'group-hover/model:text-yellow-400 text-gray-400' : ''}
                                ${modelMode === 'Thinking' ? 'group-hover/model:text-green-500 text-gray-400' : ''}
                                ${modelMode === 'Auto' ? 'group-hover/model:text-white text-gray-400' : ''}
                            `}></div>
                            
                            <div className="icon-chevron-down text-xs text-gray-500 group-hover/model:text-white transition-colors"></div>
                        </div>

                        {/* Model Dropdown Menu */}
                        {showModelMenu && (
                            <div className="absolute bottom-full right-0 mb-3 w-48 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50 animate-fade-in-up">
                                <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-black/20">
                                    Model Mode
                                </div>
                                {/* Auto */}
                                <div 
                                    onClick={() => { setModelMode('Auto'); setShowModelMenu(false); }}
                                    className="px-4 py-3 hover:bg-white/5 cursor-pointer flex items-center gap-3 group/item transition-colors"
                                >
                                    <div className="icon-sparkles text-gray-400 group-hover/item:text-white transition-colors"></div>
                                    <div className="flex flex-col">
                                        <span className="text-sm text-gray-200 group-hover/item:text-white font-medium">Auto</span>
                                    </div>
                                    {modelMode === 'Auto' && <div className="icon-check text-xs text-white ml-auto"></div>}
                                </div>
                                {/* Fast */}
                                <div 
                                    onClick={() => { setModelMode('Fast'); setShowModelMenu(false); }}
                                    className="px-4 py-3 hover:bg-white/5 cursor-pointer flex items-center gap-3 group/item transition-colors"
                                >
                                    <div className="icon-zap text-gray-400 group-hover/item:text-yellow-400 transition-colors"></div>
                                    <div className="flex flex-col">
                                        <span className="text-sm text-gray-200 group-hover/item:text-white font-medium">Fast</span>
                                    </div>
                                    {modelMode === 'Fast' && <div className="icon-check text-xs text-yellow-400 ml-auto"></div>}
                                </div>
                                {/* Thinking */}
                                <div 
                                    onClick={() => { setModelMode('Thinking'); setShowModelMenu(false); }}
                                    className="px-4 py-3 hover:bg-white/5 cursor-pointer flex items-center gap-3 group/item transition-colors"
                                >
                                    <div className="icon-brain text-gray-400 group-hover/item:text-green-500 transition-colors"></div>
                                    <div className="flex flex-col">
                                        <span className="text-sm text-gray-200 group-hover/item:text-white font-medium">Thinking</span>
                                    </div>
                                    {modelMode === 'Thinking' && <div className="icon-check text-xs text-green-500 ml-auto"></div>}
                                </div>
                            </div>
                        )}

                        {/* Mic Button */}
                        <button className="p-2 text-gray-500 hover:text-white transition-colors rounded-full hover:bg-white/5">
                            <div className="icon-mic text-lg"></div>
                        </button>

                        {/* Send / Waveform Button */}
                        <button 
                            onClick={(e) => { e.stopPropagation(); handleSend(); }}
                            disabled={!text.trim() && images.length === 0}
                            className={`
                                w-8 h-8 flex items-center justify-center rounded-full transition-all duration-300 ml-1
                                ${text.trim() || images.length > 0 
                                    ? 'bg-white text-black hover:scale-105' 
                                    : 'bg-white/10 text-gray-500 cursor-not-allowed'}
                            `}
                        >
                            {text.trim() || images.length > 0 ? (
                                <div className="icon-arrow-up text-lg font-bold"></div>
                            ) : (
                                <div className="icon-audio-waveform text-lg"></div>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}


export default InputBar;