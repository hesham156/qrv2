import { collection, onSnapshot, doc, deleteDoc, setDoc, increment } from "firebase/firestore";
import { useEffect, useState } from "react";
import { appId, db } from "../../config/firebase";
import { Mail, Trash2, X, Users, Download, Send } from "lucide-react";
import { useToast } from "../../context/ToastContext";
import ConfirmDialog from "../common/ConfirmDialog";

export default function FollowersListModal({ userId, employee, onClose, t, isEmbedded }) {
  const [followers, setFollowers] = useState([]);
  const [loading, setLoading] = useState(true);

  const toast = useToast();
  const [followerToDelete, setFollowerToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const q = collection(db, 'artifacts', appId, 'users', userId, 'employees', employee.id, 'followers');
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      data.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setFollowers(data);
      setLoading(false);

      // Auto-heal follower stats if out of sync
      const actualCount = snapshot.docs.length;
      if (!employee.stats || employee.stats.followers !== actualCount) {
        try {
          const docRef = doc(db, 'artifacts', appId, 'users', userId, 'employees', employee.id);
          // Use dot notation to safely update only the nested field
          await setDoc(docRef, { stats: { followers: actualCount } }, { merge: true });
        } catch (e) {
          console.error("Auto-sync followers count failed", e);
        }
      }
    });
    return () => unsubscribe();
  }, [userId, employee.id, employee.stats]);

  const handleConfirmDelete = async () => {
    if (!followerToDelete) return;
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, 'artifacts', appId, 'users', userId, 'employees', employee.id, 'followers', followerToDelete.id));
      const docRef = doc(db, 'artifacts', appId, 'users', userId, 'employees', employee.id);
      // Let the snapshot handle the auto-sync to actual count to avoid race conditions!
      toast.success(t.deleted || "Follower removed.");
    } catch (e) {
      toast.error("Failed to remove follower.");
    } finally {
      setIsDeleting(false);
      setFollowerToDelete(null);
    }
  };

  const handleExportCSV = () => {
    if (!followers.length) return;
    
    const headers = [t.name || 'Name', t.email || 'Email', t.date || 'Date'];
    const rows = followers.map(f => [
      `"${f.name || (t.anonymous || 'Anonymous')}"`,
      `"${f.email || ''}"`,
      `"${f.createdAt?.seconds ? new Date(f.createdAt.seconds * 1000).toLocaleDateString() : ''}"`
    ]);
    
    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `followers_${employee.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleMailAll = () => {
    const emails = followers.filter(f => f.email).map(f => f.email);
    if (!emails.length) return;
    const bcc = emails.join(',');
    window.location.href = `mailto:?bcc=${bcc}&subject=Updates from ${employee.name}`;
  };

  const renderContent = () => {
    if (loading) return <div className="text-center py-12 text-slate-500 font-bold">{t.loading || "Loading..."}</div>;
    if (followers.length === 0) return (
      <div className="bg-white rounded-2xl border border-slate-200 p-8 flex flex-col items-center justify-center text-center mt-6">
        <div className="w-16 h-16 bg-blue-50 text-blue-400 flex items-center justify-center rounded-2xl mb-4">
          <Users size={32} />
        </div>
        <h4 className="text-lg font-bold text-slate-800 mb-1">{t.noFollowers || "No followers yet"}</h4>
        <p className="text-sm text-slate-500 max-w-sm mb-6">
          When people subscribe to your card, they will appear here. You can easily email them updates.
        </p>
      </div>
    );
    return (
      <div className="space-y-3">
        {followers.map(f => (
          <div key={f.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex justify-between items-center group">
            <div className="flex-1 min-w-0 pr-4">
              <div className="font-bold text-slate-800 text-sm truncate">{f.name || (t.anonymous || "Anonymous")}</div>
              <div className="text-xs text-slate-500 mt-1 truncate" dir="ltr">{f.email}</div>
            </div>
            <div className="flex items-center gap-2">
              {f.email && (
                <a href={`mailto:${f.email}`} className="p-2.5 bg-indigo-50 hover:bg-indigo-100 rounded-xl text-indigo-600 transition-colors">
                  <Mail size={16} />
                </a>
              )}
              <button onClick={() => setFollowerToDelete(f)} className="p-2.5 bg-slate-50 hover:bg-red-50 rounded-xl text-slate-400 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100 sm:opacity-100">
                  <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (isEmbedded) {
    return (
      <div className="bg-white rounded-2xl w-full border border-slate-200 shadow-sm overflow-hidden h-full flex flex-col">
        <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-white z-10 shrink-0">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-black text-slate-800">{t.followers || "Followers"}</h2>
              <div className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-black">
                  {followers.length}
              </div>
            </div>
            <p className="text-xs font-bold text-slate-500 mt-1">{employee.name}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={handleMailAll} disabled={followers.length === 0} className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg text-xs font-bold transition-colors disabled:opacity-50">
              <Send size={14} />
              <span className="hidden sm:inline">{t.mailAll || 'Mail All'}</span>
            </button>
            <button onClick={handleExportCSV} disabled={followers.length === 0} className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-600 hover:bg-green-100 rounded-lg text-xs font-bold transition-colors disabled:opacity-50">
              <Download size={14} />
              <span className="hidden sm:inline">{t.exportCSV || 'Export CSV'}</span>
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
          {renderContent()}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-md max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-slate-100 shrink-0">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-slate-800">{t.followers || "Followers"}</h2>
                <div className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-black">
                    {followers.length}
                </div>
              </div>
              <p className="text-xs font-bold text-slate-500 mt-1">{employee.name}</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={handleMailAll} disabled={followers.length === 0} title={t.mailAll || 'Mail All'} className="p-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors disabled:opacity-50">
                <Send size={16} />
              </button>
              <button onClick={handleExportCSV} disabled={followers.length === 0} title={t.exportCSV || 'Export CSV'} className="p-2 bg-green-50 text-green-600 hover:bg-green-100 rounded-lg transition-colors disabled:opacity-50">
                <Download size={16} />
              </button>
              <button onClick={onClose} className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-500 rounded-full transition-colors ml-2"><X size={20} /></button>
            </div>
        </div>
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
            {renderContent()}
        </div>
      </div>

      <ConfirmDialog
        isOpen={!!followerToDelete}
        title={t.confirmDeleteTitle || "Remove Follower?"}
        message={t.confirmDeleteMsg || "Are you sure you want to remove this follower? They will no longer receive your mass updates."}
        onConfirm={handleConfirmDelete}
        onCancel={() => setFollowerToDelete(null)}
        isLoading={isDeleting}
        confirmText={t.deleteBtn || "Remove"}
        cancelText={t.cancel || "Cancel"}
      />
    </div>
  );
}
