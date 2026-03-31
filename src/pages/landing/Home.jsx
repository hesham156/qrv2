import { Link } from 'react-router-dom';
import LandingLayout from '../../layouts/LandingLayout';
import { ArrowRight, Smartphone, Share2, BarChart3, CheckCircle2, Zap, Shield, Globe } from 'lucide-react';
import { useSEO } from '../../hooks/useSEO';

export default function Home({ lang, toggleLang, t }) {
    useSEO("DigiCard — Digital Business Cards", "Create professional digital business cards, share contact info instantly.");

    const tr = t || {};
    const isRtl = lang === 'ar';

    const features = [
        {
            icon: <Smartphone className="w-6 h-6 text-blue-600" />,
            iconBg: "bg-blue-100",
            title: tr.featMobileType || "Mobile Optimized",
            desc: tr.featMobileDesc || "Looks perfect on any device. Your digital card behaves like a native app experience.",
        },
        {
            icon: <Share2 className="w-6 h-6 text-violet-600" />,
            iconBg: "bg-violet-100",
            title: tr.featShareType || "Instant Sharing",
            desc: tr.featShareDesc || "Share via QR code, link, email, or NFC. No app needed for the other person.",
        },
        {
            icon: <BarChart3 className="w-6 h-6 text-emerald-600" />,
            iconBg: "bg-emerald-100",
            title: tr.featAnaType || "Lead Analytics",
            desc: tr.featAnaDesc || "Track who views your card and capture leads directly to your smart dashboard.",
        },
    ];

    const perks = [
        { icon: <Zap size={16} />, label: isRtl ? "إعداد في دقيقتين" : "2-minute setup" },
        { icon: <Shield size={16} />, label: isRtl ? "بدون تطبيق للمستقبل" : "No app for receiver" },
        { icon: <Globe size={16} />, label: isRtl ? "يعمل في أي مكان بالعالم" : "Works worldwide" },
        { icon: <CheckCircle2 size={16} />, label: isRtl ? "مجاني للأبد (خطة أساسية)" : "Free forever (basic)" },
    ];

    return (
        <LandingLayout lang={lang} toggleLang={toggleLang} t={t}>
            {/* ── HERO ── */}
            <section className="relative overflow-hidden bg-white">
                {/* Background decoration */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full opacity-60 blur-3xl" />
                    <div className="absolute -bottom-20 -left-20 w-[500px] h-[500px] bg-gradient-to-tr from-violet-100 to-purple-100 rounded-full opacity-50 blur-3xl" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-50 rounded-full opacity-30 blur-3xl" />
                </div>

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20 lg:pt-36 lg:pb-28 text-center">
                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 text-blue-700 px-5 py-2 rounded-full text-sm font-bold mb-10 shadow-sm">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-500 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
                        </span>
                        {tr.heroBadge || "The #1 Digital Business Card Platform"}
                    </div>

                    {/* Headline */}
                    <h1 className="text-5xl md:text-6xl lg:text-7xl font-black text-slate-900 tracking-tight mb-6 leading-[1.08]">
                        {tr.heroTitle1 || "Network smarter with"}{" "}
                        <br className="hidden sm:block" />
                        <span className="relative inline-block">
                            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 bg-clip-text text-transparent">
                                {tr.heroTitleHighlight || "Digital Cards"}
                            </span>
                            {/* underline squiggle */}
                            <svg className="absolute -bottom-2 left-0 w-full" height="8" viewBox="0 0 300 8" preserveAspectRatio="none" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M0 6 C50 0, 100 8, 150 4 S250 0, 300 6" stroke="url(#ug)" strokeWidth="3" strokeLinecap="round" />
                                <defs><linearGradient id="ug" x1="0" y1="0" x2="300" y2="0" gradientUnits="userSpaceOnUse"><stop stopColor="#2563eb"/><stop offset="0.5" stopColor="#7c3aed"/><stop offset="1" stopColor="#9333ea"/></linearGradient></defs>
                            </svg>
                        </span>
                    </h1>

                    {/* Subheadline */}
                    <p className="text-xl text-slate-500 mb-10 max-w-2xl mx-auto leading-relaxed font-medium">
                        {tr.heroSubtitle || "Create a stunning digital profile, share it instantly via QR or link, and watch your connections grow."}
                    </p>

                    {/* Perks row */}
                    <div className="flex flex-wrap items-center justify-center gap-4 mb-12">
                        {perks.map((p, i) => (
                            <div key={i} className="flex items-center gap-1.5 text-sm text-slate-500 font-semibold">
                                <span className="text-blue-600">{p.icon}</span>
                                {p.label}
                            </div>
                        ))}
                    </div>

                    {/* CTA Buttons */}
                    <div className="flex flex-col sm:flex-row justify-center gap-4 mb-20">
                        <Link
                            to="/register"
                            className="group bg-blue-600 text-white px-9 py-4 rounded-2xl text-lg font-extrabold hover:bg-blue-700 hover:shadow-[0_8px_30px_rgba(37,99,235,0.4)] hover:-translate-y-1 transition-all flex items-center justify-center gap-2"
                        >
                            {tr.heroBtnCreate || "Create Your Card Free"}
                            <ArrowRight size={20} className={`transition-transform group-hover:${isRtl ? '-translate-x-1' : 'translate-x-1'}`} />
                        </Link>
                        <Link
                            to="/features"
                            className="bg-white text-slate-700 border-2 border-slate-200 px-9 py-4 rounded-2xl text-lg font-extrabold hover:bg-slate-50 hover:border-slate-300 hover:-translate-y-1 transition-all shadow-sm"
                        >
                            {tr.heroBtnHow || "How it works"}
                        </Link>
                    </div>

                    {/* Hero mockup cards */}
                    <div className="relative mx-auto max-w-4xl">
                        {/* Glow backdrop */}
                        <div className="absolute inset-x-10 top-6 bottom-0 bg-gradient-to-br from-blue-200 to-violet-200 rounded-3xl blur-2xl opacity-40" />
                        <div className="relative bg-white rounded-3xl border border-slate-200 shadow-[0_32px_80px_-12px_rgba(0,0,0,0.12)] overflow-hidden">
                            {/* Browser bar */}
                            <div className="flex items-center gap-2 px-5 py-3.5 border-b border-slate-100 bg-slate-50">
                                <div className="flex gap-1.5">
                                    <div className="w-3 h-3 rounded-full bg-red-400"></div>
                                    <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                                    <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
                                </div>
                                <div className="flex-1 bg-white border border-slate-200 rounded-lg h-7 mx-4 flex items-center px-3">
                                    <span className="text-slate-400 text-xs font-medium tracking-wide">digicard.app/your-name</span>
                                </div>
                            </div>
                            {/* Mockup content */}
                            <div className="grid grid-cols-3 gap-0 min-h-[260px]">
                                <div className="col-span-1 border-r border-slate-100 p-6 flex flex-col items-center justify-center gap-4 bg-gradient-to-b from-slate-50 to-white">
                                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 shadow-lg flex items-center justify-center text-white text-2xl font-black">A</div>
                                    <div className="text-center">
                                        <div className="font-black text-slate-900 text-sm">{isRtl ? "أحمد العمري" : "Ahmed Al-Omari"}</div>
                                        <div className="text-xs text-blue-600 font-bold mt-0.5">{isRtl ? "مطور واجهات أمامية" : "Frontend Developer"}</div>
                                    </div>
                                    <div className="flex gap-2">
                                        {[...Array(4)].map((_, i) => (
                                            <div key={i} className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200" />
                                        ))}
                                    </div>
                                </div>
                                <div className="col-span-2 p-6 flex flex-col justify-center gap-4">
                                    <div className="flex gap-2">
                                        {["#React", "#UI/UX", "#NextJS"].map(tag => (
                                            <span key={tag} className="text-[11px] font-bold bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full border border-blue-100">{tag}</span>
                                        ))}
                                    </div>
                                    {[...Array(3)].map((_, i) => (
                                        <div key={i} className={`h-3 bg-slate-100 rounded-full ${i === 1 ? 'w-4/5' : i === 2 ? 'w-3/5' : 'w-full'}`} />
                                    ))}
                                    <div className="flex gap-3 pt-2">
                                        <div className="flex-1 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                                            <div className="w-16 h-2 bg-white/40 rounded-full" />
                                        </div>
                                        <div className="flex-1 h-10 bg-slate-100 rounded-xl flex items-center justify-center border border-slate-200">
                                            <div className="w-16 h-2 bg-slate-300 rounded-full" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        {/* Floating stat chips */}
                        <div className="absolute -top-4 -start-8 bg-white border border-slate-200 shadow-xl rounded-2xl px-4 py-3 flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center">
                                <BarChart3 size={16} className="text-emerald-600" />
                            </div>
                            <div>
                                <div className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">{isRtl ? "زيارات اليوم" : "Today's Views"}</div>
                                <div className="text-lg font-black text-slate-900 leading-tight">+248</div>
                            </div>
                        </div>
                        <div className="absolute -bottom-4 -end-8 bg-white border border-slate-200 shadow-xl rounded-2xl px-4 py-3 flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center">
                                <CheckCircle2 size={16} className="text-violet-600" />
                            </div>
                            <div>
                                <div className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">{isRtl ? "عملاء جدد" : "New Leads"}</div>
                                <div className="text-lg font-black text-slate-900 leading-tight">13 {isRtl ? "اليوم" : "today"}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── FEATURES GRID ── */}
            <section className="py-28 bg-slate-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-20">
                        <div className="inline-block bg-blue-100 text-blue-700 text-xs font-black uppercase tracking-widest px-4 py-1.5 rounded-full mb-5">
                            {isRtl ? "لماذا نحن" : "Why DigiCard"}
                        </div>
                        <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-5 tracking-tight">
                            {tr.whyChooseTitle || "Why choose DigiCard?"}
                        </h2>
                        <p className="text-slate-500 text-lg max-w-2xl mx-auto font-medium leading-relaxed">
                            {tr.whyChooseSub || "Everything you need to leave a lasting impression and manage your professional identity."}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {features.map((feature, idx) => (
                            <div
                                key={idx}
                                className="group bg-white rounded-3xl p-8 shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-2 transition-all duration-300 cursor-default"
                            >
                                <div className={`w-14 h-14 ${feature.iconBg} rounded-2xl flex items-center justify-center mb-7 group-hover:scale-110 transition-transform`}>
                                    {feature.icon}
                                </div>
                                <h3 className="text-xl font-black text-slate-900 mb-3">{feature.title}</h3>
                                <p className="text-slate-500 leading-relaxed font-medium">{feature.desc}</p>
                                <div className="mt-6 flex items-center gap-1 text-blue-600 font-black text-sm opacity-0 group-hover:opacity-100 transition-opacity">
                                    {isRtl ? 'اعرف أكثر' : 'Learn more'} <ArrowRight size={14} className={isRtl ? 'rotate-180' : ''} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── STATS BAR ── */}
            <section className="py-16 bg-white border-y border-slate-100">
                <div className="max-w-5xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                    {[
                        { value: "50K+", label: isRtl ? "بطاقة رقمية نشطة" : "Active Digital Cards" },
                        { value: "98%", label: isRtl ? "رضا العملاء" : "Customer Satisfaction" },
                        { value: "120+", label: isRtl ? "دولة حول العالم" : "Countries Worldwide" },
                        { value: "3M+", label: isRtl ? "مشاركة ناجحة" : "Successful Shares" },
                    ].map((stat, i) => (
                        <div key={i} className="group">
                            <div className="text-4xl font-black text-slate-900 mb-1 group-hover:text-blue-600 transition-colors">{stat.value}</div>
                            <div className="text-slate-500 text-sm font-bold uppercase tracking-wide">{stat.label}</div>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── CTA SECTION ── */}
            <section className="py-32 relative overflow-hidden bg-slate-900">
                {/* decorative blobs */}
                <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl" />
                <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl" />
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5" />

                <div className="relative max-w-4xl mx-auto px-4 text-center">
                    <div className="inline-block bg-white/10 text-white text-xs font-black uppercase tracking-widest px-4 py-1.5 rounded-full mb-8 border border-white/20">
                        {isRtl ? "🚀 الخطوة التالية" : "🚀 Next Step"}
                    </div>
                    <h2 className="text-4xl md:text-6xl font-black text-white mb-6 tracking-tight leading-tight">
                        {tr.ctaReadyTitle || "Ready to upgrade your networking?"}
                    </h2>
                    <p className="text-slate-400 text-xl mb-12 max-w-2xl mx-auto font-medium leading-relaxed">
                        {tr.ctaReadySub || "Join thousands of professionals who have switched to digital business cards."}
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link
                            to="/register"
                            className="group bg-white text-blue-600 px-10 py-5 rounded-2xl text-lg font-black hover:bg-blue-50 hover:shadow-[0_8px_40px_rgba(255,255,255,0.2)] hover:-translate-y-1 transition-all flex items-center justify-center gap-2"
                        >
                            {tr.ctaReadyBtn || "Get Started for Free"}
                            <ArrowRight size={20} className={`transition-transform group-hover:${isRtl ? '-translate-x-1' : 'translate-x-1'}`} />
                        </Link>
                        <Link
                            to="/pricing"
                            className="bg-white/10 text-white px-10 py-5 rounded-2xl text-lg font-black hover:bg-white/20 border border-white/20 hover:-translate-y-1 transition-all"
                        >
                            {tr.navPricing || "See Pricing"}
                        </Link>
                    </div>
                </div>
            </section>
        </LandingLayout>
    );
}
