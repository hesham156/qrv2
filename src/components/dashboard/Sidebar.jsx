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
    Shield
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
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
                    onClick={onClose}
                />
            )}

            {/* Sidebar Container */}
            <div className={`
        fixed top-0 bottom-0 ${lang === 'ar' ? 'right-0' : 'left-0'} w-64 bg-slate-900 text-white z-50 
        transform transition-transform duration-300 ease-in-out shadow-xl
        lg:translate-x-0 lg:static lg:h-screen lg:shadow-none
        ${isOpen ? 'translate-x-0' : (lang === 'ar' ? 'translate-x-full' : '-translate-x-full')}
      `}>

                {/* Logo Area */}
                <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800">
                    <div className="flex items-center gap-2 font-bold text-xl">
                        <LayoutDashboard className="text-blue-500" />
                        <span>DigiCard</span>
                    </div>
                    <button onClick={onClose} className="lg:hidden text-slate-400 hover:text-white">
                        <X size={24} />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="p-4 space-y-2">
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
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium ${isActive
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50'
                                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                    }`}
                            >
                                <Icon size={20} />
                                <span>{item.label}</span>
                            </button>
                        );
                    })}
                </nav>

                {/* Bottom Section (User Profile) */}
                <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-800 bg-slate-900">
                    <div className="bg-slate-800 rounded-xl p-3 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold shrink-0">
                            {user?.email?.[0].toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-white truncate">{user?.email}</p>
                            <p className="text-xs text-slate-400 truncate">{t.admin || 'Admin'}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-3">
                        <button
                            onClick={onOpenSettings}
                            className="flex items-center justify-center gap-2 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold transition-colors"
                        >
                            <Settings size={14} />
                            {t.settingsTitle?.split(' ')[0] || 'Settings'}
                        </button>
                        <button
                            onClick={onLogout}
                            className="flex items-center justify-center gap-2 py-2 rounded-lg bg-red-900/20 hover:bg-red-900/40 text-red-400 hover:text-red-300 text-xs font-bold transition-colors"
                        >
                            <LogOut size={14} />
                            {t.logout}
                        </button>
                    </div>
                </div>

            </div>
        </>
    );
}
