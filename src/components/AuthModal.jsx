import React, { useState, useEffect } from "react";
import { 
    sendSignInLinkToEmail, 
    isSignInWithEmailLink, 
    signInWithEmailLink,
    signInWithPopup,
    updateProfile 
} from "firebase/auth";
import { auth, googleProvider, db } from "../utils/firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";

function AuthModal({ isOpen, onClose, onLogin }) {
    const [email, setEmail] = useState("");
    const [name, setName] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [linkSent, setLinkSent] = useState(false);

    // 1. Check if the user is returning to the app after clicking the email link
    useEffect(() => {
        if (isSignInWithEmailLink(auth, window.location.href)) {
            let savedEmail = window.localStorage.getItem('emailForSignIn');
            if (!savedEmail) {
                // If the user opened the link on a different device
                savedEmail = window.prompt('Please provide your email for confirmation');
            }
            
            setLoading(true);
            signInWithEmailLink(auth, savedEmail, window.location.href)
                .then(async (result) => {
                    window.localStorage.removeItem('emailForSignIn');
                    await syncUserToFirestore(result.user);
                    onLogin(result.user);
                    onClose();
                })
                .catch((err) => {
                    setError(err.message);
                })
                .finally(() => setLoading(false));
        }
    }, [onLogin, onClose]);

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

    // 2. Handle OTP (Sign-in Link) Sending
    const handleSendOTP = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        const actionCodeSettings = {
            // URL you want to redirect back to. Must be whitelisted in Firebase Console.
            url: window.location.href, 
            handleCodeInApp: true,
        };

        try {
            await sendSignInLinkToEmail(auth, email, actionCodeSettings);
            // Save email locally to avoid asking user again on the same device
            window.localStorage.setItem('emailForSignIn', email);
            setLinkSent(true);
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="relative w-full max-w-md bg-[#0a0a0a] border border-white/10 rounded-2xl p-8 shadow-2xl overflow-hidden">
                <div className="absolute -top-24 -left-24 w-48 h-48 bg-purple-600/20 blur-[100px] rounded-full"></div>
                
                <div className="relative z-10">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h2 className="text-2xl font-bold text-white tracking-tight">
                                {linkSent ? "Check your email" : "Sign in to Aura"}
                            </h2>
                            <p className="text-gray-500 text-sm mt-1">
                                {linkSent 
                                    ? `We sent a secure login link to ${email}` 
                                    : "Enter your email to receive a secure login link."}
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

                    {!linkSent ? (
                        <form onSubmit={handleSendOTP} className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold uppercase tracking-widest text-gray-500 ml-1">Email Address</label>
                                <input 
                                    type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/20 transition-all"
                                    placeholder="name@example.com"
                                />
                            </div>

                            <button 
                                type="submit" disabled={loading}
                                className="w-full bg-white text-black font-bold py-3 rounded-xl hover:bg-gray-200 transition-all mt-2 disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {loading ? <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin"></div> : "Send Login Link"}
                            </button>
                        </form>
                    ) : (
                        <div className="text-center py-4">
                            <div className="icon-mail text-4xl text-purple-500 mb-4 animate-bounce"></div>
                            <button 
                                onClick={() => setLinkSent(false)} 
                                className="text-xs text-gray-400 hover:text-white underline"
                            >
                                Entered wrong email? Try again
                            </button>
                        </div>
                    )}

                    <div className="relative my-8">
                        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5"></div></div>
                        <div className="relative flex justify-center text-[10px] uppercase tracking-[0.2em] font-bold text-gray-600">
                            <span className="bg-[#0a0a0a] px-4 italic text-xs">or continue with</span>
                        </div>
                    </div>

                    <button 
                        onClick={handleGoogleAuth} disabled={loading}
                        className="w-full bg-white/5 border border-white/10 text-white font-medium py-3 rounded-xl hover:bg-white/10 transition-all flex items-center justify-center gap-3 group"
                    >
                        <div className="icon-google group-hover:scale-110 transition-transform"></div>
                        <span>Google Account</span>
                    </button>
                </div>
            </div>
        </div>
    );
}

export default AuthModal;
