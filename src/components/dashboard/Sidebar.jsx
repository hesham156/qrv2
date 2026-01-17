import React from 'react';
import {
    CreditCard,
    BarChart2,
    Users,
    ShoppingBag,
    Settings,
    LogOut,
    X,
    LayoutDashboard,
    Shield,
    ClipboardList
} from 'lucide-react';

export default function Sidebar({
    currentView,
    setCurrentView,
    isOpen,
    onClose,
    onLogout,
    user,
    t,
    onOpenSettings,
    lang
}) {

    const menuItems = [
        { id: 'cards', label: t.dashboardTitle || 'My Cards', icon: CreditCard },
        { id: 'analytics', label: t.stats || 'Analytics', icon: BarChart2 },
        { id: 'leads', label: t.leads || 'Leads', icon: Users },
        { id: 'tasks', label: t.tasks || 'Tasks', icon: ClipboardList },
        { id: 'products', label: t.productsTitle || 'Products', icon: ShoppingBag },
    ];

    if (user?.role === 'super_admin') {
        menuItems.push({ id: 'admin', label: t.platformAdmin || 'Platform Admin', icon: Shield });
    }

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/20 z-40 lg:hidden backdrop-blur-sm transition-opacity"
                    onClick={onClose}
                />
            )}

            {/* Sidebar Container */}
            <div className={`
        fixed top-0 bottom-0 ${lang === 'ar' ? 'right-0 border-l' : 'left-0 border-r'} w-72 bg-white z-50 
        transform transition-transform duration-300 ease-in-out shadow-2xl lg:shadow-none border-slate-100
        lg:translate-x-0 lg:static lg:h-screen
        ${isOpen ? 'translate-x-0' : (lang === 'ar' ? 'translate-x-full' : '-translate-x-full')}
      `}>

                {/* Logo Area */}
                <div className="h-20 flex items-center justify-between px-8">
                    <div className="flex items-center gap-3 font-bold text-2xl tracking-tight text-slate-800">
                        <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-brand-200">
                            <LayoutDashboard size={22} strokeWidth={2.5} />
                        </div>
                        <span>DigiCard</span>
                    </div>
                    <button onClick={onClose} className="lg:hidden text-slate-400 hover:text-slate-600 transition-colors bg-slate-50 p-2 rounded-lg">
                        <X size={20} />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="p-4 space-y-1">
                    <p className="px-4 text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">{t.menu || 'Menu'}</p>
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = currentView === item.id;

                        return (
                            <button
                                key={item.id}
                                onClick={() => {
                                    setCurrentView(item.id);
                                    onClose(); // Close sidebar on mobile after selection
                                }}
                                className={`w-full flex items-center gap-3.5 px-4 py-3.5 rounded-xl transition-all duration-200 font-bold text-sm group relative overflow-hidden ${isActive
                                    ? 'bg-brand-50 text-brand-600 shadow-sm'
                                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                                    }`}
                            >
                                {isActive && (
                                    <div className={`absolute top-0 bottom-0 ${lang === 'ar' ? 'right-0' : 'left-0'} w-1 bg-brand-600 rounded-full`} />
                                )}
                                <Icon size={22} className={isActive ? 'text-brand-600' : 'text-slate-400 group-hover:text-slate-600'} strokeWidth={isActive ? 2.5 : 2} />
                                <span>{item.label}</span>
                            </button>
                        );
                    })}
                </nav>

                {/* Bottom Section (User Profile) */}
                <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-slate-50 bg-white">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-bold shrink-0 border-2 border-white shadow-soft">
                            {user?.email?.[0].toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-slate-800 truncate">{user?.email}</p>
                            <p className="text-xs text-slate-400 truncate font-medium">{t.freePlan || 'Free Plan'}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <button
                            onClick={onOpenSettings}
                            className="flex items-center justify-center gap-2 py-2.5 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-600 text-xs font-bold transition-all"
                        >
                            <Settings size={14} />
                            {t.settings || 'Settings'}
                        </button>
                        <button
                            onClick={onLogout}
                            className="flex items-center justify-center gap-2 py-2.5 rounded-lg border border-red-100 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold transition-all"
                        >
                            <LogOut size={14} />
                            {t.logout || 'Logout'}
                        </button>
                    </div>
                </div>

            </div>
        </>
    );
}
