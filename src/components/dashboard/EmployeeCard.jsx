import React from 'react';
import {
  Edit2,
  Trash2,
  Building2,
  User,
  Activity,
  MousePointerClick,
  BarChart3,
  Users,
  QrCode,
  Eye,
  ShoppingBag,
  CircleDashed,
  Briefcase
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
  onManagePortfolio, // ✅ Portfolio
  t,
  lang
}) {
  // Normalize lang to "ar" | "en"
  const L = (lang || 'ar').toLowerCase() === 'en' ? 'en' : 'ar';

  // Always return STRING (never object)
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
  const themeColor = employee?.themeColor || '#2563eb';
  const views = employee?.stats?.views || 0;

  const nameText = pick(employee?.name_ar, employee?.name_en, employee?.name);
  const jobTitleText = pick(employee?.jobTitle_ar, employee?.jobTitle_en, employee?.jobTitle);

  const templateName =
    {
      classic: t.classic,
      modern: t.modern,
      creative: t.creative,
      elegant: t.elegant,
      professional: t.professional,
      minimal: t.minimal
    }[employee?.template] || t.classic;

  const totalClicks = Object.values(employee?.stats?.clicks || {}).reduce(
    (a, b) => a + (Number(b) || 0),
    0
  );

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow p-5 relative group">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {employee?.photoUrl ? (
            <img
              src={employee.photoUrl}
              alt={nameText || (isCompany ? t.profileTypeComp : t.profileTypeEmp)}
              className={`w-12 h-12 object-cover border border-slate-200 ${isCompany ? 'rounded-lg' : 'rounded-full'
                }`}
              style={{ borderColor: themeColor }}
            />
          ) : (
            <div
              className={`w-12 h-12 flex items-center justify-center text-xl font-bold text-white ${isCompany ? 'rounded-lg' : 'rounded-full'
                }`}
              style={{ backgroundColor: themeColor }}
            >
              {isCompany ? <Building2 size={20} /> : (nameText ? String(nameText).charAt(0) : '?')}
            </div>
          )}

          <div>
            <h3 className="font-bold text-slate-800 line-clamp-1">
              {nameText || (isCompany ? t.profileTypeComp : t.profileTypeEmp)}
            </h3>

            <p className="text-sm text-slate-500 line-clamp-1">
              {isCompany ? (jobTitleText || t.company) : (jobTitleText || t.employee)}
            </p>

            {!!employee?.slug && (
              <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded mt-1 inline-block font-mono">
                /{String(employee.slug)}
              </span>
            )}
          </div>
        </div>

        <div className="flex gap-1">
          <button
            onClick={onEdit}
            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <Edit2 size={16} />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      <div className="flex items-center flex-wrap gap-2 mb-4">
        <span
          className={`text-xs px-2 py-1 rounded font-medium flex items-center gap-1 ${isCompany ? 'bg-indigo-50 text-indigo-600' : 'bg-green-50 text-green-600'
            }`}
        >
          {isCompany ? <Building2 size={12} /> : <User size={12} />}
          {isCompany ? t.profileTypeComp : t.profileTypeEmp}
        </span>

        <span className="text-xs px-2 py-1 bg-slate-100 rounded text-slate-500 font-medium">
          {String(templateName)}
        </span>
      </div>

      <div className="flex items-center gap-4 mb-4 text-xs text-slate-500 bg-slate-50 p-2 rounded-lg">
        <div className="flex items-center gap-1">
          <Activity size={14} className="text-blue-500" />
          <span>
            {views} {t.views}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <MousePointerClick size={14} className="text-orange-500" />
          <span>
            {totalClicks} {t.clicks}
          </span>
        </div>
      </div>

      {/* ✅ صف أزرار الإدارة: منتجات + قصص */}
      <div className="flex gap-2 mb-2">
        <button
          onClick={onManageProducts}
          className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold border border-slate-200 text-indigo-600 hover:bg-indigo-50 transition-colors"
        >
          <ShoppingBag size={16} />
          {t.manageProducts}
        </button>

        <button
          onClick={onManageStories}
          disabled={!onManageStories}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold border border-slate-200 transition-colors
            ${onManageStories ? 'text-pink-600 hover:bg-pink-50' : 'text-slate-300 cursor-not-allowed bg-slate-50'}`}
        >
          <CircleDashed size={14} />
          {t.manageStories}
        </button>
      </div>

      {/* Portfolio Button */}
      <div className="mb-2">
        <button
          onClick={onManagePortfolio}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold border border-slate-200 text-teal-600 hover:bg-teal-50 transition-colors"
        >
          <Briefcase size={16} />
          {t.managePortfolio || "Portfolio"}
        </button>
      </div>

      <div className="grid grid-cols-4 gap-2">
        <button
          onClick={onShowAnalytics}
          className="flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
          title={t.stats}
        >
          <BarChart3 size={16} />
        </button>

        <button
          onClick={onShowLeads}
          className="flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
          title={t.leads}
        >
          <Users size={16} />
        </button>

        <button
          onClick={onShowQR}
          className="text-white py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-colors opacity-90 hover:opacity-100"
          style={{ backgroundColor: themeColor }}
          title={t.code}
        >
          <QrCode size={16} />
        </button>

        <button
          onClick={onPreview}
          className="flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold border border-slate-200 text-blue-600 hover:bg-blue-50 transition-colors"
          title={t.preview}
        >
          <Eye size={16} />
        </button>
      </div>
    </div>
  );
}
