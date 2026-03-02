import React from "react";
function Sidebar({ isOpen, onNewChat, activePanel, setActivePanel, currentUser, onOpenAuth, onOpenPricing, onLogout }) {
    // State for hover expansion
    const [isHovered, setIsHovered] = React.useState(false);

    const navItems = [
        { id: 'search', icon: 'icon-search', label: 'Search' },
        { id: 'new_chat', icon: 'icon-square-pen', label: 'New Chat', action: onNewChat },
        { id: 'library', icon: 'icon-book', label: 'Library' }, 
        { id: 'history', icon: 'icon-clock', label: 'History' },
    ];

    const getPlanBadge = () => {
        if (!currentUser) return 'Guest';
        if (currentUser.plan === 'pro_plus') return 'Pro+';
        if (currentUser.plan === 'pro') return 'Pro';
        return 'Free';
    };

    const getPlanColor = () => {
        if (!currentUser) return 'text-gray-500';
        if (currentUser.plan === 'pro_plus') return 'text-purple-400';
        if (currentUser.plan === 'pro') return 'text-blue-400';
        return 'text-gray-500';
    };

    return (
        <div 
            className={`
                hidden md:flex flex-col justify-between h-full py-4 bg-black border-r border-white/5 z-30 flex-shrink-0 transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)]
                ${isHovered ? 'w-64' : 'w-16'}
            `}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Top Section */}
            <div className={`flex flex-col gap-6 transition-all duration-300 ${isHovered ? 'items-start px-3' : 'items-center px-0'}`}>
                {/* Logo Area */}
                <div 
                    onClick={onNewChat}
                    className={`
                        h-10 flex items-center cursor-pointer hover:bg-white/10 rounded-full transition-all duration-200
                        ${isHovered ? 'w-full px-3' : 'w-10 justify-center'}
                    `}
                >
                    {/* Saturn Icon for Aura */}
                    <div className="icon-orbit text-white text-2xl flex-shrink-0"></div>
                    
                    {/* Brand Name */}
                    <span 
                        className={`
                            ml-3 font-bold text-xl tracking-tight text-white whitespace-nowrap overflow-hidden transition-all duration-300 
                            ${isHovered ? 'opacity-100 max-w-[200px]' : 'opacity-0 max-w-0'}
                        `}
                    >
                        Aura
                    </span>
                </div>

                {/* Nav Items */}
                <nav className={`flex flex-col gap-2 w-full ${isHovered ? '' : 'items-center'}`}>
                    {navItems.map((item) => {
                        const isActive = activePanel === item.id;
                        return (
                            <button 
                                key={item.id}
                                onClick={() => {
                                    if (item.action) {
                                        item.action();
                                    } else {
                                        setActivePanel(isActive ? null : item.id);
                                    }
                                }}
                                className={`
                                    group flex items-center rounded-lg transition-all duration-200 h-10
                                    ${isActive ? 'bg-white/10 text-white' : 'hover:bg-white/10 text-[var(--text-secondary)] hover:text-white'}
                                    ${isHovered ? 'w-full px-3 justify-start' : 'w-10 justify-center'}
                                `}
                                title={!isHovered ? item.label : ''}
                            >
                                <div className={`${item.icon} text-xl transition-colors flex-shrink-0`}></div>
                                <span 
                                    className={`
                                        ml-3 font-medium text-sm whitespace-nowrap overflow-hidden transition-all duration-300 
                                        ${isHovered ? 'opacity-100 max-w-[200px]' : 'opacity-0 max-w-0'}
                                    `}
                                >
                                    {item.label}
                                </span>
                            </button>
                        );
                    })}
                </nav>
            </div>

            {/* Bottom Section */}
            <div className={`flex flex-col gap-6 mb-2 w-full transition-all duration-300 ${isHovered ? 'items-start px-3' : 'items-center px-0'}`}>
                 <button 
                    onClick={() => setActivePanel(activePanel === 'settings' ? null : 'settings')}
                    className={`
                        group flex items-center rounded-lg hover:bg-white/10 transition-colors h-10
                        ${activePanel === 'settings' ? 'bg-white/10 text-white' : ''}
                        ${isHovered ? 'w-full px-3 justify-start' : 'w-10 justify-center'}
                    `} 
                    title={!isHovered ? "Settings" : ''}
                >
                    <div className={`icon-settings text-xl ${activePanel === 'settings' ? 'text-white' : 'text-[var(--text-secondary)]'} group-hover:text-white flex-shrink-0`}></div>
                    <span 
                        className={`
                            ml-3 font-medium text-sm ${activePanel === 'settings' ? 'text-white' : 'text-[var(--text-secondary)]'} group-hover:text-white whitespace-nowrap overflow-hidden transition-all duration-300 
                            ${isHovered ? 'opacity-100 max-w-[200px]' : 'opacity-0 max-w-0'}
                        `}
                    >
                        Settings
                    </span>
                </button>

                {/* User Profile Section */}
                {currentUser ? (
                    <div 
                        onClick={onOpenPricing}
                        className={`
                            group flex items-center rounded-full transition-all duration-300 cursor-pointer hover:bg-white/5 relative
                            ${isHovered ? 'w-full p-2 gap-3 justify-start' : 'w-10 h-10 justify-center'}
                        `}
                    >
                        {/* Avatar */}
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-700 to-black flex items-center justify-center text-white ring-1 ring-white/20 flex-shrink-0 relative overflow-hidden">
                            {currentUser.avatar ? (
                                <img src={currentUser.avatar} alt="User" className="w-full h-full object-cover" />
                            ) : (
                                <div className="font-bold text-xs">{currentUser.name.substring(0,2).toUpperCase()}</div>
                            )}
                        </div>

                        {/* Text Info */}
                        <div 
                            className={`
                                flex flex-col text-left overflow-hidden transition-all duration-300 
                                ${isHovered ? 'opacity-100 max-w-[200px]' : 'opacity-0 max-w-0'}
                            `}
                        >
                            <span className="text-sm font-bold text-white truncate">{currentUser.name}</span>
                            <span className={`text-[10px] font-bold uppercase tracking-wider ${getPlanColor()}`}>
                                {getPlanBadge()} Plan
                            </span>
                        </div>

                        {/* Logout Button (Only visible on hover when expanded) */}
                        {isHovered && (
                            <button 
                                onClick={(e) => { e.stopPropagation(); onLogout(); }}
                                className="absolute right-2 p-1.5 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Log out"
                            >
                                <div className="icon-log-out text-sm"></div>
                            </button>
                        )}
                    </div>
                ) : (
                    /* Guest / Login State */
                    <button 
                        onClick={onOpenAuth}
                        className={`
                            flex items-center rounded-full transition-all duration-300 cursor-pointer bg-white text-black hover:bg-gray-200
                            ${isHovered ? 'w-full px-4 py-2 gap-2 justify-center' : 'w-10 h-10 justify-center p-0'}
                        `}
                        title="Sign In"
                    >
                        <div className="icon-user text-lg flex-shrink-0"></div>
                        <span 
                            className={`
                                font-bold text-sm whitespace-nowrap overflow-hidden transition-all duration-300 
                                ${isHovered ? 'opacity-100 max-w-[200px]' : 'opacity-0 max-w-0'}
                            `}
                        >
                            Sign In
                        </span>
                    </button>
                )}
            </div>
        </div>
    );
}
export default Sidebar;
