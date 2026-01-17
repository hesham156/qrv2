import React from 'react';
import {
  Edit3,
  Trash2,
  Building2,
  User,
  Activity,
  MousePointer2,
  Eye,
  Settings,
  MoreVertical,
  QrCode,
  Share2
} from 'lucide-react';

export default function EmployeeCard({
  employee,
  onDelete,
  onEdit,
  onShowQR,
  onShowAnalytics,
  onShowLeads,
  onPreview,
  onManageProducts,
  onManageStories,
  onManagePortfolio,
  onManage,
  t,
  lang
}) {
  const L = (lang || 'ar').toLowerCase() === 'en' ? 'en' : 'ar';

  const toText = (v) => {
    if (v == null) return '';
    if (typeof v === 'string' || typeof v === 'number') return String(v);
    if (typeof v === 'object') return String(v?.[L] ?? v?.ar ?? v?.en ?? '');
    return '';
  };

  const pick = (arField, enField, legacyField) => {
    const ar = toText(arField);
    const en = toText(enField);
    const legacy = toText(legacyField);
    if (L === 'en') return en || legacy || ar || '';
    return ar || legacy || en || '';
  };

  const isCompany = employee?.profileType === 'company';
  const themeColor = employee?.themeColor || '#0284c7'; // Default to brand-600
  const views = employee?.stats?.views || 0;

  const nameText = pick(employee?.name_ar, employee?.name_en, employee?.name);
  const jobTitleText = pick(employee?.jobTitle_ar, employee?.jobTitle_en, employee?.jobTitle);

  const totalClicks = Object.values(employee?.stats?.clicks || {}).reduce(
    (a, b) => a + (Number(b) || 0),
    0
  );

  return (
    <div className="bg-white rounded-3xl shadow-soft hover:shadow-soft-lg hover:-translate-y-1 transition-all duration-300 border border-slate-100 flex flex-col group h-full">
      {/* Top Banner / Color Strip (Optional, good for differentiation) */}
      <div
        className="h-2 w-full rounded-t-3xl opacity-80"
        style={{ backgroundColor: themeColor }}
      />

      <div className="p-6 flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              {employee?.photoUrl ? (
                <img
                  src={employee.photoUrl}
                  alt={nameText}
                  className={`w-14 h-14 object-cover shadow-sm ${isCompany ? 'rounded-xl' : 'rounded-full'}`}
                  style={{ border: `2px solid ${themeColor}20` }}
                />
              ) : (
                <div
                  className={`w-14 h-14 flex items-center justify-center text-xl font-bold text-white shadow-sm ${isCompany ? 'rounded-xl' : 'rounded-full'}`}
                  style={{ backgroundColor: themeColor }}
                >
                  {isCompany ? <Building2 size={24} /> : (nameText ? String(nameText).charAt(0) : '?')}
                </div>
              )}
              <div className={`absolute -bottom-1 -right-1 w-6 h-6 flex items-center justify-center rounded-full border-2 border-white text-white text-[10px] ${isCompany ? 'bg-indigo-500' : 'bg-green-500'}`}>
                {isCompany ? <Building2 size={12} /> : <User size={12} />}
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-slate-800 text-lg leading-tight truncate mb-1">
                {nameText || (isCompany ? t.profileTypeComp : t.profileTypeEmp)}
              </h3>
              <p className="text-sm text-slate-500 truncate font-medium">
                {isCompany ? (jobTitleText || t.company) : (jobTitleText || t.employee)}
              </p>
            </div>
          </div>


          <div className="relative flex gap-1">
            <button
              onClick={onEdit}
              className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-full transition-colors"
              title={t.edit}
            >
              <Edit3 size={18} />
            </button>
            <button
              onClick={onDelete}
              className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
              title={t.delete}
            >
              <Trash2 size={18} />
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-slate-50 rounded-2xl p-3 flex flex-col items-center justify-center border border-slate-100 group-hover:border-slate-200 transition-colors">
            <div className="flex items-center gap-1.5 text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">
              <Activity size={12} />
              <span>{t.views}</span>
            </div>
            <span className="text-xl font-black text-slate-800">{views}</span>
          </div>
          <div className="bg-slate-50 rounded-2xl p-3 flex flex-col items-center justify-center border border-slate-100 group-hover:border-slate-200 transition-colors">
            <div className="flex items-center gap-1.5 text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">
              <MousePointer2 size={12} />
              <span>{t.clicks}</span>
            </div>
            <span className="text-xl font-black text-slate-800">{totalClicks}</span>
          </div>
        </div>

        {/* Slug / Link (Bottom) */}
        {/* Slug / Link (Bottom) */}
        {employee?.slug && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              const url = `${window.location.origin}/${employee.slug}`;
              if (navigator.share) {
                navigator.share({
                  title: nameText,
                  text: jobTitleText,
                  url: url
                }).catch(console.error);
              } else {
                navigator.clipboard.writeText(url);
                // Simple visual feedback could be nice, but keeping it standard for now
                alert(t.linkCopied || "Link copied!");
              }
            }}
            className="mb-6 flex items-center justify-between text-xs font-medium text-slate-500 bg-slate-50 hover:bg-slate-100 px-3 py-2 rounded-lg cursor-pointer w-full transition-colors group/share"
            title={t.share || "Share Link"}
          >
            <span className="truncate flex-1 font-mono text-slate-600 text-left">/{employee.slug}</span>
            <Share2 size={14} className="text-slate-400 group-hover/share:text-brand-600 transition-colors" />
          </button>
        )}

        {/* Action Buttons - Pushed to bottom */}
        <div className="mt-auto grid grid-cols-[1fr,auto] gap-2">
          <button
            onClick={() => {
              if (onManage) onManage();
              else window.location.href = `/dashboard/card/${employee.id}`;
            }}
            className="bg-slate-900 hover:bg-slate-800 text-white py-3 px-4 rounded-xl text-sm font-bold shadow-lg shadow-slate-200 hover:shadow-xl transition-all flex items-center justify-center gap-2 group/btn"
          >
            <Settings size={18} className="group-hover/btn:rotate-90 transition-transform duration-500" />
            {t.manageCard || "Manage Card"}
          </button>
          <button
            onClick={onPreview}
            className="bg-white border border-slate-200 text-slate-600 w-12 flex items-center justify-center rounded-xl hover:bg-slate-50 hover:border-slate-300 hover:text-brand-600 transition-all shadow-sm"
            title={t.preview}
          >
            <Eye size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
