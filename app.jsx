import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import { NotificationProvider, useNotification } from "./src/components/NotificationContext.jsx";
import AuthModal from "./src/components/AuthModal.jsx";
import ChatInterface from "./src/components/ChatInterface.jsx";
import PricingModal from "./src/components/PricingModal.jsx";
import { generateAIResponse } from "./utils/ai.js";
import { auth, db } from "./src/utils/firebase.js";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";

// ------------------- ERROR BOUNDARY -------------------
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-black text-white">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Something went wrong</h1>
            <button onClick={() => window.location.reload()} className="px-4 py-2 bg-white text-black rounded-lg hover:bg-gray-200 transition-colors">Reload Page</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// ------------------- MAIN APP CONTENT -------------------
function AppContent() {
  const [currentUser, setCurrentUser] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const { addNotification } = useNotification();

  // THE BRAIN: Listen for Firebase Auth changes (Firefox Redirect Fix)
  useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, async (user) => {
    try {
      if (user) {
        // 1. Immediate local state so the UI at least shows the user
        setCurrentUser({
          uid: user.uid,
          email: user.email,
          name: user.displayName || "Explorer",
          plan: "free", // Default until Firestore loads
          photoURL: user.photoURL
        });

        // 2. Try to get the pro/plus plan from Firestore
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
          const data = userSnap.data();
          setCurrentUser(prev => ({
            ...prev,
            name: data.displayName || prev.name,
            plan: data.plan || "free"
          }));
        }
        console.log("Aura User Synced");
      } else {
        setCurrentUser(null);
      }
    } catch (error) {
      console.error("Auth Sync Error:", error);
    } finally {
      // THIS IS THE KEY: Stop the loop no matter what happens
      setLoading(false); 
    }
  });

  return () => unsubscribe();
}, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      addNotification("info", "You have been logged out.", "Signed Out");
    } catch (error) {
      addNotification("error", "Logout failed. Please try again.");
    }
  };

  const handleUpgrade = async (planId) => {
    if (!currentUser) {
      setShowPricingModal(false);
      setShowAuthModal(true);
      return;
    }

    try {
      const userRef = doc(db, "users", currentUser.uid);
      await updateDoc(userRef, { plan: planId });

      setCurrentUser(prev => ({ ...prev, plan: planId }));
      setShowPricingModal(false);
      addNotification("success", `Successfully upgraded to ${planId.toUpperCase()}!`, "Plan Upgraded");
    } catch (error) {
      addNotification("error", "Failed to upgrade plan. Please contact support.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white border-t-transparent" />
      </div>
    );
  }

  return (
    <div data-name="app">
      <ChatInterface
        currentUser={currentUser}
        onOpenAuth={() => setShowAuthModal(true)}
        onOpenPricing={() => setShowPricingModal(true)}
        onLogout={handleLogout}
        generateAIResponse={generateAIResponse}
      />

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onLogin={(user) => setCurrentUser(user)}
      />

      <PricingModal
        isOpen={showPricingModal}
        onClose={() => setShowPricingModal(false)}
        currentPlan={currentUser ? currentUser.plan : "free"}
        onUpgrade={handleUpgrade}
      />
    </div>
  );
}

// ------------------- ROOT APP -------------------
function App() {
  return (
    <NotificationProvider>
      <AppContent />
    </NotificationProvider>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
