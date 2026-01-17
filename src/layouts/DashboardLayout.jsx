import React, { useState } from 'react';
import Sidebar from '../components/dashboard/Sidebar';
import { Menu } from 'lucide-react';

export default function DashboardLayout({
    children,
    currentView,
    setCurrentView,
    user,
    onLogout,
    t,
    lang,
    toggleLang,
    onOpenSettings,
    headerActions // New prop for injecting buttons into header
}) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div className={`min-h-screen bg-slate-50/50 flex flex-row`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
            {/* Sidebar */}
            <Sidebar
                currentView={currentView}
                setCurrentView={setCurrentView}
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
                onLogout={onLogout}
                user={user}
                t={t}
                lang={lang}
                onOpenSettings={onOpenSettings}
            />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col h-screen overflow-hidden relative">

                {/* Top Header */}
                <header className="h-20 bg-slate-50/50 backdrop-blur-md flex items-center justify-between px-6 lg:px-10 shrink-0 z-10 relative border-b border-transparent sticky top-0">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className="lg:hidden p-2 -ml-2 text-slate-600 hover:bg-white hover:shadow-soft rounded-lg transition-all"
                        >
                            <Menu size={24} />
                        </button>

                        <div>
                            <h1 className="text-2xl font-black text-slate-800 tracking-tight">
                                {/* Dynamic Title based on View */}
                                {currentView === 'cards' && (t.dashboardTitle || 'My Cards')}
                                {currentView === 'analytics' && (t.stats || 'Analytics')}
                                {currentView === 'leads' && (t.leads || 'Leads')}
                                {currentView === 'products' && (t.productsTitle || 'Products')}
                            </h1>
                            <p className="text-sm text-slate-500 font-medium hidden sm:block">
                                {t.welcomeBack || 'Welcome back,'} {user?.email?.split('@')[0]}
                            </p>
                        </div>

                    </div>

                    <div className="flex items-center gap-3">
                        {/* Injected Header Actions */}
                        {headerActions}

                        <button
                            onClick={toggleLang}
                            className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 px-4 py-2.5 rounded-xl transition-all font-bold text-xs uppercase shadow-sm hover:shadow-md"
                        >
                            {lang === "ar" ? "EN" : "AR"}
                        </button>
                    </div>
                </header>

                {/* Scrollable Content */}
                <main className="flex-1 overflow-y-auto p-4 lg:p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}
