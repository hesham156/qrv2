import React from 'react';
import {
    ArrowRight,
    Edit2,
    ShoppingBag,
    CircleDashed,
    Briefcase,
    BarChart3,
    Users,
    QrCode,
    Eye,
    ExternalLink,
    ChevronRight,
    ChevronLeft
} from 'lucide-react';

export default function CardDetailsView({ employee, onBack, t, lang, onAction }) {
    const isRTL = lang === 'ar';

    const actions = [
        {
            id: 'edit',
            label: t.editData || 'Edit Details',
            desc: t.editDataDesc || 'Update names, contact info, and design.',
            icon: Edit2,
            color: 'text-blue-600',
            bg: 'bg-blue-50'
        },
        {
            id: 'products',
            label: t.manageProducts || 'Products',
            desc: t.manageProductsDesc || 'Add or edit products/services.',
            icon: ShoppingBag,
            color: 'text-indigo-600',
            bg: 'bg-indigo-50'
        },
        {
            id: 'stories',
            label: t.manageStories || 'Stories',
            desc: t.manageStoriesDesc || 'Share updates and news.',
            icon: CircleDashed,
            color: 'text-pink-600',
            bg: 'bg-pink-50'
        },
        {
            id: 'portfolio',
            label: t.managePortfolio || 'Portfolio',
            desc: t.managePortfolioDesc || 'Showcase your work gallery.',
            icon: Briefcase,
            color: 'text-teal-600',
            bg: 'bg-teal-50'
        },
        {
            id: 'analytics',
            label: t.stats || 'Analytics',
            desc: t.statsDesc || 'View visitors and clicks.',
            icon: BarChart3,
            color: 'text-orange-600',
            bg: 'bg-orange-50'
        },
        {
            id: 'leads',
            label: t.leads || 'Leads',
            desc: t.leadsDesc || 'Manage form submissions.',
            icon: Users,
            color: 'text-green-600',
            bg: 'bg-green-50'
        },
        {
            id: 'qr',
            label: t.code || 'QR Code',
            desc: t.codeDesc || 'Download your QR code.',
            icon: QrCode,
            color: 'text-purple-600',
            bg: 'bg-purple-50'
        },
    ];

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-7xl mx-auto">

            <div className="flex items-center gap-2 text-sm text-slate-500 mb-6">
                <button onClick={onBack} className="hover:text-slate-800 transition-colors font-medium">
                    {t.dashboardTitle || 'Dashboard'}
                </button>
                <div className={`w-1 h-1 rounded-full bg-slate-300`} />
                <span className="text-slate-800 font-bold truncate max-w-[200px]">
                    {employee?.name_en || employee?.name_ar || 'Card Details'}
                </span>
            </div>

            <div className="flex items-start justify-between">
                <div>
                    <h2 className="text-3xl font-black text-slate-800 tracking-tight mb-2">
                        {t.manageCard || 'Manage Card'}
                    </h2>
                    <p className="text-slate-500">
                        {t.manageCardSub || 'Update your card content, design, and settings.'}
                    </p>
                </div>
                <div className="flex gap-2">
                    <a
                        href={`/p/${employee?.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl font-bold text-sm shadow-sm hover:shadow-md hover:border-brand-200 hover:text-brand-600 transition-all"
                    >
                        <ExternalLink size={16} />
                        {t.viewLive || "View Live"}
                    </a>
                </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {actions.map((action) => {
                    const Icon = action.icon;
                    return (
                        <button
                            key={action.id}
                            onClick={() => onAction(action.id)}
                            className="bg-white p-6 rounded-3xl border border-slate-100 shadow-soft hover:shadow-soft-lg hover:border-slate-200 hover:-translate-y-1 transition-all text-left group flex flex-col h-full"
                        >
                            <div className={`w-14 h-14 rounded-2xl ${action.bg} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-sm`}>
                                <Icon size={26} className={action.color} strokeWidth={2} />
                            </div>

                            <h3 className="font-bold text-lg text-slate-800 mb-2 group-hover:text-brand-600 transition-colors">
                                {action.label}
                            </h3>
                            <p className="text-sm text-slate-500 leading-relaxed mb-4 flex-1">
                                {action.desc}
                            </p>

                            <div className={`flex items-center gap-2 text-xs font-bold uppercase tracking-wider ${action.color} opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300`}>
                                {t.open || 'Open'}
                                {isRTL ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
                            </div>
                        </button>
                    )
                })}
            </div>
        </div>
    );
}
