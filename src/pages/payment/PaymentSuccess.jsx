import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle, Loader2 } from "lucide-react";
import { getAuth } from "firebase/auth";
import { doc, updateDoc } from "firebase/firestore";
import { db, appId } from "../../config/firebase";

export default function PaymentSuccess() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const auth = getAuth();
    const [status, setStatus] = useState('processing'); // processing, success, error

    useEffect(() => {
        const sessionId = searchParams.get('session_id');
        const user = auth.currentUser;

        if (!sessionId || !user) {
            navigate('/dashboard');
            return;
        }

        const activatePlan = async () => {
            try {
                // In a real app, the Webhook handles this.
                // But for Immediate UI feedback or Serverless without Webhooks (Client-trust mode):
                // We update the plan here.
                // WARN: Secure apps should verify with backend before trusting client.

                if (user) {
                    const userRef = doc(db, 'artifacts', appId, 'users', user.uid);
                    await updateDoc(userRef, {
                        plan: 'pro',
                        subscriptionStatus: 'active',
                        subscriptionId: 'sub_mock_123'
                    });
                }

                setStatus('success');
                setTimeout(() => navigate('/dashboard'), 3000);
            } catch (e) {
                console.error(e);
                setStatus('error');
            }
        };

        activatePlan();
    }, [auth.currentUser]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
            <div className="bg-white p-8 rounded-3xl shadow-xl max-w-sm w-full text-center">
                {status === 'processing' && (
                    <>
                        <Loader2 size={48} className="text-blue-600 animate-spin mx-auto mb-4" />
                        <h2 className="text-xl font-bold text-slate-800">Verifying Payment...</h2>
                    </>
                )}
                {status === 'success' && (
                    <>
                        <div className="flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mx-auto mb-4 text-green-600">
                            <CheckCircle size={32} />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 mb-2">Payment Successful!</h2>
                        <p className="text-slate-500 mb-6">Welcome to Pro. Redirecting you to dashboard...</p>
                        <button onClick={() => navigate('/dashboard')} className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold">
                            Go to Dashboard
                        </button>
                    </>
                )}
                {status === 'error' && (
                    <>
                        <h2 className="text-xl font-bold text-red-600">Something went wrong.</h2>
                        <p className="text-slate-500 mt-2">Please contact support.</p>
                    </>
                )}
            </div>
        </div>
    );
}
