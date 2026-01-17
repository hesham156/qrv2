import React, { useState, useEffect, useMemo } from 'react';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db, appId } from '../../config/firebase';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend
} from 'recharts';
import { ArrowUpRight, MousePointer, Eye, Smartphone, Monitor, Globe, Sparkles, Activity, Clock } from 'lucide-react';
import { optimizeTextWithAI } from '../../services/aiService';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export default function AnalyticsView({ employees = [], user }) {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedEmpId, setSelectedEmpId] = useState('all');
    const [dateRange, setDateRange] = useState('30'); // days
    const [aiInsight, setAiInsight] = useState('');
    const [generatingInsight, setGeneratingInsight] = useState(false);

    // Compute stats from events
    const stats = useMemo(() => {
        if (!events.length) return { views: 0, clicks: 0, ctr: 0, dailyData: [], linkData: [], topCountries: [], deviceData: [], browserData: [], activityStream: [] };

        let filtered = events;
        if (selectedEmpId !== 'all') {
            filtered = events.filter(e => e.empId === selectedEmpId);
        }

        const views = filtered.filter(e => e.type === 'view').length;
        const clicks = filtered.filter(e => e.type === 'click').length;
        const ctr = views > 0 ? ((clicks / views) * 100).toFixed(1) : 0;

        // Daily Data for Line Chart
        const daysMap = {};
        // Initialize last X days
        for (let i = parseInt(dateRange) - 1; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const key = d.toISOString().split('T')[0];
            daysMap[key] = { date: key, views: 0, clicks: 0 };
        }

        // Extended Stats
        const productStats = {};
        const storyStats = {};
        const projectStats = {};
        const deviceMap = {};
        const browserMap = {};

        filtered.forEach(e => {
            // Daily Trends
            const dateKey = e.date;
            if (daysMap[dateKey]) {
                if (e.type === 'view') daysMap[dateKey].views++;
                if (e.type === 'click') daysMap[dateKey].clicks++;
            }

            // Device & Browser
            const dev = e.device || 'Other';
            const brow = e.browser || 'Other';
            deviceMap[dev] = (deviceMap[dev] || 0) + 1;
            browserMap[brow] = (browserMap[brow] || 0) + 1;

            // Product Stats
            if (e.type === 'product_click') {
                const pid = e.productId || 'unknown';
                if (!productStats[pid]) productStats[pid] = { name: e.productName || 'Unknown Product', clicks: 0, inquiries: 0 };
                productStats[pid].clicks++;
                if (e.subtype === 'inquiry') productStats[pid].inquiries++;
            }

            // Story Stats
            if (e.type === 'story_view') {
                const sid = e.storyId || 'unknown';
                if (!storyStats[sid]) storyStats[sid] = { type: e.subtype, views: 0 };
                storyStats[sid].views++;
            }

            // Project Stats
            if (e.type === 'portfolio_click') {
                const pid = e.projectId || 'unknown';
                if (!projectStats[pid]) projectStats[pid] = { name: e.projectTitle || 'Project', clicks: 0 };
                projectStats[pid].clicks++;
            }
        });

        const dailyData = Object.values(daysMap).sort((a, b) => a.date.localeCompare(b.date)).map(d => ({
            ...d,
            date: d.date.slice(5) // MM-DD
        }));

        // Link Type Data for Pie Chart (Original + New Clicks)
        const linkMap = {};
        filtered.forEach(e => {
            if (e.type === 'click' || e.type.includes('_click')) {
                const type = e.subtype || e.type;
                linkMap[type] = (linkMap[type] || 0) + 1;
            }
        });
        const linkData = Object.keys(linkMap).map(key => ({ name: key, value: linkMap[key] }));

        const topProducts = Object.values(productStats).sort((a, b) => b.clicks - a.clicks).slice(0, 5);
        const topStories = Object.values(storyStats).sort((a, b) => b.views - a.views).slice(0, 5);
        const topProjects = Object.values(projectStats).sort((a, b) => b.clicks - a.clicks).slice(0, 5);

        const deviceData = Object.keys(deviceMap).map(key => ({ name: key, value: deviceMap[key] }));
        const browserData = Object.keys(browserMap).map(key => ({ name: key, value: browserMap[key] }));
        const activityStream = [...filtered].sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0)).slice(0, 10);

        return { views, clicks, ctr, dailyData, linkData, topProducts, topStories, topProjects, deviceData, browserData, activityStream };
    }, [events, selectedEmpId, dateRange]);

    // AI Insight Generator
    useEffect(() => {
        if (!stats.views || aiInsight) return;

        const generateInsight = async () => {
            setGeneratingInsight(true);
            try {
                const context = `
                    Views: ${stats.views}, Clicks: ${stats.clicks}, CTR: ${stats.ctr}%.
                    Top Channel: ${stats.linkData[0]?.name || 'N/A'}.
                `;
                const prompt = `Based on these digital business card stats, give one professional advice to the owner to improve engagement. ${context}`;
                const result = await optimizeTextWithAI(prompt, 'analytics_insight', 'en');
                setAiInsight(result);
            } catch (err) {
                console.error("AI Insight Error:", err);
            } finally {
                setGeneratingInsight(false);
            }
        };

        const timer = setTimeout(generateInsight, 2000);
        return () => clearTimeout(timer);
    }, [stats, aiInsight]);

    useEffect(() => {
        // Fetch analytics for all employees of this user
        // Ideally we fetch per employee, but for 'all' view we need aggregate.
        // Given usage limits, let's fetch for the first employee or all if reasonable.
        // Strategy: Loop through employees and fetch their subcollections.

        if (employees.length === 0) {
            setLoading(false);
            return;
        }

        const fetchAllData = async () => {
            setLoading(true);
            try {
                const allEvents = [];
                const daysAgo = new Date();
                daysAgo.setDate(daysAgo.getDate() - parseInt(dateRange));

                // We will execute a query for each employee. optimize later.
                const promises = employees.map(async (emp) => {
                    // Ensure we have a valid userId. Fallback to emp.userId if user prop is missing (rare)
                    const uid = user?.uid || emp.userId;
                    if (!uid) return;

                    const ref = collection(db, 'artifacts', appId, 'users', uid, 'employees', emp.id, 'analytics_events');
                    const q = query(
                        ref,
                        where('timestamp', '>=', daysAgo),
                        orderBy('timestamp', 'desc'),
                        limit(500) // Safety limit
                    );
                    const snap = await getDocs(q);
                    snap.forEach(doc => {
                        allEvents.push({ id: doc.id, empId: emp.id, ...doc.data() });
                    });
                });

                await Promise.all(promises);
                setEvents(allEvents);
            } catch (e) {
                console.error("Error fetching analytics", e);
            } finally {
                setLoading(false);
            }
        };

        fetchAllData();
    }, [employees, dateRange, user?.uid]);

    if (loading) return <div className="p-10 text-center animate-pulse">Loading Analytics...</div>;

    return (
        <div className="p-6 max-w-7xl mx-auto">
            {/* Header & Controls */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Analytics Dashboard</h1>
                    <p className="text-slate-500">Overview of your digital card performance</p>
                </div>
                <div className="flex gap-3">
                    <select
                        className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                        value={selectedEmpId}
                        onChange={(e) => setSelectedEmpId(e.target.value)}
                    >
                        <option value="all">All Cards</option>
                        {employees.map(emp => (
                            <option key={emp.id} value={emp.id}>{emp.name || 'Untitled Card'}</option>
                        ))}
                    </select>
                    <select
                        className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                        value={dateRange}
                        onChange={(e) => setDateRange(e.target.value)}
                    >
                        <option value="7">Last 7 Days</option>
                        <option value="30">Last 30 Days</option>
                    </select>
                </div>
            </div>

            {/* AI Insights Panel */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 mb-8 text-white shadow-lg relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:rotate-12 transition-transform duration-500">
                    <Sparkles size={120} />
                </div>
                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-2 text-indigo-100 font-bold text-sm tracking-wider uppercase">
                        <Sparkles size={16} /> AI Performance Insights
                    </div>
                    {generatingInsight ? (
                        <div className="flex items-center gap-3">
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            <p className="text-white/80 italic">Analyzing your data for smart advice...</p>
                        </div>
                    ) : (
                        <p className="text-lg font-medium leading-relaxed max-w-2xl">
                            {aiInsight || "Great work! Keep sharing your profile to gather more data for deeper insights."}
                        </p>
                    )}
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Eye size={20} /></div>
                        <span className="text-slate-500 font-medium">Total Views</span>
                    </div>
                    <div className="text-3xl font-bold text-slate-900">{stats.views}</div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-green-50 text-green-600 rounded-lg"><MousePointer size={20} /></div>
                        <span className="text-slate-500 font-medium">Total Clicks</span>
                    </div>
                    <div className="text-3xl font-bold text-slate-900">{stats.clicks}</div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-purple-50 text-purple-600 rounded-lg"><ArrowUpRight size={20} /></div>
                        <span className="text-slate-500 font-medium">Click Rate (CTR)</span>
                    </div>
                    <div className="text-3xl font-bold text-slate-900">{stats.ctr}%</div>
                </div>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Line Chart */}
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <h3 className="font-bold text-slate-800 mb-6">Performance Trends</h3>
                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={stats.dailyData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Legend />
                                <Line type="monotone" dataKey="views" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#3b82f6' }} activeDot={{ r: 6 }} name="Views" />
                                <Line type="monotone" dataKey="clicks" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981' }} name="Clicks" />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Pie Chart */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <h3 className="font-bold text-slate-800 mb-6">Engagement by Channel</h3>
                    <div className="h-80 w-full flex items-center justify-center">
                        {stats.linkData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={stats.linkData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {stats.linkData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend layout="vertical" verticalAlign="bottom" align="center" />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="text-center text-slate-400">
                                <p>No clicks recorded yet</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Top Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
                {/* Device Distribution */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Smartphone size={18} className="text-blue-500" /> Devices</h3>
                    <div className="space-y-3">
                        {stats.deviceData.length > 0 ? stats.deviceData.map((d, i) => (
                            <div key={i}>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-slate-600">{d.name}</span>
                                    <span className="font-bold">{d.value}</span>
                                </div>
                                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-blue-500 rounded-full"
                                        style={{ width: `${(d.value / stats.views) * 100}%` }}
                                    />
                                </div>
                            </div>
                        )) : <p className="text-slate-400 text-xs text-center py-4">No data yet</p>}
                    </div>
                </div>

                {/* Top Browsers */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Globe size={18} className="text-emerald-500" /> Browsers</h3>
                    <div className="space-y-3">
                        {stats.browserData.length > 0 ? stats.browserData.map((d, i) => (
                            <div key={i}>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-slate-600">{d.name}</span>
                                    <span className="font-bold">{d.value}</span>
                                </div>
                                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-emerald-500 rounded-full"
                                        style={{ width: `${(d.value / stats.views) * 100}%` }}
                                    />
                                </div>
                            </div>
                        )) : <p className="text-slate-400 text-xs text-center py-4">No data yet</p>}
                    </div>
                </div>

                {/* Activity Stream */}
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Activity size={18} className="text-purple-500" /> Recent Activity</h3>
                    <div className="space-y-3 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                        {stats.activityStream.length > 0 ? stats.activityStream.map((act, i) => (
                            <div key={i} className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-full ${act.type.includes('click') ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'}`}>
                                        {act.type.includes('click') ? <MousePointer size={14} /> : <Eye size={14} />}
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-slate-900 capitalize">
                                            {act.subtype || act.type.replace('_', ' ')}
                                        </p>
                                        <div className="flex items-center gap-2 text-[10px] text-slate-400">
                                            <span className="flex items-center gap-0.5"><Clock size={10} /> {new Date(act.timestamp?.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            <span>•</span>
                                            <span>{act.country || 'Global'}</span>
                                            <span>•</span>
                                            <span>{act.device || 'Desktop'}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                                    {act.browser || 'Other'}
                                </div>
                            </div>
                        )) : <p className="text-center text-slate-400 text-sm py-4 italic">Waiting for visitor activity...</p>}
                    </div>
                </div>
            </div>

            {/* Detailed Performance */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                {/* Top Products */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <h3 className="font-bold text-slate-800 mb-4">Top Products</h3>
                    <div className="space-y-4">
                        {stats?.topProducts?.map((p, i) => (
                            <div key={i} className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm">#{i + 1}</div>
                                    <div>
                                        <div className="text-sm font-bold text-slate-900 line-clamp-1">{p.name}</div>
                                        <div className="text-xs text-slate-500">{p.inquiries} Inquiries</div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="font-bold text-slate-900">{p.clicks}</div>
                                    <div className="text-xs text-slate-400">Clicks</div>
                                </div>
                            </div>
                        ))}
                        {(!stats?.topProducts || stats.topProducts.length === 0) && <p className="text-center text-slate-400 text-sm py-4">No product clicks yet</p>}
                    </div>
                </div>

                {/* Top Stories */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <h3 className="font-bold text-slate-800 mb-4">Top Stories</h3>
                    <div className="space-y-4">
                        {stats?.topStories?.map((s, i) => (
                            <div key={i} className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-pink-50 text-pink-600 flex items-center justify-center font-bold text-sm">#{i + 1}</div>
                                    <div>
                                        <div className="text-sm font-bold text-slate-900 capitalize">{s.type} Story</div>
                                        <div className="text-xs text-slate-500">Viewed</div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="font-bold text-slate-900">{s.views}</div>
                                    <div className="text-xs text-slate-400">Times</div>
                                </div>
                            </div>
                        ))}
                        {(!stats?.topStories || stats.topStories.length === 0) && <p className="text-center text-slate-400 text-sm py-4">No story views yet</p>}
                    </div>
                </div>

                {/* Top Projects */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <h3 className="font-bold text-slate-800 mb-4">Top Projects</h3>
                    <div className="space-y-4">
                        {stats?.topProjects?.map((p, i) => (
                            <div key={i} className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm">#{i + 1}</div>
                                    <div>
                                        <div className="text-sm font-bold text-slate-900 line-clamp-1">{p.name}</div>
                                        <div className="text-xs text-slate-500">Project</div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="font-bold text-slate-900">{p.clicks}</div>
                                    <div className="text-xs text-slate-400">Views</div>
                                </div>
                            </div>
                        ))}
                        {(!stats?.topProjects || stats.topProjects.length === 0) && <p className="text-center text-slate-400 text-sm py-4">No project views yet</p>}
                    </div>
                </div>
            </div>
        </div>
    );
}
