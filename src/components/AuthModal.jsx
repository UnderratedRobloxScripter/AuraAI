import React, { useState } from "react";
import { 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    signInWithPopup,
    updateProfile 
} from "firebase/auth";
import { auth, googleProvider, db } from "../utils/firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { X, Eye, EyeOff, Mail, Apple, CheckCircle2, AlertCircle } from 'lucide-react'; // Import icons

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
        <div className="fixed inset-0 z-[100] flex animate-fade-in duration-500 overflow-hidden">
            {/* Left Side: Dark Log-in Form */}
            <div className="w-1/2 h-full bg-black text-white p-16 flex flex-col justify-between">
                <div>
                    <div className="flex justify-between items-center mb-16">
                        <img src="path_to_x1_logo.png" alt="X1 Logo" className="h-8" /> {/* Replace with actual logo */}
                        <div className="flex items-center gap-2 border border-neutral-800 rounded-full px-4 py-2 text-sm text-neutral-400">
                           <span className="font-medium text-white">You are signing into</span>
                           <div className="flex items-center gap-1.5 font-semibold text-white">
                                <div className="icon-orbit text-xs"></div> {/* Replace with orbit icon */}
                                Grok
                                <div className="icon-chevron-down text-xs"></div>
                           </div>
                        </div>
                    </div>
                
                    <div className="max-w-md mx-auto flex-1 flex flex-col justify-center gap-10">
                        <h2 className="text-4xl font-bold tracking-tighter text-center">Log into your account</h2>
                        
                        <div className="space-y-4">
                            <button className="w-full flex items-center justify-center gap-3 bg-white text-black font-semibold py-4 rounded-full text-lg hover:bg-neutral-100 transition-colors">
                                <Apple className="w-6 h-6" />
                                Login with X
                            </button>
                            
                            <div className="relative">
                                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-neutral-800"></div></div>
                                <div className="relative flex justify-center text-xs uppercase font-medium text-neutral-600">
                                    <span className="bg-black px-4">OR</span>
                                </div>
                            </div>

                            <button className="w-full flex items-center justify-center gap-3 bg-neutral-900 text-white font-medium py-4 rounded-full text-lg border border-neutral-800 hover:bg-neutral-800 transition-colors">
                                <Mail className="w-5 h-5" />
                                Login with email
                            </button>
                            <button className="w-full flex items-center justify-center gap-3 bg-neutral-900 text-white font-medium py-4 rounded-full text-lg border border-neutral-800 hover:bg-neutral-800 transition-colors">
                                <img src="https://authjs.dev/img/providers/google.svg" alt="Google Logo" className="w-5 h-5" />
                                Login with Google
                            </button>
                            <button className="w-full flex items-center justify-center gap-3 bg-neutral-900 text-white font-medium py-4 rounded-full text-lg border border-neutral-800 hover:bg-neutral-800 transition-colors">
                                <Apple className="w-5 h-5" />
                                Login with Apple
                            </button>
                        </div>

                        <div className="text-center">
                            <button className="text-neutral-400 hover:text-white transition-colors text-lg">
                                Don't have an account? <span className="font-semibold text-white">Sign up</span>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="max-w-md mx-auto text-neutral-600 text-sm text-center">
                   By continuing, you agree to xAI's <span className="underline hover:text-white transition-colors cursor-pointer">Terms of Service</span> and <span className="underline hover:text-white transition-colors cursor-pointer">Privacy Policy</span>.
                </div>
            </div>

            {/* Right Side: Abstract Graphics */}
            <div className="w-1/2 h-full relative overflow-hidden flex items-center justify-center bg-black">
                {/* Large G-like shape */}
                <div className="absolute inset-0 border-[100px] border-neutral-800 rounded-full opacity-20 transform translate-x-[-15%]"></div>
                
                {/* Diagonal line */}
                <div className="absolute top-0 right-0 w-[200%] h-full transform origin-top-right rotate-[-45deg] bg-neutral-950 opacity-40"></div>
                
                {/* Glowing orb/gradient */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] rounded-full bg-gradient-radial from-blue-900/40 via-blue-950/10 to-transparent blur-[150px]"></div>

                {/* Lucide X Button */}
                <button 
                    onClick={onClose} 
                    className="absolute top-8 right-8 p-3 bg-white/5 hover:bg-white/10 rounded-full transition-colors z-50 group"
                >
                    <X className="w-8 h-8 text-neutral-500 group-hover:text-white transition-colors" />
                </button>
            </div>
        </div>
    );
}

export default AuthModal;
