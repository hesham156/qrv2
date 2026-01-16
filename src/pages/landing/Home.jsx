
import React from 'react';
import { Link } from 'react-router-dom';
import LandingLayout from '../../layouts/LandingLayout';
import { ArrowRight, Smartphone, Share2, BarChart3 } from 'lucide-react';
import { useSEO } from '../../hooks/useSEO';

export default function Home() {
    useSEO("Home", "Create professional digital business cards, share contact info instantly.");

    return (
        <LandingLayout>
            {/* Hero Section */}
            <section className="relative overflow-hidden pt-20 pb-32 lg:pt-32">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
                    <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 text-blue-700 px-4 py-1.5 rounded-full text-sm font-semibold mb-8 animate-fade-in-up">
                        <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                        The #1 Digital Business Card Platform
                    </div>
                    <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 tracking-tight mb-6 leading-tight">
                        Network smarter with <br />
                        <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">Digital Cards</span>
                    </h1>
                    <p className="text-xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed">
                        Create a stunning digital profile, share it instantly via QR or link,
                        and watch your connections grow. No app required for receivers.
                    </p>
                    <div className="flex flex-col sm:flex-row justify-center gap-4 mb-20">
                        <Link to="/register" className="bg-blue-600 text-white px-8 py-4 rounded-full text-lg font-bold hover:shadow-xl hover:-translate-y-1 transition-all flex items-center justify-center gap-2">
                            Create Your Card Free <ArrowRight size={20} />
                        </Link>
                        <Link to="/features" className="bg-white text-slate-700 border border-slate-200 px-8 py-4 rounded-full text-lg font-bold hover:bg-slate-50 hover:border-slate-300 transition-all">
                            How it works
                        </Link>
                    </div>

                    {/* Hero Image / Mockup */}
                    <div className="relative mx-auto max-w-5xl">
                        <div className="aspect-[16/9] bg-gradient-to-tr from-slate-100 to-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden flex items-center justify-center relative">
                            {/* Abstract placeholder for UI mockup */}
                            <div className="absolute inset-0 bg-[url('https://cdn.dribbble.com/users/1615584/screenshots/15710302/media/4c661ffca4f5df314a7966847c20c410.jpg?compress=1&resize=1600x1200')] bg-cover bg-center opacity-90"></div>
                        </div>
                        {/* Decoration blobs */}
                        <div className="absolute -top-10 -right-10 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
                        <div className="absolute -bottom-10 -left-10 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
                    </div>
                </div>
            </section>

            {/* Features Grid */}
            <section className="py-24 bg-slate-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-slate-900 mb-4">Why choose DigiCard?</h2>
                        <p className="text-slate-500 max-w-2xl mx-auto">Everything you need to leave a lasting impression and manage your professional identity.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            {
                                icon: <Smartphone className="w-8 h-8 text-blue-600" />,
                                title: "Mobile Optimized",
                                desc: "Looks perfect on any device. Your digital card behaves like a native app experience."
                            },
                            {
                                icon: <Share2 className="w-8 h-8 text-purple-600" />,
                                title: "Instant Sharing",
                                desc: "Share via QR code, link, email, or NFC. No app needed for the other person."
                            },
                            {
                                icon: <BarChart3 className="w-8 h-8 text-teal-600" />,
                                title: "Lead Analytics",
                                desc: "Track who views your card and download leads directly to your CRM."
                            }
                        ].map((feature, idx) => (
                            <div key={idx} className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                                <div className="w-14 h-14 bg-slate-50 rounded-xl flex items-center justify-center mb-6">
                                    {feature.icon}
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
                                <p className="text-slate-500 leading-relaxed">{feature.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-24 bg-blue-600 relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
                    <h2 className="text-4xl font-bold text-white mb-6">Ready to upgrade your networking?</h2>
                    <p className="text-blue-100 text-lg mb-10">Join thousands of professionals who have switched to digital business cards.</p>
                    <Link to="/register" className="bg-white text-blue-600 px-10 py-5 rounded-full text-lg font-bold hover:bg-blue-50 transition-colors shadow-xl">
                        Get Started for Free
                    </Link>
                </div>
            </section>
        </LandingLayout>
    );
}
