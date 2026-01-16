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
import { ArrowUpRight, MousePointer, Eye } from 'lucide-react';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export default function AnalyticsView({ employees = [], user }) {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedEmpId, setSelectedEmpId] = useState('all');
    const [dateRange, setDateRange] = useState('30'); // days

    // Compute stats from events
    const stats = useMemo(() => {
        if (!events.length) return { views: 0, clicks: 0, ctr: 0, dailyData: [], linkData: [], topCountries: [] };

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

        filtered.forEach(e => {
            // Daily Trends
            const dateKey = e.date;
            if (daysMap[dateKey]) {
                if (e.type === 'view') daysMap[dateKey].views++;
                if (e.type === 'click') daysMap[dateKey].clicks++;
            }

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

        return { views, clicks, ctr, dailyData, linkData, topProducts, topStories, topProjects };
    }, [events, selectedEmpId, dateRange]);

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

            {/* Detailed Performance - New Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                {/* Top Products */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <h3 className="font-bold text-slate-800 mb-4">Top Products</h3>
                    <div className="space-y-4">
                        {stats.topProducts.map((p, i) => (
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
                        {stats.topProducts.length === 0 && <p className="text-center text-slate-400 text-sm py-4">No product clicks yet</p>}
                    </div>
                </div>

                {/* Top Stories */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <h3 className="font-bold text-slate-800 mb-4">Top Stories</h3>
                    <div className="space-y-4">
                        {stats.topStories.map((s, i) => (
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
                        {stats.topStories.length === 0 && <p className="text-center text-slate-400 text-sm py-4">No story views yet</p>}
                    </div>
                </div>

                {/* Top Projects */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <h3 className="font-bold text-slate-800 mb-4">Top Projects</h3>
                    <div className="space-y-4">
                        {stats.topProjects.map((p, i) => (
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
                        {stats.topProjects.length === 0 && <p className="text-center text-slate-400 text-sm py-4">No project views yet</p>}
                    </div>
                </div>
            </div>
        </div>
    );
}
