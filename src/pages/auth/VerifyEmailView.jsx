import React, { useState } from 'react';
import { sendEmailVerification } from 'firebase/auth';
import { auth } from '../../config/firebase';
import { Button } from '../../components/ui/Button';
import { Mail, RefreshCw, LogOut } from 'lucide-react';

export default function VerifyEmailView() {
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const handleResend = async () => {
        setLoading(true);
        setMessage('');
        try {
            if (auth.currentUser) {
                await sendEmailVerification(auth.currentUser);
                setMessage('Verification email sent! Please check your inbox.');
            }
        } catch (error) {
            console.error(error);
            setMessage('Error sending email: ' + error.message);
        }
        setLoading(false);
    };

    const handleReload = () => {
        window.location.reload();
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
                <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Mail size={32} />
                </div>

                <h1 className="text-2xl font-bold text-slate-900 mb-2">Verify your Email</h1>
                <p className="text-slate-600 mb-8">
                    We've sent a verification link to <b>{auth.currentUser?.email}</b>.<br />
                    Please verify your email address to access the dashboard.
                </p>

                <div className="space-y-3">
                    <Button
                        onClick={handleResend}
                        isLoading={loading}
                        variant="outline"
                        className="w-full"
                    >
                        Resend Verification Email
                    </Button>

                    <Button
                        onClick={handleReload}
                        className="w-full"
                    >
                        <RefreshCw size={18} className="mr-2" />
                        I've Verified My Email
                    </Button>

                    <button
                        onClick={() => auth.signOut()}
                        className="text-slate-400 text-xs hover:text-slate-600 flex items-center justify-center mx-auto gap-1 mt-6"
                    >
                        <LogOut size={12} /> Sign Out (Change Account)
                    </button>

                    {message && (
                        <div className="text-sm text-green-600 bg-green-50 p-2 rounded mt-4">
                            {message}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
