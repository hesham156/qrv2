import { collection, onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";
import { appId, db } from "../../config/firebase";
import { Phone, X, Download, Users } from "lucide-react";

export default function LeadsListModal({ userId, employee, onClose, t, isEmbedded }) {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const q = collection(db, 'artifacts', appId, 'users', userId, 'employees', employee.id, 'leads');
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      data.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setLeads(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [userId, employee.id]);

  const handleExportCSV = () => {
    if (!leads.length) return;
    
    const headers = [t.name || 'Name', t.phone || 'Phone', t.interest || 'Interest', t.date || 'Date'];
    const rows = leads.map(l => [
      `"${l.name || ''}"`,
      `"${l.phone || ''}"`,
      `"${l.interest || ''}"`,
      `"${l.createdAt?.seconds ? new Date(l.createdAt.seconds * 1000).toLocaleDateString() : ''}"`
    ]);
    
    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `leads_${employee.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isEmbedded) {
    return (
      <div className="bg-white rounded-2xl w-full border border-slate-200 shadow-sm overflow-hidden h-full flex flex-col">
        <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-white z-10 shrink-0">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-black text-slate-800">{t.leadsTitle || "Leads"}</h2>
              <div className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-black">
                  {leads.length}
              </div>
            </div>
            <p className="text-xs font-bold text-slate-500 mt-1">{employee.name}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={handleExportCSV} disabled={leads.length === 0} className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-600 hover:bg-green-100 rounded-lg text-xs font-bold transition-colors disabled:opacity-50">
              <Download size={14} />
              <span className="hidden sm:inline">{t.exportCSV || 'Export CSV'}</span>
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
          {renderContent()}
        </div>
      </div>
    )
  }

  function renderContent() {
    return (
      loading ? <div className="text-center py-4">{t.loading}</div> : leads.length === 0 ? <p className="text-center text-slate-500 py-4">{t.noLeads}</p> :
        <div className="space-y-3">
          {leads.map(l => (
            <div key={l.id} className="bg-slate-50 p-3 rounded flex justify-between items-start">
              <div>
                <div className="font-bold">{l.name}</div>
                <div className="text-sm text-slate-500" dir="ltr">{l.phone}</div>
                {l.interest && <div className="text-xs text-indigo-600 mt-1 font-bold bg-indigo-50 inline-block px-1 rounded">{l.interest}</div>}
              </div>
              <a href={`tel:${l.phone}`} className="p-2 bg-white rounded-full text-green-600 shadow-sm"><Phone size={18} /></a>
            </div>
          ))}
        </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-lg max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-slate-100 shrink-0">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-slate-800">{t.leadsTitle || "Leads"}</h2>
                <div className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-black">
                    {leads.length}
                </div>
              </div>
              <p className="text-xs font-bold text-slate-500 mt-1">{employee.name}</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={handleExportCSV} disabled={leads.length === 0} title={t.exportCSV || 'Export CSV'} className="p-2 bg-green-50 text-green-600 hover:bg-green-100 rounded-lg transition-colors disabled:opacity-50">
                <Download size={16} />
              </button>
              <button onClick={onClose} className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-500 rounded-full transition-colors ml-2"><X size={20} /></button>
            </div>
        </div>
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
            {renderContent()}
        </div>
      </div>
    </div>
  );
}