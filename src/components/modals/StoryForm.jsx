import { useState } from "react";
import { Upload, Loader2 } from "lucide-react";
import { uploadToWordPress } from "../../services/wordpressStorage";

export default function StoryForm({ onSave, onCancel, t }) {
  const [formData, setFormData] = useState({
    type: 'image',
    mediaUrl: '',
    productId: ''
  });
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const url = await uploadToWordPress(file);
      setFormData(prev => ({ ...prev, mediaUrl: url }));
    } catch (error) {
      alert("Upload failed: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-bold text-slate-700 mb-2">{t.storyType || 'Story Type'}</label>
        <select
          value={formData.type}
          onChange={(e) => setFormData({ ...formData, type: e.target.value })}
          className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent"
        >
          <option value="image">{t.image || 'Image'}</option>
          <option value="video">{t.video || 'Video'}</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-bold text-slate-700 mb-2">
          {formData.type === 'video' ? (t.videoUrl || 'Video URL') : (t.imageUrl || 'Image URL')}
        </label>
        <div className="flex gap-2">
          <input
            type="url"
            value={formData.mediaUrl}
            onChange={(e) => setFormData({ ...formData, mediaUrl: e.target.value })}
            className="flex-1 px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            placeholder="https://..."
            required
          />
          <label className="cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-600 px-4 rounded-xl flex items-center justify-center transition-colors">
            <input type="file" className="hidden" accept={formData.type === 'video' ? "video/*" : "image/*"} onChange={handleFileUpload} disabled={uploading} />
            {uploading ? <Loader2 size={24} className="animate-spin" /> : <Upload size={24} />}
          </label>
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          className="flex-1 py-3 bg-pink-600 text-white rounded-xl font-bold hover:bg-pink-700 transition-colors"
        >
          {t.save || 'Save'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-3 bg-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-300 transition-colors"
        >
          {t.cancel || 'Cancel'}
        </button>
      </div>
    </form>
  );
}