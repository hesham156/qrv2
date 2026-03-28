import { collection, onSnapshot, doc, deleteDoc, updateDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { appId, db } from "../../config/firebase";
import { Trash2, X, Star, EyeOff, Eye } from "lucide-react";

export default function ReviewsManager({ userId, employee, onClose, t, isEmbedded }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = collection(db, 'artifacts', appId, 'users', userId, 'employees', employee.id, 'reviews');
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Sort newest first
      data.sort((a, b) => {
          const timeA = a.createdAt?.seconds || Date.parse(a.createdAt) || 0;
          const timeB = b.createdAt?.seconds || Date.parse(b.createdAt) || 0;
          return timeB - timeA;
      });
      setReviews(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [userId, employee.id]);

  const handleDelete = async (id) => {
    if (window.confirm(t.confirmDelete || "هل أنت متأكد من حذف هذا التقييم؟")) {
      await deleteDoc(doc(db, 'artifacts', appId, 'users', userId, 'employees', employee.id, 'reviews', id));
      // Adjusting overall rating logic can also be done manually or via cloud functions,
      // for now we just delete the review visually and from collection.
    }
  };

  const handleToggleHide = async (id, currentHiddenStat) => {
      await updateDoc(doc(db, 'artifacts', appId, 'users', userId, 'employees', employee.id, 'reviews', id), {
          isHidden: !currentHiddenStat
      });
  };

  const renderContent = () => {
    if (loading) return <div className="text-center py-12 text-slate-500 font-bold">{t.loading || "جاري التحميل..."}</div>;
    if (reviews.length === 0) return (
        <div className="text-center py-16 text-slate-400">
            <Star size={48} className="mx-auto mb-4 opacity-20" />
            <p className="font-bold">{t.noReviews || "لا توجد تقييمات حتى الآن."}</p>
        </div>
    );
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reviews.map(r => (
          <div key={r.id} className={`bg-white p-5 rounded-2xl shadow-sm border border-slate-200 transition-opacity ${r.isHidden ? 'opacity-50' : 'opacity-100'}`}>
            <div className="flex justify-between items-start mb-3">
              <div>
                <div className="font-black text-slate-800 text-sm">{r.name || (t.anonymous || "زائر صامت")}</div>
                <div className="flex gap-1 mt-1">
                    {[1,2,3,4,5].map(s => (
                        <Star key={s} size={14} className={s <= (r.rating || 5) ? 'fill-yellow-400 text-yellow-400' : 'fill-slate-100 text-slate-200'} />
                    ))}
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => handleToggleHide(r.id, r.isHidden)} 
                  title={r.isHidden ? (t.showReview || "إظهار") : (t.hideReview || "إخفاء")}
                  className={`p-2 rounded-xl transition-colors ${r.isHidden ? 'bg-amber-50 text-amber-600 hover:bg-amber-100' : 'bg-slate-50 text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}
                >
                    {r.isHidden ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
                <button 
                  onClick={() => handleDelete(r.id)} 
                  title={t.delete || "حذف"}
                  className="p-2 bg-slate-50 hover:bg-red-50 rounded-xl text-slate-400 hover:text-red-600 transition-colors"
                >
                    <Trash2 size={16} />
                </button>
              </div>
            </div>
            
            {r.comment ? (
                <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                    "{r.comment}"
                </p>
            ) : (
                <p className="text-xs text-slate-400 italic">
                    {t.noComment || "لم يترك تعليقاً."}
                </p>
            )}
            
            {r.createdAt && (
                <div className="text-[10px] text-slate-400 mt-4 font-medium string-date">
                    {r.createdAt?.seconds ? new Date(r.createdAt.seconds * 1000).toLocaleDateString() : new Date(r.createdAt).toLocaleDateString()}
                </div>
            )}
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
            <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
                <Star className="text-amber-500 fill-amber-500" size={20} />
                {t.reviews || "التقييمات"}
            </h2>
            <p className="text-xs font-bold text-slate-500 mt-1">{employee.name}</p>
          </div>
          <div className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-black">
              {reviews.length}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
          {renderContent()}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-slate-100 shrink-0">
            <div>
              <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
                  <Star className="text-amber-500 fill-amber-500" size={20} />
                  {t.reviews || "التقييمات"}
              </h2>
              <p className="text-xs font-bold text-slate-500 mt-1">{employee.name}</p>
            </div>
            <button onClick={onClose} className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-500 rounded-full transition-colors"><X size={20} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
            {renderContent()}
        </div>
      </div>
    </div>
  );
}
