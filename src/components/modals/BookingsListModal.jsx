import { collection, onSnapshot, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";
import { appId, db } from "../../config/firebase";
import { Phone, X, CalendarClock, Video, Download } from "lucide-react";

export default function BookingsListModal({ userId, employee, onClose, t, isEmbedded }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
        collection(db, 'artifacts', appId, 'users', userId, 'employees', employee.id, 'leads'),
        where('type', '==', 'booking')
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Sort by booking timestamp, or fallback to creation time
      data.sort((a, b) => {
          // Attempting to sort by the bookingDate/bookingTime strings or createdAt
          if (a.bookingDate && b.bookingDate) {
              const dateA = new Date(`${a.bookingDate}T${a.bookingTime || '00:00'}`);
              const dateB = new Date(`${b.bookingDate}T${b.bookingTime || '00:00'}`);
              return dateB - dateA; // Newest bookings first
          }
          return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
      });
      setBookings(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId, employee.id]);

  const handleExportCSV = () => {
    if (!bookings.length) return;
    
    const headers = [t.name || 'Name', t.phone || 'Phone', t.date || 'Date', t.time || 'Time', t.meetingLink || 'Meeting Link'];
    const rows = bookings.map(b => [
      `"${b.name || ''}"`,
      `"${b.phone || ''}"`,
      `"${b.bookingDate || ''}"`,
      `"${b.bookingTime || ''}"`,
      `"${b.meetingLink || ''}"`
    ]);
    
    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `bookings_${employee.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isEmbedded) {
    return (
      <div className="bg-white rounded-2xl w-full border border-slate-200 shadow-sm overflow-hidden h-full flex flex-col">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white z-10 shrink-0">
          <div className="flex items-center gap-3">
              <h2 className="text-lg font-bold flex items-center gap-2">
                  <CalendarClock className="text-indigo-600" size={20} />
                  {t.appointments || 'حجوزات العملاء'}
              </h2>
              <div className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-black">
                  {bookings.length}
              </div>
          </div>
          <button onClick={handleExportCSV} disabled={bookings.length === 0} className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-600 hover:bg-green-100 rounded-lg text-xs font-bold transition-colors disabled:opacity-50">
            <Download size={14} />
            <span className="hidden sm:inline">{t.exportCSV || 'Export CSV'}</span>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
          {renderContent()}
        </div>
      </div>
    );
  }

  function renderContent() {
    return (
      loading ? (
        <div className="text-center py-4 text-slate-500">{t.loading || 'جاري التحميل...'}</div>
      ) : bookings.length === 0 ? (
        <div className="text-center py-12 flex flex-col items-center justify-center space-y-3 opacity-60">
            <CalendarClock size={48} className="text-slate-400" />
            <p className="text-slate-500">{t.noBookings || 'لا توجد حجوزات حتى الآن'}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {bookings.map(b => (
            <div key={b.id} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm hover:shadow relative group transition-shadow">
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-slate-800 text-base mb-1 truncate">{b.name}</div>
                  <div className="text-sm text-slate-500 mb-2 truncate break-all" dir="ltr">{b.phone}</div>
                  
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <span className="text-xs font-bold px-2 py-1 rounded inline-flex items-center gap-1 bg-indigo-50 text-indigo-700">
                        <CalendarClock size={12} />
                        {b.bookingDate} {b.bookingTime && ` - ${b.bookingTime}`}
                    </span>
                    
                    {b.meetingLink && (
                        <a href={b.meetingLink} target="_blank" rel="noreferrer" className="text-xs font-bold px-2 py-1 rounded inline-flex items-center gap-1 bg-green-50 text-green-700 hover:bg-green-100 transition-colors">
                            <Video size={12} />
                            Google Meet
                        </a>
                    )}
                  </div>
                </div>
                
                <a href={`tel:${b.phone}`} className="p-3 shrink-0 bg-slate-50 hover:bg-green-50 border border-slate-100 hover:border-green-200 rounded-full text-green-600 transition-colors">
                    <Phone size={18} />
                </a>
              </div>
            </div>
          ))}
        </div>
      )
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto shadow-2xl p-6">
        <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4 shrink-0">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-bold flex items-center gap-2">
                  <CalendarClock className="text-indigo-600" size={20} />
                  {t.appointments || 'حجوزات العملاء'}
              </h2>
              <div className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-black">
                  {bookings.length}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={handleExportCSV} disabled={bookings.length === 0} title={t.exportCSV || 'Export CSV'} className="p-2 bg-green-50 text-green-600 hover:bg-green-100 rounded-lg transition-colors disabled:opacity-50">
                <Download size={16} />
              </button>
              <button onClick={onClose} className="p-2 bg-slate-50 rounded-full hover:bg-slate-100 text-slate-500 ml-2"><X size={20} /></button>
            </div>
        </div>
        {renderContent()}
      </div>
    </div>
  );
}
