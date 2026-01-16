import React, { useState, useEffect, useMemo } from 'react';
import { collection, query, orderBy, getDocs, limit } from 'firebase/firestore';
import { db, appId } from '../../config/firebase';
import { Download, Search, Filter, Phone, User, Calendar, MessageSquare } from 'lucide-react';

export default function LeadsView({ employees = [], user }) {
    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedEmpId, setSelectedEmpId] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (employees.length === 0) {
            setLoading(false);
            return;
        }

        const fetchAllLeads = async () => {
            setLoading(true);
            try {
                const allLeads = [];
                // Fetch leads for each employee
                const promises = employees.map(async (emp) => {
                    // Ensure correct user ID (owner of the card)
                    const uid = user?.uid || emp.userId;
                    if (!uid) return;

                    const ref = collection(db, 'artifacts', appId, 'users', uid, 'employees', emp.id, 'leads');
                    // Order by new first
                    const q = query(ref, orderBy('createdAt', 'desc'), limit(100));
                    const snap = await getDocs(q);

                    snap.forEach(doc => {
                        allLeads.push({
                            id: doc.id,
                            empId: emp.id,
                            empName: emp.name,
                            ...doc.data()
                        });
                    });
                });

                await Promise.all(promises);
                // Sort combined list by date desc
                allLeads.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
                setLeads(allLeads);
            } catch (e) {
                console.error("Error fetching leads", e);
            } finally {
                setLoading(false);
            }
        };

        fetchAllLeads();
    }, [employees, user]);

    const filteredLeads = useMemo(() => {
        return leads.filter(lead => {
            const matchEmp = selectedEmpId === 'all' || lead.empId === selectedEmpId;
            const searchLower = searchTerm.toLowerCase();
            const matchSearch =
                (lead.name || '').toLowerCase().includes(searchLower) ||
                (lead.phone || '').includes(searchTerm) ||
                (lead.interest || '').toLowerCase().includes(searchLower);

            return matchEmp && matchSearch;
        });
    }, [leads, selectedEmpId, searchTerm]);

    const downloadCSV = () => {
        if (filteredLeads.length === 0) return;

        const headers = ['Name', 'Phone', 'Interest', 'Card', 'Date'];
        const rows = filteredLeads.map(l => [
            `"${l.name || ''}"`,
            `"${l.phone || ''}"`,
            `"${l.interest || ''}"`,
            `"${l.empName || ''}"`,
            l.createdAt?.seconds ? new Date(l.createdAt.seconds * 1000).toLocaleDateString() : ''
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(r => r.join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `leads_export_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (loading) return <div className="p-10 text-center animate-pulse">Loading Leads...</div>;

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Leads Management</h1>
                    <p className="text-slate-500">Capture and manage potential client information</p>
                </div>
                <button
                    onClick={downloadCSV}
                    disabled={filteredLeads.length === 0}
                    className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Download size={18} />
                    Export CSV
                </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                {/* Toolbar */}
                <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search size={18} className="absolute top-3 left-3 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by name, phone..."
                            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="relative w-full md:w-64">
                        <Filter size={18} className="absolute top-3 left-3 text-slate-400" />
                        <select
                            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                            value={selectedEmpId}
                            onChange={(e) => setSelectedEmpId(e.target.value)}
                        >
                            <option value="all">All Cards</option>
                            {employees.map(emp => (
                                <option key={emp.id} value={emp.id}>{emp.name || 'Untitled Card'}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 text-slate-500 text-sm">
                            <tr>
                                <th className="px-6 py-4 font-bold">Contact Name</th>
                                <th className="px-6 py-4 font-bold">Phone Number</th>
                                <th className="px-6 py-4 font-bold">Interest / Note</th>
                                <th className="px-6 py-4 font-bold">Source Card</th>
                                <th className="px-6 py-4 font-bold">Date</th>
                                <th className="px-6 py-4 font-bold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredLeads.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center text-slate-400">
                                        No leads found matching your criteria.
                                    </td>
                                </tr>
                            ) : (
                                filteredLeads.map((lead) => (
                                    <tr key={lead.id} className="hover:bg-slate-50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs uppercase">
                                                    {lead.name ? lead.name.charAt(0) : '?'}
                                                </div>
                                                <span className="font-bold text-slate-700">{lead.name || 'Anonymous'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-mono text-sm text-slate-600">
                                            {lead.phone}
                                        </td>
                                        <td className="px-6 py-4">
                                            {lead.interest ? (
                                                <span className="px-2 py-1 rounded bg-indigo-50 text-indigo-700 text-xs font-bold">
                                                    {lead.interest}
                                                </span>
                                            ) : <span className="text-slate-400 text-xs">-</span>}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-500">
                                            {lead.empName}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-400">
                                            {lead.createdAt?.seconds ? new Date(lead.createdAt.seconds * 1000).toLocaleDateString() : ''}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <a
                                                href={`tel:${lead.phone}`}
                                                className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 text-slate-600 hover:bg-green-100 hover:text-green-600 transition-colors"
                                                title="Call"
                                            >
                                                <Phone size={16} />
                                            </a>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
