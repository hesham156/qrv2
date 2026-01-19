import React, { useState, useEffect, useMemo } from 'react';
import { collection, query, orderBy, getDocs, limit, doc, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, appId } from '../../config/firebase';
import BookingModal from '../../components/modals/BookingModal';
import AddLeadModal from '../../components/modals/AddLeadModal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { Download, Search, Filter, Phone, CheckCircle, XCircle, Clock, Briefcase, ArrowRight, Calendar, Trash2, Plus } from 'lucide-react';
import { deleteDoc } from 'firebase/firestore';

const STATUS_CONFIG = {
    new: { label: 'New', color: 'bg-slate-100 text-slate-600', icon: Clock },
    follow_up: { label: 'Follow Up', color: 'bg-amber-50 text-amber-600', icon: Clock },
    converted: { label: 'Converted', color: 'bg-emerald-50 text-emerald-600', icon: CheckCircle },
    rejected: { label: 'Rejected', color: 'bg-red-50 text-red-600', icon: XCircle },
};

export default function LeadsView({ employees = [], user, t }) {
    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedEmpId, setSelectedEmpId] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [convertingId, setConvertingId] = useState(null);
    const [bookingData, setBookingData] = useState(null);
    // Toast State
    const [toast, setToast] = useState(null); // { message, type: 'success' | 'error' }

    // Add Lead Modal State
    const [isAddLeadOpen, setIsAddLeadOpen] = useState(false);

    // Confirm Dialog State
    const [dialog, setDialog] = useState({ isOpen: false, data: null, type: 'info', title: '', message: '', action: null });
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => setToast(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
    };

    const handleStatusChange = async (lead, newStatus) => {
        // If status is changed to 'converted', trigger the project creation flow
        if (newStatus === 'converted' && lead.status !== 'converted') {
            openConvertDialog(lead);
            return;
        }

        try {
            const leadRef = doc(db, 'artifacts', appId, 'users', lead.userId, 'employees', lead.empId, 'leads', lead.id);
            await updateDoc(leadRef, { status: newStatus });

            // Update local state
            setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, status: newStatus } : l));
            showToast(t.statusUpdated || "Status updated successfully");
        } catch (error) {
            console.error("Error updating status:", error);
            showToast(t.updateError || "Failed to update status", "error");
        }
    };

    const openConvertDialog = (lead) => {
        setDialog({
            isOpen: true,
            data: lead,
            type: 'info',
            title: t.convert || 'Convert to Project',
            message: t.convertConfirm || `Create a new Project Card for "${lead.name}"?`,
            action: 'convert',
            confirmText: t.createCard || 'Create Project'
        });
    };

    const openDeleteDialog = (lead) => {
        setDialog({
            isOpen: true,
            data: lead,
            type: 'danger',
            title: t.delete || 'Delete',
            message: t.deleteConfirm || "Are you sure you want to delete this lead?",
            action: 'delete',
            confirmText: t.delete || 'Delete'
        });
    };

    const handleConfirmAction = async () => {
        if (!dialog.data || !dialog.action) return;

        setActionLoading(true);
        const lead = dialog.data;

        try {
            if (dialog.action === 'convert') {
                await executeConversion(lead);
            } else if (dialog.action === 'delete') {
                await executeDelete(lead);
            }
            setDialog({ ...dialog, isOpen: false });
        } catch (error) {
            console.error(error);
        } finally {
            setActionLoading(false);
        }
    };

    const executeConversion = async (lead) => {
        setConvertingId(lead.id);
        try {
            // 1. Create new Employee (Card)
            const newCardData = {
                name: lead.name || 'New Client',
                jobTitle: 'Valued Client',
                company: 'Client Project',
                mobile: lead.phone || '',
                createdAt: serverTimestamp(),
                projectManagement: {
                    status: 'new', // Starts in 'New' column of Task Board
                    stages: [
                        { id: 'data', label: 'Data Collection', steps: [{ id: 1, label: 'Receive Requirements', checked: false }, { id: 2, label: 'Get Assets', checked: false }] },
                        { id: 'design', label: 'Design', steps: [{ id: 3, label: 'Draft Created', checked: false }] },
                        { id: 'review', label: 'Review', steps: [] }
                    ],
                    estimatedHours: 0,
                    sourceLeadId: lead.id,
                    notes: `Converted from lead. Interest: ${lead.interest || 'N/A'}`
                },
                hidden: true // Hide from main cards view (Tasks Only)
            };

            await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'employees'), newCardData);

            // 2. Update Lead Status to Converted MANUALLY to avoid recursion
            const leadRef = doc(db, 'artifacts', appId, 'users', user.uid, 'employees', lead.empId, 'leads', lead.id);
            await updateDoc(leadRef, { status: 'converted' });

            // Update local state directly
            setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, status: 'converted' } : l));

            showToast(t.projectCreated || "Project created! Check Tasks view.");
        } catch (error) {
            console.error("Error converting lead:", error);
            showToast(t.createError || "Failed to create project", "error");
        } finally {
            setConvertingId(null);
        }
    };

    const executeDelete = async (lead) => {
        try {
            const leadRef = doc(db, 'artifacts', appId, 'users', lead.userId, 'employees', lead.empId, 'leads', lead.id);
            await deleteDoc(leadRef);

            setLeads(prev => prev.filter(l => l.id !== lead.id));
            showToast(t.deleteSuccess || "Lead deleted successfully");
        } catch (error) {
            console.error("Error deleting lead:", error);
            showToast(t.deleteError || "Failed to delete lead", "error");
        }
    };

    // Remove old functions that used window.confirm directly and route checks there
    // handleStatusChange already routes to openConvertDialog
    // Need to update handleDelete usage in jsx

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
                        empId: emp.id, // The ID of the card this lead came from
                        empName: emp.name,
                        userId: uid, // Needed to update
                        ...doc.data()
                    });
                });
            });

            await Promise.all(promises);
            // Sort by last interaction (updatedAt) or creation date
            allLeads.sort((a, b) => {
                const timeA = a.updatedAt?.seconds || a.createdAt?.seconds || 0;
                const timeB = b.updatedAt?.seconds || b.createdAt?.seconds || 0;
                return timeB - timeA;
            });
            setLeads(allLeads);
        } catch (e) {
            console.error("Error fetching leads", e);
        } finally {
            setLoading(false);
        }
    };

    // Fetch Leads Effect
    useEffect(() => {
        if (employees.length === 0) {
            setLoading(false);
            return;
        }
        fetchAllLeads();
    }, [employees, user]);

    // Filtered Leads Memo
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

    // Open Booking Modal Handler
    const handleBookMeeting = (lead) => {
        setBookingData({
            lead: lead,
            adminId: user.uid, // Assuming user.uid is the admin ID
            employeeId: lead.empId // Ensure lead has empId (it should from the mapping below)
        });
    };

    // Download CSV Function
    const downloadCSV = () => {
        if (filteredLeads.length === 0) return;

        const headers = ['Name', 'Phone', 'Interest', 'Status', 'Card', 'Date'];
        const rows = filteredLeads.map(l => [
            `"${l.name || ''}"`,
            `"${l.phone || ''}"`,
            `"${l.interest || ''}"`,
            `"${l.status || 'new'}"`,
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

    const STATUS_CONFIG_TRANSLATED = {
        new: { label: t.statusNew || 'New', color: 'bg-slate-100 text-slate-600', icon: Clock },
        follow_up: { label: t.statusFollowUp || 'Follow Up', color: 'bg-amber-50 text-amber-600', icon: Clock },
        converted: { label: t.statusConverted || 'Converted', color: 'bg-emerald-50 text-emerald-600', icon: CheckCircle },
        rejected: { label: t.statusRejected || 'Rejected', color: 'bg-red-50 text-red-600', icon: XCircle },
    };

    // Render Toast Component
    const Toast = () => (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300 ${toast.type === 'error' ? 'bg-red-500 text-white' : 'bg-slate-900 text-white'}`}>
            {toast.type === 'error' ? <XCircle size={20} /> : <CheckCircle size={20} className="text-emerald-400" />}
            <span className="font-bold text-sm">{toast.message}</span>
        </div>
    );

    return (
        <div className="p-6 max-w-7xl mx-auto">
            {toast && <Toast />}

            <ConfirmDialog
                isOpen={dialog.isOpen}
                title={dialog.title}
                message={dialog.message}
                type={dialog.type}
                confirmText={dialog.confirmText}
                cancelText={t.cancel || 'Cancel'}
                onConfirm={handleConfirmAction}
                onCancel={() => setDialog({ ...dialog, isOpen: false })}
                isLoading={actionLoading}
            />

            <AddLeadModal
                isOpen={isAddLeadOpen}
                onClose={() => setIsAddLeadOpen(false)}
                employees={employees}
                user={user}
                t={t}
                onSuccess={() => {
                    showToast(t.leadAdded || "Client added successfully");
                    fetchAllLeads(); // Refresh list
                }}
            />

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">

                <div>
                    <h1 className="text-2xl font-bold text-slate-900">{t.leadsManage || 'Leads Management'}</h1>
                    <p className="text-slate-500">{t.leadsDesc || 'Capture and manage potential client information'}</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setIsAddLeadOpen(true)}
                        className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg font-bold hover:bg-slate-800 transition-colors"
                    >
                        <Plus size={18} />
                        {t.addClient || 'Add Client'}
                    </button>
                    <button
                        onClick={downloadCSV}
                        disabled={filteredLeads.length === 0}
                        className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Download size={18} />
                        {t.exportCSV || 'Export CSV'}
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                {/* Toolbar */}
                <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search size={18} className="absolute top-3 ltr:left-3 rtl:right-3 text-slate-400" />
                        <input
                            type="text"
                            placeholder={t.searchPlaceholder || "Search by name, phone..."}
                            className="w-full ltr:pl-10 rtl:pr-10 p-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="relative w-full md:w-64">
                        <Filter size={18} className="absolute top-3 ltr:left-3 rtl:right-3 text-slate-400" />
                        <select
                            className="w-full ltr:pl-10 rtl:pr-10 p-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                            value={selectedEmpId}
                            onChange={(e) => setSelectedEmpId(e.target.value)}
                        >
                            <option value="all">{t.allCards || 'All Cards'}</option>
                            {employees.map(emp => (
                                <option key={emp.id} value={emp.id}>{emp.name || 'Untitled Card'}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left rtl:text-right">
                        <thead className="bg-slate-50 text-slate-500 text-sm">
                            <tr>
                                <th className="px-6 py-4 font-bold">{t.client || 'Client'}</th>
                                <th className="px-6 py-4 font-bold">{t.leadStatus || 'Status'}</th>
                                <th className="px-6 py-4 font-bold">{t.notes || 'Interest / Note'}</th>
                                <th className="px-6 py-4 font-bold">{t.leadDate || 'Date'}</th>
                                <th className="px-6 py-4 font-bold text-right rtl:text-left">{t.leadActions || 'Actions'}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredLeads.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-slate-400">
                                        {t.noLeads || 'No leads found matching your criteria.'}
                                    </td>
                                </tr>
                            ) : (
                                filteredLeads.map((lead) => (
                                    <tr key={lead.id} className="hover:bg-slate-50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500 uppercase shrink-0">
                                                    {lead.name ? lead.name.charAt(0) : '?'}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-slate-700">{lead.name || 'Anonymous'}</div>
                                                    <div className="text-xs text-slate-500 font-mono">{lead.phone}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <select
                                                value={lead.status || 'new'}
                                                onChange={(e) => handleStatusChange(lead, e.target.value)}
                                                className={`px-3 py-1.5 rounded-full text-xs font-bold border-none outline-none cursor-pointer hover:bg-opacity-80 transition-colors ${STATUS_CONFIG_TRANSLATED[lead.status || 'new']?.color || 'bg-slate-100'}`}
                                            >
                                                {Object.entries(STATUS_CONFIG_TRANSLATED).map(([key, config]) => (
                                                    <option key={key} value={key}>{config.label}</option>
                                                ))}
                                            </select>
                                        </td>
                                        <td className="px-6 py-4">
                                            {lead.interest ? (
                                                <span className="px-2 py-1 rounded bg-indigo-50 text-indigo-700 text-xs font-bold">
                                                    {lead.interest}
                                                </span>
                                            ) : <span className="text-slate-400 text-xs">-</span>}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-400">
                                            {(() => {
                                                const time = lead.updatedAt || lead.createdAt;
                                                return time?.seconds ? new Date(time.seconds * 1000).toLocaleDateString() : '';
                                            })()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-end justify-end gap-2">
                                                {/* Book Meeting Button */}
                                                <button
                                                    onClick={() => handleBookMeeting(lead)}
                                                    className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors"
                                                    title={t.bookMeeting || "Book Meeting"}
                                                >
                                                    <Calendar size={14} />
                                                </button>

                                                <a
                                                    href={`tel:${lead.phone}`}
                                                    className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 text-slate-600 hover:bg-green-100 hover:text-green-600 transition-colors"
                                                    title={t.call || "Call"}
                                                >
                                                    <Phone size={14} />
                                                </a>

                                                {/* Convert Button */}
                                                {(lead.status !== 'converted') ? (
                                                    <button
                                                        onClick={() => openConvertDialog(lead)}
                                                        disabled={convertingId === lead.id}
                                                        className="inline-flex items-center px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-all gap-1 shadow-sm"
                                                        title={t.convert || "Convert to Project"}
                                                    >
                                                        {convertingId === lead.id ? '...' : (
                                                            <>
                                                                <Briefcase size={12} />
                                                                <span className="hidden sm:inline">{t.convert || 'Convert'}</span>
                                                            </>
                                                        )}
                                                    </button>
                                                ) : (
                                                    <span className="inline-flex items-center px-3 py-1.5 rounded-lg bg-green-50 text-green-600 text-xs font-bold gap-1 border border-green-100">
                                                        <CheckCircle size={12} />
                                                        {t.statusConverted || 'Project'}
                                                    </span>
                                                )}

                                                {/* Delete Button */}
                                                <button
                                                    onClick={() => openDeleteDialog(lead)}
                                                    className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                                                    title={t.delete || "Delete"}
                                                >
                                                    <Trash2 size={14} />
                                                </button>

                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            {/* Booking Modal */}
            {
                bookingData && (
                    <BookingModal
                        adminId={user.uid}
                        employeeId={bookingData.employeeId}
                        initialValues={{ name: bookingData.lead.name, phone: bookingData.lead.phone }}
                        onClose={() => setBookingData(null)}
                        t={t}
                        bookingSettings={null}
                        themeColor="#4F46E5"
                    />
                )
            }
        </div >
    );
}
