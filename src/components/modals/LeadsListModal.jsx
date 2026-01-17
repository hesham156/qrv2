import { collection, onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";
import { appId, db } from "../../config/firebase";
import { Phone, X } from "lucide-react";

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

  if (isEmbedded) {
    return (
      <div className="bg-white rounded-2xl w-full border border-slate-200 shadow-sm overflow-hidden h-full flex flex-col">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white z-10">
          <h2 className="text-lg font-bold">{t.leadsTitle}: {employee.name}</h2>
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
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto shadow-2xl p-6">
        <div className="flex justify-between mb-4"><h2 className="text-lg font-bold">{t.leadsTitle}: {employee.name}</h2><button onClick={onClose}><X size={20} /></button></div>
        {renderContent()}
      </div>
    </div>
  );
}