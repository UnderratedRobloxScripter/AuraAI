import React from "react";
import { Copy, Check } from "lucide-react";

function CodeBlock({ language, code }) {
    const [copied, setCopied] = React.useState(false);

    React.useEffect(() => {
        if (window.Prism) {
            window.Prism.highlightAll();
        }
    }, [code, language]);

    const handleCopy = () => {
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="rounded-xl overflow-hidden my-4 border border-white/10 bg-[#0d0d0d] font-sans w-full max-w-full group">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2 bg-[#1a1a1a] border-b border-white/5 select-none">
                {/* Language text converted to Uppercase for that premium look */}
                <span className="text-[10px] tracking-widest font-bold text-gray-400 uppercase">
                    {language || 'text'}
                </span>
                
                <div className="flex items-center">
                    <button 
                        onClick={handleCopy}
                        className="p-1.5 text-gray-400 hover:text-white transition-colors flex items-center justify-center"
                        title="Copy code"
                    >
                        {copied ? (
                            <Check size={14} strokeWidth={2.5} className="text-green-400" />
                        ) : (
                            <Copy size={14} strokeWidth={2.5} className="opacity-80 hover:opacity-100" />
                        )}
                    </button>
                </div>
            </div>
            
            {/* Code Content */}
            <div className="p-4 overflow-x-auto bg-[#0d0d0d] thin-scrollbar">
                <pre><code className={`language-${language || 'text'}`}>{code}</code></pre>
            </div>
        </div>
    );
}

export default CodeBlock;
