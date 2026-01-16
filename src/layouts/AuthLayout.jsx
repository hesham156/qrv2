import React from 'react';
import { Link } from 'react-router-dom';
import { Quote } from 'lucide-react';

export default function AuthLayout({ children, title, subtitle }) {
    return (
        <div className="min-h-screen flex bg-white">
            {/* Left Marketing Side */}
            <div className="hidden lg:flex flex-col justify-between w-1/2 bg-blue-600 text-white p-12 relative overflow-hidden">
                {/* Background Patterns */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-50 -translate-y-1/2 translate-x-1/2"></div>
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-600 rounded-full mix-blend-multiply filter blur-3xl opacity-50 translate-y-1/2 -translate-x-1/2"></div>

                <div className="relative z-10">
                    <Link to="/" className="text-2xl font-bold flex items-center gap-2">
                        <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-blue-600 font-bold">D</div>
                        DigiCard
                    </Link>
                </div>

                <div className="relative z-10 max-w-lg">
                    <Quote className="text-blue-300 mb-6 w-10 h-10" />
                    <h2 className="text-4xl font-bold leading-tight mb-8">
                        "DigiCard transformed how we connect. It's the modern way to do business."
                    </h2>
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-blue-400"></div>
                        <div>
                            <div className="font-bold text-lg">Sarah Johnson</div>
                            <div className="text-blue-200">Marketing Director, TechFlow</div>
                        </div>
                    </div>
                </div>

                <div className="relative z-10 text-sm text-blue-200">
                    © {new Date().getFullYear()} DigiCard Inc.
                </div>
            </div>

            {/* Right Form Side */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
                <div className="w-full max-w-md">
                    <div className="text-center mb-8 lg:text-left">
                        <Link to="/" className="lg:hidden inline-block text-2xl font-bold text-blue-600 mb-8">DigiCard</Link>
                        <h1 className="text-3xl font-bold text-slate-900 mb-2">{title}</h1>
                        <p className="text-slate-500">{subtitle}</p>
                    </div>
                    {children}
                </div>
            </div>
        </div>
    );
}
