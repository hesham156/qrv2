import { addDoc, collection, deleteDoc, doc, getDocs, serverTimestamp } from "firebase/firestore";
import { useEffect, useState, useCallback } from "react";
import { appId, db } from "../../config/firebase";
import { CircleDashed, PlayCircle, Plus, Trash2, X } from "lucide-react";
import StoryForm from "./StoryForm";
import { useToast } from "../../context/ToastContext";
import ConfirmDialog from "../common/ConfirmDialog";

export default function StoriesManagerModal({ userId, employee, onClose, t, isEmbedded }) {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const toast = useToast();
  const [storyToDelete, setStoryToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadStories = useCallback(async () => {
    try {
      const storiesRef = collection(db, 'artifacts', appId, 'users', userId, 'employees', employee.id, 'stories');
      const snapshot = await getDocs(storiesRef);
      const storiesList = [];
      snapshot.forEach(doc => storiesList.push({ id: doc.id, ...doc.data() }));
      storiesList.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setStories(storiesList);
    } catch (error) {
      console.error('Error loading stories:', error);
    } finally {
      setLoading(false);
    }
  }, [userId, employee.id]);

  useEffect(() => {
    loadStories();
  }, [loadStories]);

  const handleSaveStory = async (storyData) => {
    try {
      const storiesRef = collection(db, 'artifacts', appId, 'users', userId, 'employees', employee.id, 'stories');
      await addDoc(storiesRef, { ...storyData, createdAt: serverTimestamp() });
      await loadStories();
      setShowForm(false);
      toast.success(t.saved || "Story saved seamlessly!");
    } catch (error) {
      console.error('Error saving story:', error);
      toast.error(t.saveError || "Failed to save story.");
    }
  };

  const handleConfirmDelete = async () => {
    if (!storyToDelete) return;
    setIsDeleting(true);
    try {
      const storyRef = doc(db, 'artifacts', appId, 'users', userId, 'employees', employee.id, 'stories', storyToDelete.id);
      await deleteDoc(storyRef);
      await loadStories();
      toast.success(t.deleted || "Story removed.");
      setStoryToDelete(null);
    } catch (error) {
      console.error('Error deleting story:', error);
      toast.error(t.deleteError || "Failed to remove story.");
    } finally {
      setIsDeleting(false);
    }
  };

  if (isEmbedded) {
    return (
      <div className="bg-white rounded-2xl w-full border border-slate-200 shadow-sm overflow-hidden h-full flex flex-col">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white z-10">
          <div className="flex items-center gap-3">
            <CircleDashed size={24} className="text-pink-600" />
            <h2 className="text-lg font-bold text-slate-800">{t.manageStories || 'Manage Stories'}</h2>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
          {renderContent()}
        </div>
      </div>
    );
  }

  function renderContent() {
    return (
      <>
        {loading ? (
          <div className="text-center py-8 text-slate-400">{t.loading}</div>
        ) : showForm ? (
          <StoryForm
            onSave={handleSaveStory}
            onCancel={() => setShowForm(false)}
            t={t}
          />
        ) : (
          <>
            <button
              onClick={() => setShowForm(true)}
              className="w-full mb-4 py-3 bg-pink-600 text-white rounded-xl font-bold hover:bg-pink-700 transition-colors flex items-center justify-center gap-2"
            >
              <Plus size={20} /> {t.addStory || 'Add Story'}
            </button>

            {stories.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-8 flex flex-col items-center justify-center text-center mt-6">
                <div className="w-16 h-16 bg-pink-50 text-pink-300 flex items-center justify-center rounded-2xl mb-4">
                  <CircleDashed size={32} />
                </div>
                <h4 className="text-lg font-bold text-slate-800 mb-1">{t.noStories || "No Stories Yet"}</h4>
                <p className="text-sm text-slate-500 max-w-sm mb-6">
                  Share moments, offers, or news with your audience by adding an interactive Story to your profile.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {stories.map(story => (
                  <div key={story.id} className="relative aspect-[9/16] rounded-xl overflow-hidden group">
                    {story.type === 'video' ? (
                      <video src={story.mediaUrl} className="w-full h-full object-cover" />
                    ) : (
                      <img src={story.mediaUrl} alt="Story" className="w-full h-full object-cover" />
                    )}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button
                        onClick={() => setStoryToDelete(story)}
                        className="p-3 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors shadow-lg hover:scale-110 transform duration-200"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                    {story.type === 'video' && (
                      <div className="absolute top-2 right-2 bg-black/70 text-white p-1 rounded-full">
                        <PlayCircle size={16} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <CircleDashed size={24} className="text-pink-600" />
            <h2 className="text-xl font-bold text-slate-800">{t.manageStories || 'Manage Stories'}</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {renderContent()}
        </div>
      </div>

      <ConfirmDialog
        isOpen={!!storyToDelete}
        title={t.confirmDeleteTitle || "Delete Story?"}
        message={t.confirmDeleteMsg || "Are you sure you want to permanently delete this story from your profile?"}
        onConfirm={handleConfirmDelete}
        onCancel={() => setStoryToDelete(null)}
        isLoading={isDeleting}
        confirmText={t.deleteBtn || "Delete"}
        cancelText={t.cancel || "Cancel"}
      />
    </div>
  );
}