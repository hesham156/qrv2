import React from 'react';
import LandingLayout from '../../layouts/LandingLayout';
import { Check } from 'lucide-react';
import { useSEO } from '../../hooks/useSEO';

export default function Pricing() {
    useSEO("Pricing", "Simple, transparent pricing for individuals and teams.");

    const plans = [
        {
            name: "Free",
            price: "0",
            features: ["1 Digital Card", "Basic Analytics", "Unlimited Sharing"],
            cta: "Start Free",
            popular: false
        },
        {
            name: "Pro",
            price: "9",
            features: ["5 Digital Cards", "Advanced Analytics", "Lead Capture Form", "Custom Branding", "Priority Support"],
            cta: "Go Pro",
            popular: true
        },
        {
            name: "Enterprise",
            price: "Call us",
            features: ["Unlimited Cards", "Team Management", "API Access", "SSO Integration", "Dedicated Account Manager"],
            cta: "Contact Sales",
            popular: false
        }
    ];

    return (
        <LandingLayout>
            <div className="py-20 bg-slate-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h1 className="text-4xl font-bold mb-4">Simple, Transparent Pricing</h1>
                    <p className="text-slate-500 mb-16">Choose the plan that fits your needs.</p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                        {plans.map((plan, idx) => (
                            <div key={idx} className={`bg-white rounded-2xl p-8 border ${plan.popular ? 'border-blue-500 ring-4 ring-blue-500/10 shadow-xl relative' : 'border-slate-200 shadow-sm'}`}>
                                {plan.popular && <span className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-bold">Most Popular</span>}
                                <h3 className="text-xl font-bold text-slate-900 mb-2">{plan.name}</h3>
                                <div className="text-4xl font-extrabold text-slate-900 mb-6">
                                    {plan.price === 'Call us' ? plan.price : <>${plan.price}<span className="text-lg font-normal text-slate-500">/mo</span></>}
                                </div>
                                <ul className="space-y-4 mb-8 text-left">
                                    {plan.features.map((feat, i) => (
                                        <li key={i} className="flex items-center gap-3 text-slate-600">
                                            <Check size={18} className="text-green-500 flex-shrink-0" />
                                            <span>{feat}</span>
                                        </li>
                                    ))}
                                </ul>
                                <button className={`w-full py-3 rounded-xl font-bold transition-colors ${plan.popular ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>
                                    {plan.cta}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </LandingLayout>
    );
}
