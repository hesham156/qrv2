import React, { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, appId } from '../../config/firebase';
import { AlertCircle, Check, ArrowRight, ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../../layouts/AuthLayout';
import { Button } from '../../components/ui/Button';
import { useSEO } from '../../hooks/useSEO';

// Plan Configuration
const plans = [
    { id: 'free', name: 'Free', price: '$0', features: ['1 Card', 'Basic Stats'] },
    { id: 'pro', name: 'Pro', price: '$9', features: ['5 Cards', 'Analytics', 'Leads'] },
    { id: 'enterprise', name: 'Enterprise', price: 'Contact', features: ['Unlimited', 'SSO', 'Priority'] },
];

export default function RegisterView({ t }) {
    useSEO("Create Account", "Join DigiCard and create your professional digital business card.");

    const [step, setStep] = useState(1); // 1: Plans, 2: Account
    const [selectedPlan, setSelectedPlan] = useState('free');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const userCred = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCred.user;

            // Save User Profile & Plan
            await setDoc(doc(db, 'artifacts', appId, 'users', user.uid), {
                email: user.email,
                plan: selectedPlan,
                createdAt: serverTimestamp(),
                subscriptionStatus: 'active' // For Free plan, it's active by default
            });

            // Navigation is handled by App.js ProtectedRoute logic automatically
        } catch (err) {
            console.error(err);
            setError('Registration failed: ' + err.message);
            setLoading(false);
        }
    };

    const renderPlanSelection = () => (
        <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-800">Select your plan</h3>
            <div className="grid gap-3">
                {plans.map((plan) => (
                    <div
                        key={plan.id}
                        onClick={() => setSelectedPlan(plan.id)}
                        className={`cursor-pointer p-4 rounded-xl border-2 transition-all flex items-center justify-between ${selectedPlan === plan.id
                            ? 'border-blue-600 bg-blue-50'
                            : 'border-slate-200 hover:border-blue-300'
                            }`}
                    >
                        <div>
                            <div className="font-bold text-slate-900">{plan.name}</div>
                            <div className="text-xs text-slate-500 mt-1">{plan.features.join(' • ')}</div>
                        </div>
                        <div className="font-bold text-slate-900">{plan.price}</div>
                    </div>
                ))}
            </div>

            <Button
                onClick={() => setStep(2)}
                className="w-full mt-4"
                size="lg"
            >
                Continue <ArrowRight size={18} className="ml-2" />
            </Button>

            <div className="mt-4 text-center">
                <Link to="/login" className="text-sm text-slate-500 hover:text-slate-800">
                    Already have an account? Log in
                </Link>
            </div>
        </div>
    );

    const renderAccountForm = () => (
        <form onSubmit={handleSubmit} className="space-y-4">
            <button
                type="button"
                onClick={() => setStep(1)}
                className="text-sm text-slate-500 flex items-center gap-1 hover:text-slate-800 mb-2"
            >
                <ArrowLeft size={16} /> Back to plans
            </button>

            <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Email Address</label>
                <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    placeholder="name@company.com"
                />
            </div>
            <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Password</label>
                <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    placeholder="Create a password"
                    minLength={6}
                />
                <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                    <Check size={12} className="text-green-500" /> Must be at least 6 characters
                </p>
            </div>

            <Button
                type="submit"
                isLoading={loading}
                className="w-full"
                size="lg"
            >
                Create Account
            </Button>
        </form>
    );

    return (
        <AuthLayout
            title={step === 1 ? "Choose a plan" : "Create Account"}
            subtitle={step === 1 ? "Select the package that suits you best" : `You selected the ${plans.find(p => p.id === selectedPlan).name} plan`}
        >
            {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-6 text-sm flex items-center gap-2">
                    <AlertCircle size={16} />
                    {error}
                </div>
            )}

            {step === 1 ? renderPlanSelection() : renderAccountForm()}

            <div className="mt-8 pt-8 border-t border-slate-100 text-center text-xs text-slate-400">
                By creating an account, you agree to our <a href="#" className="underline">Terms</a> and <a href="#" className="underline">Privacy Policy</a>.
            </div>
        </AuthLayout>
    );
}
