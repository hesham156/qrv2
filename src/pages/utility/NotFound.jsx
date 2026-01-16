import React from 'react';
import { Link } from 'react-router-dom';
import { Home, MoveLeft, SearchX, HelpCircle } from 'lucide-react';

export default function NotFound({
    title = "404",
    subtitle = "Page Not Found",
    msg = "Oops! The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.",
    code = "404_NOT_FOUND"
}) {
    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Abstract Background Shapes */}
            <div className="absolute top-0 left-0 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 -translate-x-1/2 -translate-y-1/2 animate-blob"></div>
            <div className="absolute top-0 right-0 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 translate-x-1/2 -translate-y-1/2 animate-blob animation-delay-2000"></div>
            <div className="absolute -bottom-32 left-20 w-96 h-96 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>

            <div className="relative z-10 text-center max-w-lg mx-auto">
                <div className="mb-8 relative inline-block">
                    <div className="relative z-10 bg-white p-6 rounded-3xl shadow-xl border border-slate-100 transform rotate-3 transition-transform hover:rotate-0 duration-500">
                        <SearchX size={80} className="text-blue-600" strokeWidth={1.5} />
                    </div>
                    <div className="absolute inset-0 bg-blue-600 rounded-3xl transform -rotate-3 opacity-20 scale-105"></div>
                </div>

                <h1 className="text-8xl font-black text-slate-900 mb-2 tracking-tighter">{title}</h1>
                <h2 className="text-2xl font-bold text-slate-700 mb-4">{subtitle}</h2>
                <p className="text-slate-500 mb-8 leading-relaxed">
                    {msg}
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Link
                        to="/"
                        className="flex items-center gap-2 px-8 py-3.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 active:scale-95"
                    >
                        <Home size={18} />
                        Back to Home
                    </Link>

                    <Link
                        to="/contact"
                        className="flex items-center gap-2 px-8 py-3.5 bg-white text-slate-600 border border-slate-200 rounded-xl font-bold hover:bg-slate-50 hover:text-slate-900 transition-all active:scale-95"
                    >
                        <HelpCircle size={18} />
                        Help Center
                    </Link>
                </div>
            </div>

            <div className="absolute bottom-8 text-slate-400 text-xs font-medium">
                Error Code: {code}
            </div>
        </div>
    );
}
