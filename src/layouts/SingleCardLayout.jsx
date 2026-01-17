import React from 'react';
import { NavLink, Outlet, useParams, Link } from 'react-router-dom';
import {
    LayoutDashboard,
    Edit,
    Search,
    ShoppingBag,
    CircleDashed,
    Briefcase,
    BarChart3,
    Users,
    CalendarCheck,
    ArrowLeft,
    ChevronLeft,
    ChevronRight,
    ArrowRight,
    Eye,
    LogOut,
    Languages,
    UserCircle
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function SingleCardLayout({ t, lang, employee, user, onLogout, toggleLang }) {
    const { cardId } = useParams();
    const isRTL = lang === 'ar';

    const menuItems = [
        { id: 'overview', label: t.overview || 'Overview', icon: LayoutDashboard, path: `/dashboard/card/${cardId}` },
        { id: 'edit', label: t.editData || 'Edit Details', icon: Edit, path: `/dashboard/card/${cardId}/edit` },
        { id: 'seo', label: 'SEO Settings', icon: Search, path: `/dashboard/card/${cardId}/seo` },
        { id: 'booking', label: t.bookingAvailability || 'Booking', icon: CalendarCheck, path: `/dashboard/card/${cardId}/booking` },
        { id: 'products', label: t.manageProducts || 'Products', icon: ShoppingBag, path: `/dashboard/card/${cardId}/products` },
        { id: 'stories', label: t.manageStories || 'Stories', icon: CircleDashed, path: `/dashboard/card/${cardId}/stories` },
        { id: 'portfolio', label: t.managePortfolio || 'Portfolio', icon: Briefcase, path: `/dashboard/card/${cardId}/portfolio` },
        { id: 'analytics', label: t.stats || 'Analytics', icon: BarChart3, path: `/dashboard/card/${cardId}/analytics` },
        { id: 'leads', label: t.leads || 'Leads', icon: Users, path: `/dashboard/card/${cardId}/leads` },
    ];

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            {/* GLOBAL HEADER */}
            <header className="sticky top-0 z-40 bg-white border-b border-slate-200 px-4 h-16 flex items-center justify-between shadow-sm shrink-0">

                {/* Left: Branding & Back */}
                <div className="flex items-center gap-4">
                    <Link to="/dashboard" className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors font-bold text-sm bg-slate-50 hover:bg-slate-100 px-3 py-2 rounded-lg">
                        {isRTL ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
                        {t.backToDashboard || "Back to Cards"}
                    </Link>
                    <div className="h-6 w-px bg-slate-200 mx-2 hidden sm:block"></div>
                    <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent hidden sm:block">
                        Muayana
                    </h1>
                </div>

                {/* Right: User & Actions */}
                <div className="flex items-center gap-3">
                    {/* Lang Toggle */}
                    <button
                        onClick={toggleLang}
                        className="p-2 text-slate-500 hover:bg-slate-50 rounded-lg transition-colors"
                        title="Change Language"
                    >
                        <Languages size={20} />
                    </button>

                    {/* User Profile */}
                    <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-100">
                        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500">
                            {user?.photoURL ?
                                <img src={user.photoURL} alt="User" className="w-full h-full rounded-full object-cover" />
                                : <UserCircle size={18} />
                            }
                        </div>
                        <span className="text-sm font-medium text-slate-700 truncate max-w-[100px]">
                            {user?.displayName || 'User'}
                        </span>
                    </div>

                    {/* Logout */}
                    <button
                        onClick={onLogout}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
                        title={t.logout || "Logout"}
                    >
                        <LogOut size={20} />
                    </button>
                </div>
            </header>

            <div className="flex flex-col md:flex-row min-h-[calc(100vh-80px)] gap-6 p-6 max-w-7xl mx-auto w-full">
                {/* Sidebar */}
                <motion.aside
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="w-full md:w-64 shrink-0 space-y-2 bg-white rounded-2xl border border-slate-200 p-4 shadow-sm h-fit self-start sticky top-24"
                >
                    {/* Removed Back Link from Sidebar as it's now in Header */}

                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        return (
                            <NavLink
                                key={item.id}
                                to={item.path}
                                end={item.id === 'overview'}
                                className={({ isActive }) => `
                flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm
                ${isActive
                                        ? 'bg-slate-900 text-white shadow-md'
                                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                                    }
              `}
                            >
                                <Icon size={18} />
                                <span>{item.label}</span>
                            </NavLink>
                        );
                    })}
                </motion.aside>

                {/* Content Area */}
                <motion.main
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex-1 min-w-0"
                >
                    {/* Fixed Header in Layout (Card Title) */}
                    <div className="flex items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6">
                        <div className="flex-1">
                            <h2 className="text-lg font-bold text-slate-800">{employee?.name || employee?.name_en || 'Untitled Card'}</h2>
                            <p className="text-sm text-slate-500">{employee?.jobTitle || 'No Title'}</p>
                        </div>

                        <button
                            onClick={() => window.open(`/${employee?.slug || employee?.id}`, '_blank')}
                            className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-bold shadow hover:bg-slate-800 transition-colors"
                        >
                            <Eye size={16} />
                            <span className="hidden sm:inline">{t.preview || 'Preview'}</span>
                        </button>
                    </div>

                    <Outlet />
                </motion.main>
            </div>
        </div>

    );
}
