import {useState} from "react";
import {  collection, addDoc,  serverTimestamp } from 'firebase/firestore';
import {appId, db} from "../../config/firebase";
import {UserPlus, X} from "lucide-react";

export default function LeadCaptureModal({ adminId, employeeId, themeColor, onClose, onSuccess, t, initialInterest }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await addDoc(collection(db, 'artifacts', appId, 'users', adminId, 'employees', employeeId, 'leads'), {
        name,
        phone,
        interest: initialInterest || 'General Contact', 
        createdAt: serverTimestamp()
      });
      setSubmitted(true);
      if (onSuccess) onSuccess();
      setTimeout(onClose, 2000);
    } catch (error) {
      window.alert("Error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"><X size={20} /></button>
        {submitted ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce"><UserPlus size={32} /></div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">{t.sentSuccess}</h3>
            <p className="text-slate-500">{t.sentMsg}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-slate-800">{initialInterest ? t.buy : t.exchangeContact}</h3>
                {initialInterest && <p className="text-sm font-bold text-indigo-600 bg-indigo-50 p-2 rounded mt-2">{initialInterest}</p>}
                <p className="text-sm text-slate-500 mt-1">{t.shareData}</p>
            </div>
            <input type="text" required value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-2 rounded-lg border border-slate-300" placeholder={t.leadName} />
            <input type="tel" required dir="ltr" value={phone} onChange={e => setPhone(e.target.value)} className="w-full px-4 py-2 rounded-lg border border-slate-300 text-right" placeholder={t.leadPhone} />
            <button type="submit" disabled={loading} className="w-full text-white font-bold py-3 rounded-xl" style={{ backgroundColor: themeColor }}>{loading ? '...' : t.send}</button>
          </form>
        )}
      </div>
    </div>
  );
}