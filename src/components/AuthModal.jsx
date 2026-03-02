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
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    // Save user to Firestore after login/signup
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
                await syncUserToFirestore(userCredential.user);
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
            // Using Popup instead of Redirect to fix the Vercel/Firefox cookie bug 💀
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
            <div className="relative w-full max-w-md bg-[#0b0b0c] border border-white/10 rounded-2xl p-7 shadow-[0_18px_70px_rgba(0,0,0,0.45)]">
                <div className="relative z-10">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h2 className="text-2xl font-semibold text-white tracking-tight">
                                {isSignUp ? "Create account" : "Welcome back"}
                            </h2>
                            <p className="text-gray-500 text-sm mt-1">
                                {isSignUp ? "Minimal signup. Maximum focus." : "Sign in to continue your chats"}
                            </p>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                            <div className="icon-x text-gray-500 hover:text-white"></div>
                        </button>
                    </div>

                    {error && (
                        <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-xs flex items-center gap-2 animate-shake">
                            <div className="icon-alert-circle"></div>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleEmailAuth} className="space-y-4">
                        {isSignUp && (
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold uppercase tracking-widest text-gray-500 ml-1">Full Name</label>
                                <input 
                                    type="text" required value={name} onChange={(e) => setName(e.target.value)}
                                    className="w-full bg-transparent border border-white/15 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/40 transition-all placeholder:text-gray-600"
                                    placeholder="Enter your name"
                                />
                            </div>
                        )}
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold uppercase tracking-widest text-gray-500 ml-1">Email Address</label>
                            <input 
                                type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-transparent border border-white/15 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/40 transition-all placeholder:text-gray-600"
                                placeholder="name@example.com"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold uppercase tracking-widest text-gray-500 ml-1">Password</label>
                            <input 
                                type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-transparent border border-white/15 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/40 transition-all placeholder:text-gray-600"
                                placeholder="••••••••"
                            />
                        </div>

                        <button 
                            type="submit" disabled={loading}
                            className="w-full bg-white text-black font-semibold py-3 rounded-xl hover:bg-gray-100 transition-all mt-2 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {loading ? <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin"></div> : (isSignUp ? "Create Account" : "Sign In")}
                        </button>
                    </form>

                    <div className="relative my-7">
                        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5"></div></div>
                        <div className="relative flex justify-center text-[10px] uppercase tracking-[0.2em] font-bold text-gray-600">
                            <span className="bg-[#0b0b0c] px-4 text-[10px]">or continue with</span>
                        </div>
                    </div>

                    <button 
                        onClick={handleGoogleAuth} disabled={loading}
                        className="w-full bg-transparent border border-white/15 text-white font-medium py-3 rounded-xl hover:bg-white/5 transition-all flex items-center justify-center gap-3 group"
                    >
                        <div className="icon-google group-hover:scale-110 transition-transform"></div>
                        <span>Google Account</span>
                    </button>

                    <div className="mt-8 text-center">
                        <button 
                            onClick={() => setIsSignUp(!isSignUp)}
                            className="text-sm text-gray-500 hover:text-white transition-colors underline underline-offset-4"
                        >
                            {isSignUp ? "Already have an account? Sign in" : "Don't have an account? Sign up"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AuthModal;
