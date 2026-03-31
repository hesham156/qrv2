import React from 'react';
import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';

export default function LandingLayout({ children, lang, toggleLang, t }) {
    const [isMenuOpen, setIsMenuOpen] = React.useState(false);

    // Provide default fallback translation if 't' is not provided from some pages temporarily
    const tr = t || {
        navHome: 'Home', navFeatures: 'Features', navPricing: 'Pricing', navContact: 'Contact', navLogin: 'Log in', navGetStarted: 'Get Started',
        footerDesc: 'The smartest way to share your contact information. Digital, eco-friendly, and always up-to-date.',
        footerProduct: 'Product', footerResources: 'Resources', footerLegal: 'Legal', footerEnterprise: 'Enterprise',
        footerBlog: 'Blog', footerHelp: 'Help Center', footerPrivacy: 'Privacy Policy', footerTerms: 'Terms of Service',
        systemCopyright: 'Get In Click. All rights reserved.'
    };

    return (
        <div className="min-h-screen bg-slate-50 selection:bg-blue-600 selection:text-white" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
            {/* Navigation */}
            <header className="fixed w-full bg-white/95 backdrop-blur-xl z-50 border-b border-slate-100/50 shadow-sm transition-all duration-300">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-[72px] flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
                            D
                        </div>
                        <span className="text-xl font-bold bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent">
                            Get In Click
                        </span>
                    </Link>

                    {/* Desktop Nav */}
                    <nav className="hidden md:flex items-center gap-8">
                        <Link to="/" className="text-[15px] font-bold text-slate-600 hover:text-blue-600 transition-colors uppercase tracking-wider">{tr.navHome}</Link>
                        <Link to="/features" className="text-[15px] font-bold text-slate-600 hover:text-blue-600 transition-colors uppercase tracking-wider">{tr.navFeatures}</Link>
                        <Link to="/pricing" className="text-[15px] font-bold text-slate-600 hover:text-blue-600 transition-colors uppercase tracking-wider">{tr.navPricing}</Link>
                        <Link to="/contact" className="text-[15px] font-bold text-slate-600 hover:text-blue-600 transition-colors uppercase tracking-wider">{tr.navContact}</Link>
                    </nav>

                    <div className="hidden md:flex items-center gap-5">
                        {toggleLang && (
                            <button
                                onClick={toggleLang}
                                className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors border border-slate-200"
                            >
                                {lang === 'ar' ? 'En' : 'ع'}
                            </button>
                        )}
                        <Link to="/login" className="text-[15px] text-slate-600 hover:text-slate-900 font-bold transition-colors">
                            {tr.navLogin}
                        </Link>
                        <Link
                            to="/register"
                            className="bg-slate-900 text-white px-6 py-2.5 rounded-full font-bold hover:bg-blue-600 transition-all hover:shadow-[0_4px_20px_rgba(37,99,235,0.3)] hover:-translate-y-0.5"
                        >
                            {tr.navGetStarted}
                        </Link>
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="md:hidden flex items-center gap-3">
                        {toggleLang && (
                            <button
                                onClick={toggleLang}
                                className="w-9 h-9 flex items-center justify-center rounded-full bg-slate-100 text-slate-700 font-bold text-xs border border-slate-200"
                            >
                                {lang === 'ar' ? 'En' : 'ع'}
                            </button>
                        )}
                        <button
                            className="p-2 text-slate-600 bg-slate-50 rounded-lg hover:bg-slate-100"
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                        >
                            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>

                {/* Mobile Nav */}
                <div className={`md:hidden absolute top-[72px] left-0 w-full bg-white border-b border-slate-100 p-5 flex flex-col gap-4 shadow-xl transition-all duration-300 origin-top ${isMenuOpen ? 'scale-y-100 opacity-100 visible' : 'scale-y-0 opacity-0 invisible'}`}>
                    <Link to="/" className="text-lg font-bold text-slate-700 hover:text-blue-600">{tr.navHome}</Link>
                    <Link to="/features" className="text-lg font-bold text-slate-700 hover:text-blue-600">{tr.navFeatures}</Link>
                    <Link to="/pricing" className="text-lg font-bold text-slate-700 hover:text-blue-600">{tr.navPricing}</Link>
                    <Link to="/contact" className="text-lg font-bold text-slate-700 hover:text-blue-600">{tr.navContact}</Link>
                    <hr className="border-slate-100 my-2" />
                    <Link to="/login" className="text-lg font-bold text-slate-700">{tr.navLogin}</Link>
                    <Link to="/register" className="bg-slate-900 text-white text-center py-4 px-6 rounded-xl font-bold hover:bg-blue-600 transition-colors">
                        {tr.navGetStarted}
                    </Link>
                </div>
            </header>

            <main className="pt-[72px]">
                {children}
            </main>

            <footer className="bg-[#0b1120] text-slate-300 py-16 border-t border-slate-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-12">
                    <div className="col-span-1 md:col-span-1">
                        <div className="text-white font-black text-2xl mb-4 tracking-tight flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-sm">D</div>
                            Get In Click
                        </div>
                        <p className="text-sm text-slate-400 leading-relaxed pe-4">
                            {tr.footerDesc}
                        </p>
                    </div>
                    <div>
                        <h4 className="text-white font-bold mb-6 uppercase tracking-widest text-xs">{tr.footerProduct}</h4>
                        <ul className="space-y-3 text-sm font-medium">
                            <li><Link to="/features" className="text-slate-400 hover:text-white transition-colors">{tr.navFeatures}</Link></li>
                            <li><Link to="/pricing" className="text-slate-400 hover:text-white transition-colors">{tr.navPricing}</Link></li>
                            <li><Link to="/enterprise" className="text-slate-400 hover:text-white transition-colors">{tr.footerEnterprise}</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="text-white font-bold mb-6 uppercase tracking-widest text-xs">{tr.footerResources}</h4>
                        <ul className="space-y-3 text-sm font-medium">
                            <li><Link to="/blog" className="text-slate-400 hover:text-white transition-colors">{tr.footerBlog}</Link></li>
                            <li><Link to="/help" className="text-slate-400 hover:text-white transition-colors">{tr.footerHelp}</Link></li>
                            <li><a href="#" className="text-slate-400 hover:text-white transition-colors">API</a></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="text-white font-bold mb-6 uppercase tracking-widest text-xs">{tr.footerLegal}</h4>
                        <ul className="space-y-3 text-sm font-medium">
                            <li><Link to="/privacy" className="text-slate-400 hover:text-white transition-colors">{tr.footerPrivacy}</Link></li>
                            <li><Link to="/terms" className="text-slate-400 hover:text-white transition-colors">{tr.footerTerms}</Link></li>
                        </ul>
                    </div>
                </div>
                <div className="max-w-7xl mx-auto px-4 mt-16 pt-8 border-t border-slate-800/50 flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-bold text-slate-500 uppercase tracking-widest">
                    <span>© {new Date().getFullYear()} {tr.systemCopyright}</span>
                    <div className="flex gap-4">
                        <Link to="/privacy" className="hover:text-slate-300 transition-colors">{tr.footerPrivacy}</Link>
                        <Link to="/terms" className="hover:text-slate-300 transition-colors">{tr.footerTerms}</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
