import React from 'react';
import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';

export default function LandingLayout({ children }) {
    const [isMenuOpen, setIsMenuOpen] = React.useState(false);

    return (
        <div className="min-h-screen bg-white">
            {/* Navigation */}
            <header className="fixed w-full bg-white/90 backdrop-blur-md z-50 border-b border-slate-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
                            D
                        </div>
                        <span className="text-xl font-bold bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent">
                            DigiCard
                        </span>
                    </Link>

                    {/* Desktop Nav */}
                    <nav className="hidden md:flex items-center gap-8">
                        <Link to="/" className="text-slate-600 hover:text-blue-600 font-medium transition-colors">Home</Link>
                        <Link to="/features" className="text-slate-600 hover:text-blue-600 font-medium transition-colors">Features</Link>
                        <Link to="/pricing" className="text-slate-600 hover:text-blue-600 font-medium transition-colors">Pricing</Link>
                        <Link to="/contact" className="text-slate-600 hover:text-blue-600 font-medium transition-colors">Contact</Link>
                    </nav>

                    <div className="hidden md:flex items-center gap-4">
                        <Link to="/login" className="text-slate-600 hover:text-slate-900 font-bold transition-colors">
                            Log in
                        </Link>
                        <Link
                            to="/register"
                            className="bg-blue-600 text-white px-5 py-2.5 rounded-full font-bold hover:bg-blue-700 transition-all hover:shadow-lg hover:-translate-y-0.5"
                        >
                            Get Started
                        </Link>
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        className="md:hidden p-2 text-slate-600"
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                    >
                        {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>

                {/* Mobile Nav */}
                {isMenuOpen && (
                    <div className="md:hidden absolute top-16 left-0 w-full bg-white border-b border-slate-100 p-4 flex flex-col gap-4 shadow-xl">
                        <Link to="/" className="text-lg font-medium text-slate-700">Home</Link>
                        <Link to="/features" className="text-lg font-medium text-slate-700">Features</Link>
                        <Link to="/pricing" className="text-lg font-medium text-slate-700">Pricing</Link>
                        <Link to="/contact" className="text-lg font-medium text-slate-700">Contact</Link>
                        <hr className="border-slate-100" />
                        <Link to="/login" className="text-lg font-medium text-slate-700">Log in</Link>
                        <Link to="/register" className="bg-blue-600 text-white text-center py-3 rounded-xl font-bold">
                            Get Started
                        </Link>
                    </div>
                )}
            </header>

            <main className="pt-16">
                {children}
            </main>

            <footer className="bg-slate-900 text-slate-300 py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
                    <div>
                        <div className="text-white font-bold text-xl mb-4">DigiCard</div>
                        <p className="text-sm text-slate-400">
                            The smartest way to share your contact information.
                            Digital, eco-friendly, and always up-to-date.
                        </p>
                    </div>
                    <div>
                        <h4 className="text-white font-bold mb-4">Product</h4>
                        <ul className="space-y-2 text-sm">
                            <li><Link to="/features" className="hover:text-white">Features</Link></li>
                            <li><Link to="/pricing" className="hover:text-white">Pricing</Link></li>
                            <li><Link to="/enterprise" className="hover:text-white">Enterprise</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="text-white font-bold mb-4">Resources</h4>
                        <ul className="space-y-2 text-sm">
                            <li><Link to="/blog" className="hover:text-white">Blog</Link></li>
                            <li><Link to="/help" className="hover:text-white">Help Center</Link></li>
                            <li><Link to="/api" className="hover:text-white">API</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="text-white font-bold mb-4">Legal</h4>
                        <ul className="space-y-2 text-sm">
                            <li><Link to="/privacy" className="hover:text-white">Privacy</Link></li>
                            <li><Link to="/terms" className="hover:text-white">Terms</Link></li>
                        </ul>
                    </div>
                </div>
                <div className="max-w-7xl mx-auto px-4 mt-12 pt-8 border-t border-slate-800 text-center text-sm text-slate-500">
                    © {new Date().getFullYear()} DigiCard. All rights reserved.
                </div>
            </footer>
        </div>
    );
}
