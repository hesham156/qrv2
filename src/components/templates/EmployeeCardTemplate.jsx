import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Phone, Mail, Globe, MessageCircle, Download, Briefcase, 
  Facebook, Twitter, Instagram, Linkedin, Youtube, QrCode, 
  RefreshCcw, Star, Users, Calendar, ShoppingCart, LayoutGrid, Quote
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

export default function EmployeeCardTemplate({ 
  data, 
  t, 
  L, 
  toText,
  trackClick, 
  downloadVCard,
  themeColor,
  reviews = [],
  stories = [],
  products = [],
  portfolio = [],
  handleBuyProduct,
  setBookingModalOpen,
  setRateModalOpen,
  isFollowing,
  handleFollowClick,
  handleUnfollowClick,
  setStoryViewerOpen
}) {  const [isFlipped, setIsFlipped] = useState(false);
  const safeText = (val) => toText ? toText(val) : (val || '');

  const hasStories = stories && stories.length > 0;
  const averageRating = reviews.length > 0 
    ? (reviews.reduce((acc, curr) => acc + (curr.stars || 0), 0) / reviews.length).toFixed(1) 
    : null;

  return (
    <div 
      className="min-h-[90vh] bg-slate-100 flex flex-col items-center py-10 px-4"
      style={{ fontFamily: data?.googleFont ? `"${data.googleFont}", sans-serif` : 'inherit' }}
    >
      
      {/* ─── 3D SCENE ─── */}
      <div style={{ perspective: '2000px' }} className="w-full max-w-sm">
        
        {/* FRONT CARD */}
        <motion.div
          animate={{ rotateY: isFlipped ? -180 : 0 }}
          transition={{ duration: 0.7, type: 'spring', stiffness: 80, damping: 18 }}
          style={{ transformStyle: 'preserve-3d', transformOrigin: 'center' }}
          className="relative w-full"
        >
          {/* ──── FRONT ──── */}
          <div
            className="w-full bg-white rounded-[2rem] shadow-2xl overflow-hidden border border-slate-100 flex flex-col"
            style={{ 
              backfaceVisibility: 'hidden', 
              WebkitBackfaceVisibility: 'hidden',
              pointerEvents: isFlipped ? 'none' : 'auto'
            }}
          >
            {/* HEADER */}
            <div className="h-32 w-full relative flex-shrink-0" style={{ backgroundColor: themeColor }}>
              <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '16px 16px' }} />
              {data?.company && (
                <div className="absolute top-4 left-4 text-white/90 text-xs font-black tracking-widest uppercase bg-black/20 px-3 py-1 rounded-full backdrop-blur-sm">
                  {safeText(data.company)}
                </div>
              )}
            </div>

            {/* PROFILE PICTURE WITH STORY RING */}
            <div className="flex justify-center -mt-16 mb-2 flex-shrink-0" style={{ position: 'relative', zIndex: 10 }}>
              <button
                type="button"
                onClick={() => { if (hasStories && setStoryViewerOpen) setStoryViewerOpen(true); }}
                disabled={!hasStories}
                className={`w-32 h-32 rounded-full p-1 shadow-xl flex items-center justify-center transition-transform active:scale-95 ${hasStories ? 'bg-gradient-to-tr from-rose-500 via-fuchsia-500 to-amber-500 cursor-pointer' : 'bg-white cursor-default'}`}
                style={{ display: 'flex' }}
              >
                <div className="w-full h-full rounded-full border-4 border-white overflow-hidden bg-slate-100 flex items-center justify-center">
                  {data?.photoUrl ? (
                    <img src={data.photoUrl} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-4xl text-slate-400 font-bold">{safeText(data?.name)?.[0]}</span>
                  )}
                </div>
              </button>
            </div>

            {/* STATS ROW */}
            <div className="flex items-center justify-center gap-6 mb-4">
              {averageRating && (
                <>
                  <div className="text-center">
                    <div className="font-black text-slate-800 flex items-center justify-center gap-1 text-sm">
                      <Star size={14} className="fill-yellow-400 text-yellow-500" /> {averageRating}
                    </div>
                    <div className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{reviews.length} {t?.reviews || 'Reviews'}</div>
                  </div>
                  <div className="w-px h-6 bg-slate-200" />
                </>
              )}
              <button
                type="button"
                onClick={() => isFollowing ? handleUnfollowClick?.() : handleFollowClick?.()}
                className="text-center active:scale-95 transition-transform"
              >
                <div className={`font-black flex items-center justify-center gap-1 text-sm ${isFollowing ? 'text-blue-600' : 'text-slate-800'}`}>
                  <Users size={14} className={isFollowing ? 'text-blue-500' : 'text-slate-400'} />
                  {data?.stats?.followers || 0}
                </div>
                <div className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">
                  {isFollowing ? (t?.following || 'Following') : (t?.followers || 'Followers')}
                </div>
              </button>
            </div>

            {/* INFO */}
            <div className="px-6 flex-1 flex flex-col text-center pb-6">
              <h1 className="text-3xl font-black text-slate-800 mb-1 leading-tight tracking-tight">{safeText(data?.name)}</h1>
              {data?.jobTitle && (
                <p className="text-sm font-bold text-slate-500 mb-4 flex items-center justify-center gap-1.5">
                  <Briefcase size={14} style={{ color: themeColor }} />
                  {safeText(data.jobTitle)}
                </p>
              )}
              {data?.bio && (
                <div className="bg-slate-50 text-slate-600 text-[13px] p-4 rounded-xl leading-relaxed shadow-inner border border-slate-100 mb-4 mx-2 overflow-y-auto max-h-20">
                  {safeText(data.bio)}
                </div>
              )}

              {/* CONTACT BUTTONS ROW */}
              {(data?.phone || data?.whatsapp || data?.email || data?.website) && (
                <div className="flex justify-center gap-3 mb-4">
                  {data?.phone && (
                    <a
                      href={`tel:${data.phone}`}
                      onClick={() => trackClick?.('phone')}
                      className="flex flex-col items-center gap-1.5 group"
                    >
                      <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-600 group-hover:bg-blue-50 group-hover:text-blue-600 group-hover:border-blue-200 shadow-sm transition-all active:scale-90">
                        <Phone size={19} />
                      </div>
                      <span className="text-[9px] font-bold text-slate-400 group-hover:text-blue-500 transition-colors">{t?.contact || 'Call'}</span>
                    </a>
                  )}
                  {data?.whatsapp && (
                    <a
                      href={`https://wa.me/${data.whatsapp.replace(/\D/g, '')}`}
                      target="_blank" rel="noreferrer"
                      onClick={() => trackClick?.('whatsapp')}
                      className="flex flex-col items-center gap-1.5 group"
                    >
                      <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-600 group-hover:bg-green-50 group-hover:text-green-600 group-hover:border-green-200 shadow-sm transition-all active:scale-90">
                        <MessageCircle size={19} />
                      </div>
                      <span className="text-[9px] font-bold text-slate-400 group-hover:text-green-500 transition-colors">WhatsApp</span>
                    </a>
                  )}
                  {data?.email && (
                    <a
                      href={`mailto:${data.email}`}
                      onClick={() => trackClick?.('email')}
                      className="flex flex-col items-center gap-1.5 group"
                    >
                      <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-600 group-hover:bg-purple-50 group-hover:text-purple-600 group-hover:border-purple-200 shadow-sm transition-all active:scale-90">
                        <Mail size={19} />
                      </div>
                      <span className="text-[9px] font-bold text-slate-400 group-hover:text-purple-500 transition-colors">{t?.email || 'Email'}</span>
                    </a>
                  )}
                  {data?.website && (
                    <a
                      href={data.website.startsWith('http') ? data.website : `https://${data.website}`}
                      target="_blank" rel="noreferrer"
                      onClick={() => trackClick?.('website')}
                      className="flex flex-col items-center gap-1.5 group"
                    >
                      <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-600 group-hover:bg-slate-200 group-hover:text-slate-900 group-hover:border-slate-300 shadow-sm transition-all active:scale-90">
                        <Globe size={19} />
                      </div>
                      <span className="text-[9px] font-bold text-slate-400 group-hover:text-slate-600 transition-colors">{t?.website || 'Website'}</span>
                    </a>
                  )}
                </div>
              )}

              <div className="mt-auto space-y-3">
                {/* FOLLOW + RATE ROW */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => isFollowing ? handleUnfollowClick?.() : handleFollowClick?.()}
                    className={`py-3 rounded-xl text-sm font-black flex justify-center items-center gap-1.5 border transition-all active:scale-95 ${
                      isFollowing
                        ? 'bg-blue-50 text-blue-600 border-blue-200'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Users size={15} />
                    {isFollowing ? (t?.following || 'متابع') : (t?.follow || 'تابع')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setRateModalOpen?.(true)}
                    className="py-3 rounded-xl text-sm font-black bg-amber-50 text-amber-600 border border-amber-200 flex justify-center items-center gap-1.5 hover:bg-amber-100 active:scale-95 transition-all"
                  >
                    <Star size={15} className="fill-amber-400" />
                    {t?.rate || 'تقييم'}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => { trackClick?.('save_contact'); downloadVCard?.(); }}
                  className="w-full py-3.5 px-6 rounded-xl text-white font-bold flex justify-center items-center gap-2 shadow-lg active:scale-95 transition-transform"
                  style={{ backgroundColor: themeColor }}
                >
                  <Download size={18} />
                  {t?.saveContact || 'Save Contact'}
                </button>

                <button
                  type="button"
                  onClick={() => setIsFlipped(true)}
                  className="w-full py-3.5 px-6 rounded-xl text-slate-600 font-bold bg-slate-50 border border-slate-200 hover:bg-slate-100 active:bg-slate-200 transition-colors flex justify-center items-center gap-2"
                >
                  {L === 'ar' ? 'التفاصيل والحجز والأعمال 🔄' : 'Details & Work 🔄'}
                </button>
              </div>

              {/* SOCIAL MEDIA ROW */}
              {(data?.facebook || data?.twitter || data?.instagram || data?.linkedin || data?.youtube || data?.tiktok) && (
                <div className="flex justify-center gap-4 pb-6 pt-2">
                  {data?.linkedin && <a href={data.linkedin} target="_blank" rel="noreferrer" onClick={() => trackClick?.('linkedin')} className="w-9 h-9 rounded-full bg-slate-100 hover:bg-blue-100 flex items-center justify-center text-slate-500 hover:text-blue-700 transition-all active:scale-90"><Linkedin size={17} /></a>}
                  {data?.twitter && <a href={data.twitter} target="_blank" rel="noreferrer" onClick={() => trackClick?.('twitter')} className="w-9 h-9 rounded-full bg-slate-100 hover:bg-sky-100 flex items-center justify-center text-slate-500 hover:text-sky-500 transition-all active:scale-90"><Twitter size={17} /></a>}
                  {data?.instagram && <a href={data.instagram} target="_blank" rel="noreferrer" onClick={() => trackClick?.('instagram')} className="w-9 h-9 rounded-full bg-slate-100 hover:bg-pink-100 flex items-center justify-center text-slate-500 hover:text-pink-600 transition-all active:scale-90"><Instagram size={17} /></a>}
                  {data?.facebook && <a href={data.facebook} target="_blank" rel="noreferrer" onClick={() => trackClick?.('facebook')} className="w-9 h-9 rounded-full bg-slate-100 hover:bg-blue-100 flex items-center justify-center text-slate-500 hover:text-blue-600 transition-all active:scale-90"><Facebook size={17} /></a>}
                  {data?.youtube && <a href={data.youtube} target="_blank" rel="noreferrer" onClick={() => trackClick?.('youtube')} className="w-9 h-9 rounded-full bg-slate-100 hover:bg-red-100 flex items-center justify-center text-slate-500 hover:text-red-600 transition-all active:scale-90"><Youtube size={17} /></a>}
                </div>
              )}

            </div>
          </div>

          {/* ──── BACK ──── */}
          <div
            className="absolute inset-0 w-full rounded-[2rem] shadow-2xl overflow-hidden border border-slate-200/60 flex flex-col"
            style={{ 
              backfaceVisibility: 'hidden', 
              WebkitBackfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
              pointerEvents: isFlipped ? 'auto' : 'none',
              background: 'linear-gradient(145deg, #f8faff 0%, #eef2ff 50%, #f5f3ff 100%)'
            }}
          >
            {/* BACK HEADER */}
            <div className="w-full flex justify-between items-center bg-white p-4 shadow-sm flex-shrink-0">
              <div className="flex items-center gap-2 font-bold text-slate-800 text-sm">
                <div className="w-8 h-8 rounded-full bg-slate-100 flex justify-center items-center overflow-hidden border border-slate-200">
                  {data?.photoUrl ? <img src={data.photoUrl} className="w-full h-full object-cover" alt="" /> : <Briefcase size={14} />}
                </div>
                {safeText(data?.name)?.split(' ')?.[0]}
              </div>
              <button
                type="button"
                onClick={() => setIsFlipped(false)}
                className="p-2 bg-slate-100 text-slate-600 hover:text-slate-900 rounded-xl shadow-sm border border-slate-200 transition-colors"
              >
                <RefreshCcw size={16} />
              </button>
            </div>

            {/* SCROLLABLE BODY */}
            <div className="flex-1 overflow-y-auto p-5 space-y-8 pb-10">

              {/* BOOKING BUTTON */}
              {setBookingModalOpen && (
                <button
                  type="button"
                  onClick={() => setBookingModalOpen(true)}
                  className="w-full py-4 rounded-2xl text-white font-black flex justify-center items-center gap-2 shadow-lg active:scale-95 transition-transform"
                  style={{ backgroundColor: themeColor }}
                >
                  <Calendar size={20} />
                  {t?.bookingAction || 'Book Appointment'}
                </button>
              )}

              {/* QR CODE */}
              <div className="bg-white/80 backdrop-blur-sm p-5 rounded-3xl shadow-sm border border-white flex flex-col items-center">
                <span className="text-[10px] font-black text-slate-400 mb-4 uppercase tracking-widest flex items-center gap-1.5">
                  <QrCode size={14} style={{ color: themeColor }} /> Scan to Connect
                </span>
                <div className="p-3 bg-white rounded-2xl shadow-inner border border-slate-100">
                  <QRCodeSVG
                    value={typeof window !== 'undefined' ? window.location.href : 'https://qrv2.com'}
                    size={150}
                    fgColor={data?.qrSettings?.fgColor || data?.qrColor || '#000000'}
                    bgColor={data?.qrSettings?.bgColor || data?.qrBgColor || '#ffffff'}
                    level="H"
                    imageSettings={data?.qrSettings?.logoUrl ? {
                      src: data.qrSettings.logoUrl,
                      height: 35,
                      width: 35,
                      excavate: true
                    } : undefined}
                  />
                </div>
              </div>

              {/* PRODUCTS */}
              {products?.length > 0 && (
                <div>
                  <h3 className="text-sm font-black text-slate-800 mb-3 flex items-center gap-2">
                    <ShoppingCart size={16} style={{ color: themeColor }} /> {t?.products || 'Products'}
                  </h3>
                  <div className="flex overflow-x-auto gap-3 pb-2 snap-x">
                    {products.map(prod => (
                      <button
                        type="button"
                        key={prod.id}
                        onClick={() => handleBuyProduct?.(prod)}
                        className="min-w-[140px] max-w-[140px] bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden snap-start active:scale-95 transition-transform text-left"
                      >
                        <div className="h-24 w-full bg-slate-100">
                          {prod.imageUrl ? <img src={safeText(prod.imageUrl)} className="w-full h-full object-cover" alt="" /> : null}
                        </div>
                        <div className="p-3">
                          <h4 className="font-bold text-sm text-slate-800 truncate mb-1">{safeText(prod.name)}</h4>
                          <p className="text-xs font-black" style={{ color: themeColor }}>{safeText(prod.price)} {t?.currency}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* PORTFOLIO */}
              {portfolio?.length > 0 && (
                <div>
                  <h3 className="text-sm font-black text-slate-800 mb-3 flex items-center gap-2">
                    <LayoutGrid size={16} style={{ color: themeColor }} /> {t?.portfolio || 'Portfolio'}
                  </h3>
                  <div className="flex flex-col gap-3">
                    {portfolio.slice(0, 3).map(item => (
                      <div key={item.id} className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-3">
                        <div className="w-16 h-16 rounded-xl bg-slate-100 overflow-hidden flex-shrink-0">
                          {item.imageUrl ? <img src={safeText(item.imageUrl)} className="w-full h-full object-cover" alt="" /> : <div className="w-full h-full flex items-center justify-center text-slate-300"><LayoutGrid size={20} /></div>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-sm text-slate-800 truncate">{safeText(item.title)}</h4>
                          <p className="text-[11px] text-slate-500 line-clamp-1">{safeText(item.description)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* REVIEWS */}
              {reviews?.length > 0 && (
                <div>
                  <h3 className="text-sm font-black text-slate-800 mb-3 flex items-center gap-2">
                    <Quote size={16} style={{ color: themeColor }} /> {t?.reviews || 'Reviews'}
                  </h3>
                  <div className="space-y-3">
                    {reviews.slice(0, 2).map(review => (
                      <div key={review.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-slate-700">{review.authorName || (t?.anonymous || 'Anonymous')}</span>
                          <div className="flex gap-0.5">
                            {[1, 2, 3, 4, 5].map(s => <Star key={s} size={10} className={s <= review.stars ? 'text-yellow-400 fill-yellow-400' : 'text-slate-200'} />)}
                          </div>
                        </div>
                        {review.comment && <p className="text-xs text-slate-500 leading-relaxed italic">"{review.comment}"</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}



            </div>

          </div>

        </motion.div>
      </div>
    </div>
  );
}
