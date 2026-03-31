import { useEffect, useState } from "react";
import { collection, addDoc, doc, onSnapshot, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { appId, db } from "../../config/firebase";
import { Briefcase, Plus, Trash2, X, Image as ImageIcon, Upload, Loader2, Play } from "lucide-react";
import { uploadToWordPress } from "../../services/wordpressStorage";
import { useToast } from "../../context/ToastContext";
import ConfirmDialog from "../common/ConfirmDialog";

export default function PortfolioManagerModal({ userId, employee, onClose, t, user, onUpgrade, isEmbedded }) {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newItem, setNewItem] = useState({
        title: '',
        description: '',
        imageUrl: '',
        link: '',
        category: 'other', // Default
        mediaType: 'image', // image, video
        videoUrl: ''
    });
    const [isAdding, setIsAdding] = useState(false);
    const [uploading, setUploading] = useState(false);

    const toast = useToast();
    const [itemToDelete, setItemToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        try {
            const url = await uploadToWordPress(file);
            setNewItem(prev => ({ ...prev, imageUrl: url }));
            toast.success(t.uploadSuccess || "Image uploaded!");
        } catch (error) {
            toast.error((t.uploadFailed || "Upload failed") + ": " + error.message);
        } finally {
            setUploading(false);
        }
    };

    // Fetch Portfolio Items
    useEffect(() => {
        if (!userId || !employee?.id) return;

        const q = collection(db, 'artifacts', appId, 'users', userId, 'employees', employee.id, 'portfolio');
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            data.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
            setItems(data);
            setLoading(false);
        }, (error) => {
            console.error("Snapshot error:", error);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [userId, employee.id]);

    const handleAddItem = async (e) => {
        e.preventDefault();

        // Check Limits - reuse similar logic to products if you have limits, for now simple limit
        // const plan = user?.plan || 'free';
        // if (plan === 'free' && items.length >= 3) { ... }

        setIsAdding(true);
        try {
            await addDoc(collection(db, 'artifacts', appId, 'users', userId, 'employees', employee.id, 'portfolio'), {
                ...newItem,
                createdAt: serverTimestamp()
            });
            setNewItem({ title: '', description: '', imageUrl: '', link: '', category: 'other', mediaType: 'image', videoUrl: '' });
            toast.success(t.saved || "Project Added!");
        } catch (error) {
            console.error(error);
            toast.error(t.saveError || "Error saving project.");
        } finally {
            setIsAdding(false);
        }
    };

    const handleConfirmDelete = async () => {
        if (!itemToDelete) return;
        setIsDeleting(true);
        try {
            await deleteDoc(doc(db, 'artifacts', appId, 'users', userId, 'employees', employee.id, 'portfolio', itemToDelete.id));
            toast.success(t.deleted || "Project deleted.");
            setItemToDelete(null);
        } catch (error) {
            console.error(error);
            toast.error(t.deleteError || "Error deleting project.");
        } finally {
            setIsDeleting(false);
        }
    };

    if (isEmbedded) {
        return (
            <div className="bg-white rounded-2xl w-full border border-slate-200 shadow-sm overflow-hidden h-full flex flex-col">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white z-10">
                    <h2 className="text-lg font-bold flex items-center gap-2">
                        <Briefcase size={20} className="text-indigo-600" />
                        {t.portfolioTitle || "Portfolio"}
                    </h2>
                </div>
                <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
                    {renderContent()}
                </div>
            </div>
        )
    }

    function renderContent() {
        return (
            <>
                {/* Add Form */}
                <form onSubmit={handleAddItem} className="bg-white p-5 rounded-2xl border border-slate-200 mb-6 shadow-sm">
                    <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                        <div className="bg-indigo-50 p-1.5 rounded-lg">
                            <Plus size={16} className="text-indigo-600" />
                        </div>
                        {t.addProject || "Add Project"}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input
                            required
                            value={newItem.title}
                            onChange={e => setNewItem({ ...newItem, title: e.target.value })}
                            className="col-span-1 md:col-span-2 px-3 py-2 border rounded-lg text-sm"
                            placeholder={t.projectTitle || "Project Title"}
                        />

                        {/* Category & Type */}
                        <div className="grid grid-cols-2 gap-3 md:col-span-2">
                            <select
                                value={newItem.category}
                                onChange={e => setNewItem({ ...newItem, category: e.target.value })}
                                className="px-3 py-2 border rounded-lg text-sm bg-white"
                            >
                                <option value="other">{t.catOther || "General / Other"}</option>
                                <option value="development">{t.catDev || "Development"}</option>
                                <option value="design">{t.catDesign || "Design"}</option>
                                <option value="video">{t.catVideo || "Video / Motion"}</option>
                                <option value="marketing">{t.catMarketing || "Marketing"}</option>
                            </select>
                            <select
                                value={newItem.mediaType}
                                onChange={e => setNewItem({ ...newItem, mediaType: e.target.value })}
                                className="px-3 py-2 border rounded-lg text-sm bg-white"
                            >
                                <option value="image">{t.typeImage || "Image Project"}</option>
                                <option value="video">{t.typeVideo || "Video (YouTube/Vimeo)"}</option>
                            </select>
                        </div>

                        {/* Video URL (Conditional) */}
                        {newItem.mediaType === 'video' && (
                            <input
                                value={newItem.videoUrl}
                                onChange={e => setNewItem({ ...newItem, videoUrl: e.target.value })}
                                className="col-span-1 md:col-span-2 px-3 py-2 border rounded-lg text-sm dir-ltr"
                                placeholder={t.videoUrl || "Video URL (YouTube, Vimeo...)"}
                                dir="ltr"
                            />
                        )}
                        <div className="flex gap-2">
                            <input
                                value={newItem.imageUrl}
                                onChange={e => setNewItem({ ...newItem, imageUrl: e.target.value })}
                                className="flex-1 px-3 py-2 border rounded-lg text-sm dir-ltr"
                                placeholder={t.prodImg || "Image URL"}
                                dir="ltr"
                            />
                            <label className="cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 rounded-lg flex items-center justify-center transition-colors">
                                <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} disabled={uploading} />
                                {uploading ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
                            </label>
                        </div>
                        <input
                            value={newItem.link}
                            onChange={e => setNewItem({ ...newItem, link: e.target.value })}
                            className="px-3 py-2 border rounded-lg text-sm dir-ltr"
                            placeholder={t.prodLink || "Project Link"}
                            dir="ltr"
                        />
                        <textarea
                            value={newItem.description}
                            onChange={e => setNewItem({ ...newItem, description: e.target.value })}
                            className="col-span-1 md:col-span-2 px-3 py-2 border rounded-lg text-sm"
                            placeholder={t.prodDesc || "Description"}
                            rows="2"
                        ></textarea>
                    </div>
                    <button type="submit" disabled={isAdding} className="mt-3 w-full bg-indigo-600 text-white py-2 rounded-lg text-sm font-bold hover:bg-indigo-700 disabled:opacity-50">
                        {isAdding ? (t.saving || "Saving...") : (t.save || "Save")}
                    </button>
                </form>

                {/* List */}
                {loading ? <div className="text-center py-4 flex justify-center"><Loader2 size={24} className="animate-spin text-indigo-500" /></div> : (
                    items.length === 0 ? (
                        <div className="bg-white rounded-2xl border border-slate-200 p-8 flex flex-col items-center justify-center text-center">
                            <div className="w-16 h-16 bg-slate-50 text-slate-300 flex items-center justify-center rounded-2xl mb-4">
                                <Briefcase size={32} />
                            </div>
                            <h4 className="text-lg font-bold text-slate-800 mb-1">{t.noProjects || "No Projects Yet"}</h4>
                            <p className="text-sm text-slate-500 max-w-sm">
                                Add your past work, links, or videos to start building your professional portfolio.
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {items.map((item, index) => {
                                return (
                                    <div key={item.id} className="relative">
                                        <div className="bg-white p-3 rounded-xl border border-slate-200 flex gap-3 relative group transition-all hover:border-indigo-200 hover:shadow-md">
                                            <div className="w-20 h-20 bg-slate-50 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center relative">
                                                {item.imageUrl ? <img src={item.imageUrl} className="w-full h-full object-cover" alt={item.title || "Project"} /> : <ImageIcon className="w-8 h-8 text-slate-300" />}
                                                {item.mediaType === 'video' && (
                                                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                                                        <Play size={20} className="text-white drop-shadow-lg" fill="currentColor" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0 flex flex-col justify-center py-1">
                                                <div className="font-bold text-slate-800 truncate mb-1">{item.title}</div>
                                                <div className="text-xs text-slate-500 line-clamp-2 mb-1.5 leading-snug">{item.description}</div>
                                                <div className="flex items-center justify-between">
                                                  <span className="text-[10px] font-bold tracking-wide uppercase bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">{item.category}</span>
                                                  {item.link && <a href={item.link} target="_blank" rel="noreferrer" className="text-[11px] font-medium text-indigo-500 hover:underline max-w-[80px] truncate">{item.link}</a>}
                                                </div>
                                            </div>
                                            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-1 absolute top-2 right-2">
                                                <button type="button" onClick={() => setItemToDelete(item)} className="p-1.5 bg-red-50 text-red-500 rounded-full hover:bg-red-100 shadow-sm">
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )
                )}
            </>
        )
    }

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
                <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-white z-10">
                    <h2 className="text-lg font-bold flex items-center gap-2">
                        <Briefcase size={20} className="text-indigo-600" />
                        {t.portfolioTitle || "Portfolio"}: {employee.name}
                    </h2>
                    <button onClick={onClose}><X size={20} /></button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
                    {renderContent()}
                </div>
            </div>

            <ConfirmDialog
                isOpen={!!itemToDelete}
                title={t.confirmDeleteTitle || "Delete Project?"}
                message={t.confirmDeleteMsg || "Are you sure you want to permanently delete this project from your portfolio?"}
                onConfirm={handleConfirmDelete}
                onCancel={() => setItemToDelete(null)}
                isLoading={isDeleting}
                confirmText={t.deleteBtn || "Delete"}
                cancelText={t.cancel || "Cancel"}
            />
        </div>
    );
}
