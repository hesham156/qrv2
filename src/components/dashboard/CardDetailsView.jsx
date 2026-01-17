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
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">



            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {actions.map((action) => {
                    const Icon = action.icon;
                    return (
                        <button
                            key={action.id}
                            onClick={() => onAction(action.id)}
                            className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all text-left group flex items-start gap-4"
                        >
                            <div className={`w-12 h-12 rounded-xl ${action.bg} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
                                <Icon size={24} className={action.color} />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-800 mb-1 group-hover:text-blue-600 transition-colors">
                                    {action.label}
                                </h3>
                                <p className="text-xs text-slate-500 leading-relaxed">
                                    {action.desc}
                                </p>
                            </div>
                        </button>
                    )
                })}
            </div>
        </div>
    );
}
