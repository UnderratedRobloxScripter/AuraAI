import React, { useState } from "react";
import { 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    signInWithPopup,
    updateProfile 
} from "firebase/auth";
import { auth, googleProvider, db } from "../utils/firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";

function AuthModal({ isOpen, onClose, onLogin }) {
    const [isSignUp, setIsSignUp] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

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
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-xl animate-in fade-in duration-500">
            {/* Full Screen Container */}
            <div className="relative w-full max-w-[440px] bg-[#050505] border border-white/10 rounded-[2.5rem] p-10 shadow-[0_0_50px_-12px_rgba(168,85,247,0.2)] overflow-hidden scale-in-center animate-in zoom-in-95 duration-300">
                
                {/* High-End Ambient Glows */}
                <div className="absolute -top-24 -left-24 w-64 h-64 bg-purple-600/10 blur-[120px] rounded-full pointer-events-none"></div>
                <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-blue-600/10 blur-[120px] rounded-full pointer-events-none"></div>
                
                <div className="relative z-10">
                    <div className="flex justify-between items-start mb-10">
                        <div className="space-y-2">
                            <h2 className="text-3xl font-bold text-white tracking-tight">
                                {isSignUp ? "Create account" : "Welcome back"}
                            </h2>
                            <p className="text-gray-400 text-sm font-medium">
                                {isSignUp ? "Start your journey with Aura" : "Enter your details to continue"}
                            </p>
                        </div>
                        <button onClick={onClose} className="group p-2 bg-white/5 hover:bg-white/10 rounded-full transition-all">
                            <div className="icon-x text-gray-400 group-hover:text-white transition-colors"></div>
                        </button>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-red-500/5 border border-red-500/20 rounded-2xl text-red-400 text-xs font-medium flex items-center gap-3 animate-bounce-short">
                            <div className="icon-alert-circle text-base"></div>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleEmailAuth} className="space-y-5">
                        {isSignUp && (
                            <div className="group space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 ml-1 transition-colors group-focus-within:text-purple-400">Full Name</label>
                                <input 
                                    type="text" required value={name} onChange={(e) => setName(e.target.value)}
                                    className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-purple-500/50 focus:bg-white/[0.06] transition-all placeholder:text-gray-600"
                                    placeholder="John Doe"
                                />
                            </div>
                        )}
                        
                        <div className="group space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 ml-1 transition-colors group-focus-within:text-purple-400">Email Address</label>
                            <input 
                                type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-purple-500/50 focus:bg-white/[0.06] transition-all placeholder:text-gray-600"
                                placeholder="name@domain.com"
                            />
                        </div>

                        <div className="group space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 ml-1 transition-colors group-focus-within:text-purple-400">Password</label>
                            <div className="relative">
                                <input 
                                    type={showPassword ? "text" : "password"} 
                                    required value={password} onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-4 pr-14 text-white focus:outline-none focus:border-purple-500/50 focus:bg-white/[0.06] transition-all placeholder:text-gray-600"
                                    placeholder="••••••••"
                                />
                                <button 
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                                >
                                    {showPassword ? (
                                        <div className="icon-eye-off text-lg"></div> // Ensure you have eye/eye-off icons
                                    ) : (
                                        <div className="icon-eye text-lg"></div>
                                    )}
                                </button>
                            </div>
                        </div>

                        <button 
                            type="submit" disabled={loading}
                            className="w-full h-[60px] bg-white text-black font-black rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-lg shadow-white/5 flex items-center justify-center gap-3 disabled:opacity-50"
                        >
                            {loading ? (
                                <div className="w-6 h-6 border-3 border-black/20 border-t-black rounded-full animate-spin"></div>
                            ) : (
                                <span>{isSignUp ? "Create Account" : "Sign In"}</span>
                            )}
                        </button>
                    </form>

                    <div className="relative my-10">
                        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5"></div></div>
                        <div className="relative flex justify-center text-[10px] uppercase tracking-[0.3em] font-black text-gray-600">
                            <span className="bg-[#050505] px-6">Third Party</span>
                        </div>
                    </div>

                    <button 
                        onClick={handleGoogleAuth} disabled={loading}
                        className="w-full h-[60px] bg-white/[0.03] border border-white/10 text-white font-bold rounded-2xl hover:bg-white/10 transition-all flex items-center justify-center gap-4 group"
                    >
                        <div className="icon-google text-xl group-hover:scale-110 transition-transform"></div>
                        <span className="tracking-tight">Continue with Google</span>
                    </button>

                    <div className="mt-10 text-center">
                        <button 
                            onClick={() => {
                                setIsSignUp(!isSignUp);
                                setError("");
                            }}
                            className="text-sm font-medium text-gray-500 hover:text-white transition-colors group"
                        >
                            {isSignUp ? "Already have an account?" : "Don't have an account?"}
                            <span className="ml-2 text-white font-bold decoration-white/30 group-hover:underline underline-offset-4">
                                {isSignUp ? "Sign In" : "Sign Up"}
                            </span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AuthModal;
