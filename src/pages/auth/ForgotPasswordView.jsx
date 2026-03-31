import React, { useState } from 'react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../../config/firebase';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSEO } from '../../hooks/useSEO';
import AuthLayout from '../../layouts/AuthLayout';

export default function ForgotPasswordView({ lang, toggleLang, t }) {
  useSEO(t?.forgotPasswordTitle || "Forgot Password", "Reset your DigiCard dashboard password.");

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      await sendPasswordResetEmail(auth, email);
      setSuccess(true);
    } catch (err) {
      console.error(err);
      if (err.code === 'auth/user-not-found') {
        setError('No account found with this email.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Please enter a valid email address.');
      } else {
        setError('Failed to send reset email. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Reset Password" subtitle="Enter your email to receive a reset link">
      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-6 text-sm flex items-center gap-2">
          <AlertCircle size={16} />
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-50 text-green-600 p-3 rounded-lg mb-6 text-sm flex items-center gap-2">
          <CheckCircle size={16} />
          Password reset link sent! Please check your email inbox (and spam folder).
        </div>
      )}

      {!success && (
        <form onSubmit={handleSubmit} className="space-y-4">
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
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl transition-all hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-70 disabled:hover:translate-y-0 flex items-center justify-center mt-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              "Send Reset Link"
            )}
          </button>
        </form>
      )}

      <div className="mt-8 text-center">
        <p className="text-slate-500">
          Remembered your password?{' '}
          <Link to="/login" className="text-blue-600 font-bold hover:underline">
            Back to Sign in
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
