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
        <div className={`min-h-screen bg-slate-50 flex ${lang === 'ar' ? 'flex-row-reverse' : 'flex-row'}`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
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
            <div className="flex-1 flex flex-col h-screen overflow-hidden">

                {/* Top Header */}
                <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-8 shrink-0 z-10 relative">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className="lg:hidden p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                        >
                            <Menu size={24} />
                        </button>
                        <h1 className="text-xl font-bold text-slate-800">
                            {/* Dynamic Title based on View */}
                            {currentView === 'cards' && (t.dashboardTitle || 'My Cards')}
                            {currentView === 'analytics' && (t.stats || 'Analytics')}
                            {currentView === 'leads' && (t.leads || 'Leads')}
                            {currentView === 'products' && (t.productsTitle || 'Products')}
                        </h1>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Injected Header Actions */}
                        {headerActions}

                        <button
                            onClick={toggleLang}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-2 rounded-lg transition-colors font-bold text-xs uppercase"
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
