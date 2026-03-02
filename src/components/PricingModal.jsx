import React from "react";

function PricingModal({ isOpen, onClose, currentPlan, onUpgrade }) {
    if (!isOpen) return null;

    const plans = [
        {
            id: 'free',
            name: 'Free',
            price: '$0',
            period: '/mo',
            features: [
                'Standard response speed',
                'Access to basic models',
                'Limited chat history',
                'Community support'
            ],
            cta: 'Current Plan',
            highlight: false
        },
        {
            id: 'pro',
            name: 'Pro',
            price: '$15',
            period: '/mo',
            features: [
                'Fast response speed',
                'Access to "Fast" mode',
                'Priority access during peak times',
                'Extended context window',
                'Email support'
            ],
            cta: 'Upgrade to Pro',
            highlight: true
        },
        {
            id: 'pro_plus',
            name: 'Pro+',
            price: '$30',
            period: '/mo',
            features: [
                'Ultra-fast response speed',
                'Access to "Thinking" mode',
                'Early access to new features',
                'Maximum context window',
                'Priority 24/7 support',
                'Image analysis & generation'
            ],
            cta: 'Upgrade to Pro+',
            highlight: false
        }
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in-up overflow-y-auto">
            <div className="relative w-full max-w-5xl my-auto">
                {/* Close Button */}
                <button 
                    onClick={onClose}
                    className="absolute -top-12 right-0 md:-right-8 p-2 text-gray-400 hover:text-white transition-colors"
                >
                    <div className="icon-x text-2xl"></div>
                </button>

                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Upgrade your Aura</h2>
                    <p className="text-gray-400 max-w-2xl mx-auto">
                        Unlock the full potential of artificial intelligence with our premium tiers.
                        More speed, more power, more possibilities.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {plans.map((plan) => {
                        const isCurrent = currentPlan === plan.id;

                        return (
                            <div 
                                key={plan.id}
                                className={`
                                    relative flex flex-col p-8 rounded-2xl border transition-all duration-300
                                    ${plan.highlight 
                                        ? 'bg-[#1a1a1a] border-white/20 shadow-2xl shadow-purple-900/20 scale-105 z-10' 
                                        : 'bg-[#121212] border-white/5 hover:border-white/10'}
                                `}
                            >
                                {plan.highlight && (
                                    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white text-black text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                                        Most Popular
                                    </div>
                                )}

                                <div className="mb-6">
                                    <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-4xl font-bold text-white">{plan.price}</span>
                                        <span className="text-gray-500">{plan.period}</span>
                                    </div>
                                </div>

                                <ul className="flex-1 space-y-4 mb-8">
                                    {plan.features.map((feature, idx) => (
                                        <li key={idx} className="flex items-start gap-3 text-sm text-gray-300">
                                            <div className={`mt-0.5 icon-check w-4 h-4 ${plan.highlight ? 'text-white' : 'text-gray-500'}`}></div>
                                            <span>{feature}</span>
                                        </li>
                                    ))}
                                </ul>

                                <button
                                    onClick={() => !isCurrent && onUpgrade(plan.id)}
                                    disabled={isCurrent}
                                    className={`
                                        w-full py-3 rounded-lg font-bold transition-all
                                        ${isCurrent 
                                            ? 'bg-white/10 text-gray-500 cursor-default' 
                                            : plan.highlight 
                                                ? 'bg-white text-black hover:bg-gray-200' 
                                                : 'bg-white/5 text-white hover:bg-white/10 border border-white/10'}
                                    `}
                                >
                                    {isCurrent ? 'Current Plan' : plan.cta}
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

// ✅ Export default so imports work in app.jsx
export default PricingModal;