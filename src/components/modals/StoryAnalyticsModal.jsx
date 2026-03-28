import { collection, onSnapshot, query, addDoc, updateDoc, doc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { useEffect, useState, useMemo } from "react";
import { appId, db } from "../../config/firebase";
import { X, MessageSquare, MapPin, Star, Heart, Eye, ChevronDown, ChevronUp } from "lucide-react";

export default function StoryAnalyticsModal({ userId, employee, onClose, t, isEmbedded }) {
  const [interactions, setInteractions] = useState([]);
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [expandedGroups, setExpandedGroups] = useState({});

  useEffect(() => {
    const qInfo = query(collection(db, 'artifacts', appId, 'users', userId, 'employees', employee.id, 'story_interactions'));
    
    const unsubscribeInteractions = onSnapshot(qInfo, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      data.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setInteractions(data);
      setLoading(false);
    });

    const qStories = query(collection(db, 'artifacts', appId, 'users', userId, 'employees', employee.id, 'stories'));
    const unsubscribeStories = onSnapshot(qStories, (snapshot) => {
      setStories(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
        unsubscribeInteractions();
        unsubscribeStories();
    };
  }, [userId, employee.id]);

  const groupedInteractions = useMemo(() => {
    const groups = {};
    interactions.forEach(intel => {
        // Group fallback if it has no storyId (legacy safety)
        const sid = intel.storyId || 'unknown_story'; 
        if (!groups[sid]) {
            groups[sid] = [];
        }
        groups[sid].push(intel);
    });
    
    return Object.entries(groups).map(([storyId, items]) => {
        const story = stories.find(s => s.id === storyId);
        return { storyId, story, items };
    });
  }, [interactions, stories]);

  const toggleReview = async (interaction) => {
    if (processingId === interaction.id) return;
    setProcessingId(interaction.id);

    try {
      const interactionRef = doc(db, 'artifacts', appId, 'users', userId, 'employees', employee.id, 'story_interactions', interaction.id);
      
      if (interaction.isReview) {
        // If it was already a review, we remove it from the reviews collection
        if (interaction.reviewDocId) {
            await deleteDoc(doc(db, 'artifacts', appId, 'users', userId, 'employees', employee.id, 'reviews', interaction.reviewDocId));
        }
        await updateDoc(interactionRef, { isReview: false, reviewDocId: null });
      } else {
        // Create a new review
        const reviewsRef = collection(db, 'artifacts', appId, 'users', userId, 'employees', employee.id, 'reviews');
        const newReview = await addDoc(reviewsRef, {
            authorName: interaction.senderName || 'Anonymous',
            comment: interaction.content,
            stars: 5,
            isAnonymous: true,
            source: 'story',
            createdAt: serverTimestamp(),
            status: 'approved' // Automatically auto-approve since the owner explicitly toggled it
        });
        
        await updateDoc(interactionRef, { isReview: true, reviewDocId: newReview.id });
      }
    } catch (error) {
      console.error("Error toggling review status:", error);
    } finally {
      setProcessingId(null);
    }
  };

  const toggleGroup = (storyId) => {
    setExpandedGroups(prev => ({ ...prev, [storyId]: !prev[storyId] }));
  };

  if (isEmbedded) {
    return (
      <div className="bg-white rounded-2xl w-full border border-slate-200 shadow-sm overflow-hidden h-full flex flex-col">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white z-10">
          <h2 className="text-lg font-bold flex items-center gap-2">
              <MessageSquare className="text-pink-600" size={20} />
              {t.storyAnalytics || 'إحصائيات الاستوري'}
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto p-4 bg-slate-50">
          {renderContent()}
        </div>
      </div>
    );
  }

  function renderContent() {
    return (
      loading ? (
        <div className="text-center py-4 text-slate-500">{t.loading || 'جاري التحميل...'}</div>
      ) : interactions.length === 0 ? (
        <div className="text-center py-12 flex flex-col items-center justify-center space-y-3 opacity-60">
            <MessageSquare size={48} className="text-slate-400" />
            <p className="text-slate-500">{t.noInteractions || 'لا توجد تفاعلات أو رسائل حتى الآن'}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {groupedInteractions.map(group => {
            const isExpanded = !!expandedGroups[group.storyId];
            const viewsCount = employee?.stats?.clicks?.[`story_view_${group.storyId}`] || 0;
            
            return (
              <div key={group.storyId} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all duration-300">
                  {/* Story header acts as accordion trigger */}
                  <div 
                      className="p-4 cursor-pointer hover:bg-slate-50 transition-colors flex items-center justify-between"
                      onClick={() => toggleGroup(group.storyId)}
                  >
                      <div className="flex items-center gap-4">
                          {group.story ? (
                              group.story.type === 'video' ? (
                                  <div className="w-14 h-14 bg-black rounded-xl overflow-hidden flex-shrink-0 relative shadow-sm">
                                     <video src={group.story.mediaUrl} className="w-full h-full object-cover" />
                                  </div>
                              ) : (
                                  <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 relative bg-slate-100 shadow-sm">
                                     <img src={group.story.mediaUrl} alt="Story Preview" className="w-full h-full object-cover" />
                                  </div>
                              )
                          ) : (
                              <div className="w-14 h-14 bg-slate-100 rounded-xl flex items-center justify-center flex-shrink-0 text-slate-400 shadow-sm border border-slate-200">
                                   <MessageSquare size={20} />
                              </div>
                          )}
                          <div>
                               <h3 className="font-bold text-slate-800 text-base mb-1">
                                   {group.story ? (t.storyLabel || 'استوري') : (t.deletedStory || 'استوري تم حذفه')}
                               </h3>
                               <div className="flex items-center gap-4 text-sm font-medium text-slate-500">
                                   <div className="flex items-center gap-1.5" title={t.views || 'مشاهدات'}>
                                       <Eye size={16} className="text-slate-400" />
                                       <span>{viewsCount}</span>
                                   </div>
                                   <div className="flex items-center gap-1.5" title={t.interactions || 'تفاعلات'}>
                                       <Heart size={14} className="text-pink-400" />
                                       <span>{group.items.length}</span>
                                   </div>
                               </div>
                          </div>
                      </div>
                      <div className="flex items-center gap-3">
                          <button 
                             className="hidden sm:flex px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold rounded-xl transition-colors items-center gap-2"
                          >
                              {t.viewAnalytics || 'عرض الإحصائيات'}
                              {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </button>
                          <div className="sm:hidden p-2 bg-slate-50 rounded-lg text-slate-500">
                             {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                          </div>
                      </div>
                  </div>

                  {/* Interactions list for this story (Expandable) */}
                  {isExpanded && (
                    <div className="p-4 pt-0 border-t border-slate-100 bg-slate-50/50">
                      <div className="mt-4 space-y-3">
                        {group.items.map(item => (
                          <div key={item.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
                            <div className="flex flex-col gap-3">
                              <div className="flex items-start justify-between">
                                  <div>
                                      <div className="flex items-center gap-2 mb-2">
                                          {item.type === 'reaction' ? (
                                              <span className="bg-orange-50 text-orange-600 px-2.5 py-1 rounded-md text-xs font-bold inline-flex items-center gap-1.5 shadow-sm">
                                                  <Heart size={12} className="fill-orange-500" /> تفاعل
                                              </span>
                                          ) : (
                                              <span className="bg-blue-50 text-blue-600 px-2.5 py-1 rounded-md text-xs font-bold inline-flex items-center gap-1.5 shadow-sm">
                                                  <MessageSquare size={12} /> رسالة
                                              </span>
                                          )}
                                          <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                                              <MapPin size={12} />
                                              {item.country && item.country !== 'Unknown' ? item.country : (t.unknown || 'غير محدد')}
                                          </span>
                                      </div>
                                      <div className="text-slate-800 font-medium text-[15px] mt-1">
                                         {item.type === 'reaction' ? (
                                             <span className="text-3xl drop-shadow-sm">{item.content}</span>
                                         ) : (
                                             <span className="leading-relaxed whitespace-pre-wrap">{item.content}</span>
                                         )}
                                      </div>
                                  </div>
                              </div>

                              {/* Turn reply into a review */}
                              {item.type === 'reply' && (
                                  <div className="pt-3 mt-1 border-t border-slate-50 flex justify-end">
                                      <button 
                                          onClick={() => toggleReview(item)}
                                          disabled={processingId === item.id}
                                          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border shadow-sm ${item.isReview ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                                      >
                                          <Star size={16} className={item.isReview ? "fill-amber-500 text-amber-500" : "text-slate-400"} />
                                          {item.isReview ? (t.removeReview || 'إزالة من التقييمات') : (t.addReview || 'إضافة كتقييم')}
                                      </button>
                                  </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
              </div>
            );
          })}
        </div>
      )
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto shadow-2xl p-6">
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold flex items-center gap-2">
                <MessageSquare className="text-pink-600" size={20} />
                {t.storyAnalytics || 'إحصائيات الاستوري'}
            </h2>
            <button onClick={onClose} className="p-2 bg-slate-50 rounded-full hover:bg-slate-100 text-slate-500"><X size={20} /></button>
        </div>
        {renderContent()}
      </div>
    </div>
  );
}
