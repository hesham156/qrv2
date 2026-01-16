import { useEffect, useState } from "react";
import { collection, addDoc, doc, onSnapshot, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { appId, db } from "../../config/firebase";
import { Briefcase, Plus, Trash2, X, Image as ImageIcon, Upload, Loader2 } from "lucide-react";
import { uploadToWordPress } from "../../services/wordpressStorage";

export default function PortfolioManagerModal({ userId, employee, onClose, t, user, onUpgrade }) {
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

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        try {
            const url = await uploadToWordPress(file);
            setNewItem(prev => ({ ...prev, imageUrl: url }));
        } catch (error) {
            alert("Upload failed: " + error.message);
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
        } catch (error) {
            console.error(error);
        } finally {
            setIsAdding(false);
        }
    };

    const handleDeleteItem = async (itemId) => {
        if (window.confirm('Delete this project?')) {
            try {
                await deleteDoc(doc(db, 'artifacts', appId, 'users', userId, 'employees', employee.id, 'portfolio', itemId));
            } catch (error) { console.error(error); }
        }
    };

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
                    {/* Add Form */}
                    <form onSubmit={handleAddItem} className="bg-white p-4 rounded-xl border border-slate-200 mb-6 shadow-sm">
                        <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                            <Plus size={16} /> {t.addProject || "Add Project"}
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                    {loading ? <div className="text-center py-4">{t.loading || "Loading..."}</div> : (
                        items.length === 0 ? <div className="text-center text-slate-400 py-4">{t.noProjects || "No projects yet."}</div> : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {items.map((item, index) => {
                                    // Reuse logic or make it free for all
                                    return (
                                        <div key={item.id} className="relative">
                                            <div className="bg-white p-3 rounded-xl border border-slate-200 flex gap-3 relative group">
                                                <div className="w-16 h-16 bg-slate-100 rounded-lg overflow-hidden flex-shrink-0">
                                                    {item.imageUrl ? <img src={item.imageUrl} className="w-full h-full object-cover" alt={item.title || "Project"} /> : <ImageIcon className="w-full h-full p-4 text-slate-300" />}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-bold text-slate-800 truncate">{item.title}</div>
                                                    <div className="text-xs text-slate-500 line-clamp-2">{item.description}</div>
                                                    {item.link && <a href={item.link} target="_blank" rel="noreferrer" className="text-xs text-indigo-500 hover:underline mt-1 block truncate">{item.link}</a>}
                                                </div>
                                                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-1 absolute top-2 right-2">
                                                    <button onClick={() => handleDeleteItem(item.id)} className="p-1.5 bg-red-50 text-red-500 rounded-full hover:bg-red-100">
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
                </div>
            </div>
        </div>
    );
}
