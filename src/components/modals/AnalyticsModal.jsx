import {MapIcon, X} from "lucide-react";
import {useState} from "react";

export default function  AnalyticsModal({ employee, onClose, t }) {
    const [activeTab, setActiveTab] = useState('overview');
    const stats = employee.stats || { views: 0, clicks: {}, countries: {}, heatmap: {} };
    const clicks = stats.clicks || {};
    const countries = stats.countries || {};
    const heatmap = stats.heatmap || {};
    const getFlag = (code) => { if(!code || code==='Unknown') return '🌍'; return String.fromCodePoint(...code.toUpperCase().split('').map(c => 127397 + c.charCodeAt())); };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
                <div className="p-5 border-b border-slate-100 flex justify-between"><h2 className="text-lg font-bold">{t.stats}: {employee.name}</h2><button onClick={onClose}><X size={20} /></button></div>
                <div className="flex border-b border-slate-100"><button onClick={() => setActiveTab('overview')} className={`flex-1 py-3 text-sm font-medium ${activeTab === 'overview' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500'}`}>{t.overview}</button><button onClick={() => setActiveTab('map')} className={`flex-1 py-3 text-sm font-medium ${activeTab === 'map' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500'}`}>{t.heatmap}</button></div>
                <div className="p-6">
                    {activeTab === 'overview' ? (
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4"><div className="bg-blue-50 p-4 rounded text-center"><div className="text-2xl font-bold">{stats.views}</div><div className="text-xs">{t.totalViews}</div></div><div className="bg-orange-50 p-4 rounded text-center"><div className="text-2xl font-bold">{Object.values(clicks).reduce((a,b)=>a+b,0)}</div><div className="text-xs">{t.totalClicks}</div></div></div>
                            <div><h3 className="text-sm font-bold mb-2">{t.interactions}</h3>{Object.entries(clicks).sort(([,a],[,b])=>b-a).map(([k,v])=><div key={k} className="flex justify-between text-sm py-1 border-b border-slate-50"><span>{k}</span><span className="font-bold">{v}</span></div>)}</div>
                            <div><h3 className="text-sm font-bold mb-2">{t.topCountries}</h3>{Object.entries(countries).sort(([,a],[,b])=>b-a).map(([code, count]) => <div key={code} className="flex justify-between text-sm py-1"><span>{getFlag(code)} {code}</span><span>{count}</span></div>)}</div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2"><MapIcon size={16} /> {t.scanLocations}</h3>
                            <div className="relative w-full aspect-[2/1] bg-slate-100 rounded-xl overflow-hidden border border-slate-200">
                                 <img src="https://upload.wikimedia.org/wikipedia/commons/8/80/World_map_-_low_resolution.svg" className="absolute inset-0 w-full h-full object-cover opacity-30" alt="Map" />
                                 {Object.entries(heatmap).map(([key, count]) => {
                                     const [lat, lng] = key.split('_').map(Number);
                                     const x = (lng + 180) * (100 / 360); const y = (90 - lat) * (100 / 180);
                                     return <div key={key} className="absolute rounded-full bg-red-500/60" style={{ left: `${x}%`, top: `${y}%`, width: `${Math.min(20, 6+(count*2))}px`, height: `${Math.min(20, 6+(count*2))}px`, transform: 'translate(-50%, -50%)' }} title={`${count} ${t.views}`}></div>;
                                 })}
                            </div>
                            <p className="text-xs text-slate-500 bg-blue-50 p-3 rounded-lg">{t.mapNote}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}