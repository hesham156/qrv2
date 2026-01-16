import React, { useState, useEffect } from 'react';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db, appId } from '../../config/firebase';
import { Mail, Building, CreditCard, Trash2, Edit } from 'lucide-react';
import EditUserModal from '../../components/modals/EditUserModal';

export default function AdminView({ t }) {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingUser, setEditingUser] = useState(null);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const usersRef = collection(db, 'artifacts', appId, 'users');
                const snapshot = await getDocs(usersRef);
                const userList = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                // Sort by joined date desc
                userList.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
                setUsers(userList);
            } catch (error) {
                console.error("Error fetching users:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchUsers();
    }, []);

    const handleDelete = async (userId) => {
        if (window.confirm(t?.deleteConfirm || "Delete this user?")) {
            try {
                // Determine if we need to delete subcollections (Cards, Leads).
                // Firestore doesn't cascade delete automatically.
                // For now, we delete the user document. The app should handle orphaned data or we use a Cloud Function.
                // Clientside deletion of all subcollections is expensive.
                await deleteDoc(doc(db, 'artifacts', appId, 'users', userId));
                setUsers(prev => prev.filter(u => u.id !== userId));
            } catch (e) {
                console.error("Delete error:", e);
                alert(t?.deleteError || "Error deleting");
            }
        }
    };

    const handleUpdate = (updatedUser) => {
        setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
    };

    if (loading) return <div className="p-8 text-center text-slate-500">{t?.loading || "Loading Admin Data..."}</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-slate-800">{t?.dashboardTitle || "Platform Users"}</h2>
                <div className="text-sm text-slate-500">Total: {users.length}</div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-x-auto">
                <table className="w-full text-left min-w-[800px]">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-4 font-bold text-slate-700 text-sm">{t?.employee || "User"} / {t?.company || "Company"}</th>
                            <th className="px-6 py-4 font-bold text-slate-700 text-sm">{t?.currentPlan || "Plan"}</th>
                            <th className="px-6 py-4 font-bold text-slate-700 text-sm">{t?.planExpiry || "Expires"}</th>
                            <th className="px-6 py-4 font-bold text-slate-700 text-sm">{t?.role || "Role"}</th>
                            <th className="px-6 py-4 font-bold text-slate-700 text-sm text-right">{t?.actions || "Actions"}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {users.map((u) => (
                            <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex flex-col">
                                        <div className="font-bold text-slate-900 flex items-center gap-2">
                                            <Building size={14} className="text-slate-400" />
                                            {u.companyName || 'No Company Name'}
                                        </div>
                                        <div className="text-sm text-slate-500 flex items-center gap-2 mt-1">
                                            <Mail size={12} />
                                            {u.email}
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold capitalize ${u.plan === 'pro' ? 'bg-indigo-100 text-indigo-700' :
                                        u.plan === 'enterprise' ? 'bg-purple-100 text-purple-700' :
                                            'bg-green-100 text-green-700'
                                        }`}>
                                        <CreditCard size={12} />
                                        {u.plan || 'Free'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-xs text-slate-500">
                                    {u.planExpiresAt ? new Date(u.planExpiresAt.seconds * 1000).toLocaleDateString() : (t?.forever || 'Forever')}
                                </td>
                                <td className="px-6 py-4">
                                    {u.role === 'super_admin' ? (
                                        <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold border border-red-200">Super Admin</span>
                                    ) : (
                                        <span className="text-slate-400 text-xs">User</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <button
                                            onClick={() => setEditingUser(u)}
                                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                            title={t?.editUser || "Edit"}
                                        >
                                            <Edit size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(u.id)}
                                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            title={t?.deleteUser || "Delete"}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {users.length === 0 && (
                    <div className="p-8 text-center text-slate-500">{t?.noCards || "No users found."}</div>
                )}
            </div>

            {editingUser && (
                <EditUserModal
                    user={editingUser}
                    onClose={() => setEditingUser(null)}
                    onUpdate={handleUpdate}
                    t={t}
                />
            )}
        </div>
    );
}
