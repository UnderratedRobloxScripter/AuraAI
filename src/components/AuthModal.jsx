import React, { useState, useEffect } from "react";
import { 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    signInWithPopup,
    updateProfile 
} from "firebase/auth";
import { auth, googleProvider, db } from "../utils/firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { X, Eye, EyeOff, Mail, ChevronDown } from 'lucide-react';

function AuthModal({ isOpen, onClose, onLogin }) {
    const [isSignUp, setIsSignUp] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [view, setView] = useState("options"); // "options" or "email"

    if (!isOpen) return null;

    const syncUserToFirestore = async (user, displayName) => {
        const userRef = doc(db, "users", user.uid);
        const snap = await getDoc(userRef);
        if (!snap.exists()) {
            await setDoc(userRef, {
                uid: user.uid,
                email: user.email,
                displayName: displayName || user.displayName || "Explorer",
                plan: "free",
                createdAt: new Date().toISOString()
            });
        }
    };

    const handleEmailAuth = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            let userCredential;
            if (isSignUp) {
                userCredential = await createUserWithEmailAndPassword(auth, email, password);
                await updateProfile(userCredential.user, { displayName: name });
                await syncUserToFirestore(userCredential.user, name);
            } else {
                userCredential = await signInWithEmailAndPassword(auth, email, password);
            }
            onLogin(userCredential.user);
            onClose();
        } catch (err) {
            setError(err.message.replace("Firebase: ", ""));
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleAuth = async () => {
        setError("");
        setLoading(true);
        try {
            const result = await signInWithPopup(auth, googleProvider);
            await syncUserToFirestore(result.user);
            onLogin(result.user);
            onClose();
        } catch (err) {
            setError(err.message.replace("Firebase: ", ""));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex bg-black animate-in fade-in duration-700 overflow-hidden">
            
            {/* LEFT SIDE: AUTH FORM */}
            <div className="w-full lg:w-1/2 h-full bg-black text-white p-8 md:p-16 flex flex-col justify-between z-10">
                <div className="flex justify-between items-center">
                    <div className="text-2xl font-black tracking-tighter italic">AURA</div>
                    <div className="flex items-center gap-2 border border-white/10 rounded-full px-4 py-1.5 text-[13px] bg-white/[0.02]">
                        <span className="text-neutral-500 font-medium">You are signing into</span>
                        <div className="flex items-center gap-1 font-bold">
                            <div className="w-3 h-3 border border-white/40 rounded-full"></div>
                            Aura <ChevronDown size={14} className="text-neutral-500" />
                        </div>
                    </div>
                </div>

                <div className="max-w-[400px] mx-auto w-full flex-1 flex flex-col justify-center py-12">
                    <h2 className="text-4xl font-bold tracking-tight mb-10 text-center lg:text-left">
                        {view === "email" ? (isSignUp ? "Create account" : "Log in with email") : "Log into your account"}
                    </h2>

                    {error && (
                        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs animate-in shake-in-1">
                            {error}
                        </div>
                    )}

                    {view === "options" ? (
                        <div className="space-y-4">
                            <button onClick={handleGoogleAuth} className="w-full flex items-center justify-center gap-3 bg-white text-black font-bold py-4 rounded-full text-md hover:bg-neutral-200 transition-all active:scale-[0.98]">
                                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5" alt=""/>
                                Login with Google
                            </button>
                            <div className="relative py-4">
                                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10"></div></div>
                                <div className="relative flex justify-center text-[10px] font-black tracking-widest text-neutral-600"><span className="bg-black px-4 uppercase">OR</span></div>
                            </div>
                            <button onClick={() => setView("email")} className="w-full flex items-center justify-center gap-3 bg-transparent text-white font-bold py-4 rounded-full text-md border border-white/10 hover:bg-white/[0.05] transition-all">
                                <Mail size={20} /> Login with email
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleEmailAuth} className="space-y-4 animate-in slide-in-from-bottom-4 duration-500">
                            {isSignUp && (
                                <input 
                                    type="text" placeholder="Full Name" required value={name} onChange={(e)=>setName(e.target.value)}
                                    className="w-full bg-white/[0.05] border border-white/10 rounded-xl px-5 py-4 focus:outline-none focus:border-white/30 transition-all"
                                />
                            )}
                            <input 
                                type="email" placeholder="Email Address" required value={email} onChange={(e)=>setEmail(e.target.value)}
                                className="w-full bg-white/[0.05] border border-white/10 rounded-xl px-5 py-4 focus:outline-none focus:border-white/30 transition-all"
                            />
                            <div className="relative">
                                <input 
                                    type={showPassword ? "text" : "password"} placeholder="Password" required value={password} onChange={(e)=>setPassword(e.target.value)}
                                    className="w-full bg-white/[0.05] border border-white/10 rounded-xl px-5 py-4 pr-14 focus:outline-none focus:border-white/30 transition-all"
                                />
                                <button type="button" onClick={()=>setShowPassword(!showPassword)} className="absolute right-5 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white transition-colors">
                                    {showPassword ? <EyeOff size={20}/> : <Eye size={20}/>}
                                </button>
                            </div>
                            <button type="submit" disabled={loading} className="w-full bg-white text-black font-bold py-4 rounded-full text-md hover:bg-neutral-200 transition-all disabled:opacity-50 mt-4">
                                {loading ? "Processing..." : (isSignUp ? "Register" : "Sign In")}
                            </button>
                            <button type="button" onClick={() => setView("options")} className="w-full text-center text-sm text-neutral-500 mt-2 hover:text-white">Back to options</button>
                        </form>
                    )}

                    <div className="mt-8 text-center">
                        <button onClick={() => { setIsSignUp(!isSignUp); setError(""); }} className="text-neutral-500 hover:text-white transition-colors">
                            {isSignUp ? "Already have an account?" : "Don't have an account?"} <span className="font-bold text-white ml-1"> {isSignUp ? "Log in" : "Sign up"}</span>
                        </button>
                    </div>
                </div>

                <div className="text-[11px] text-neutral-600 text-center leading-relaxed">
                    By continuing, you agree to Aura's <span className="underline decoration-neutral-800">Terms of Service</span> and <span className="underline decoration-neutral-800">Privacy Policy</span>.
                </div>
            </div>

            {/* RIGHT SIDE: ANIMATED GRAPHICS & GLOW */}
            <div className="hidden lg:flex w-1/2 h-full relative bg-[#050505] items-center justify-center overflow-hidden border-l border-white/5">
                
                {/* THE CENTER-RIGHT GLOW EFFECT */}
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[300px] h-[600px] bg-blue-600/20 blur-[120px] rounded-full animate-pulse duration-[4000ms] pointer-events-none"></div>
                <div className="absolute right-[-50px] top-1/2 -translate-y-1/2 w-[150px] h-[400px] bg-white/5 blur-[80px] rounded-full pointer-events-none"></div>

                {/* Abstract Line / Large Logo Frame */}
                <div className="relative w-[500px] h-[500px] opacity-20 group">
                    <div className="absolute inset-0 border-[2px] border-white/20 rounded-full animate-[spin_20s_linear_infinite]"></div>
                    <div className="absolute inset-10 border-[1px] border-white/10 rounded-full animate-[spin_15s_linear_infinite_reverse]"></div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[200px] font-black italic tracking-tighter text-white/10 select-none">
                        A
                    </div>
                </div>

                {/* LUCIDE CLOSE BUTTON (Top Right) */}
                <button 
                    onClick={onClose} 
                    className="absolute top-8 right-8 p-2 text-neutral-500 hover:text-white hover:bg-white/10 rounded-full transition-all duration-300 z-50"
                >
                    <X size={32} strokeWidth={1.5} />
                </button>
            </div>
        </div>
    );
}

export default AuthModal;
