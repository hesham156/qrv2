import React, { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db, appId } from '../../config/firebase';
import { uploadToWordPress } from '../../services/wordpressStorage';
import { QRCodeSVG, QRCodeCanvas } from 'qrcode.react';
import { X, Upload, Save, Download, Trash2, QrCode } from 'lucide-react';

export default function QRCodeManagerModal({ userId, employee, onClose, t, isEmbedded }) {
  const [fgColor, setFgColor] = useState('#000000');
  const [bgColor, setBgColor] = useState('#ffffff');
  const [logoUrl, setLogoUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Derive QR Code URL
  const origin = window.location.origin;
  const targetUrl = `${origin}/p/${employee.slug}`;

  useEffect(() => {
    const fetchQRSettings = async () => {
      try {
        const docRef = doc(db, 'artifacts', appId, 'users', userId, 'employees', employee.id);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const data = snap.data();
          if (data.qrSettings) {
            setFgColor(data.qrSettings.fgColor || '#000000');
            setBgColor(data.qrSettings.bgColor || '#ffffff');
            setLogoUrl(data.qrSettings.logoUrl || '');
          }
        }
      } catch (err) {
        console.error("Error loading QR Settings", err);
      } finally {
        setLoading(false);
      }
    };
    fetchQRSettings();
  }, [employee.id, userId]);

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert(t.fileTooBig || "File is too large. Max 2MB.");
      return;
    }

    setUploading(true);
    try {
      const url = await uploadToWordPress(file);
      setLogoUrl(url);
    } catch (err) {
      console.error("Upload error", err);
      alert(t.uploadFailed || "Error uploading logo: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveLogo = () => {
    setLogoUrl('');
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const docRef = doc(db, 'artifacts', appId, 'users', userId, 'employees', employee.id);
      await updateDoc(docRef, {
        qrSettings: { fgColor, bgColor, logoUrl }
      });
      alert(t.savedSuccessfully || "Saved Successfully!");
    } catch (err) {
      console.error("Save error", err);
      alert("Error saving settings");
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadPNG = () => {
      const canvas = document.getElementById('qr-canvas-download');
      if (!canvas) {
          alert("Canvas not loaded perfectly yet.");
          return;
      }
      const pngUrl = canvas.toDataURL("image/png").replace("image/png", "image/octet-stream");
      let downloadLink = document.createElement("a");
      downloadLink.href = pngUrl;
      downloadLink.download = `QR_${employee.name.replace(/\s+/g, "_")}.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
  };

  const qrProps = {
    value: targetUrl,
    size: 250,
    fgColor,
    bgColor,
    level: 'H',
    marginSize: 1,
    imageSettings: logoUrl ? {
      src: logoUrl,
      height: 50,
      width: 50,
      excavate: true,
    } : undefined
  };

  const renderContent = () => {
    if (loading) return <div className="p-8 text-center text-slate-500 font-bold">{t.loading || "جاري التحميل..."}</div>;

    return (
      <div className="flex flex-col md:flex-row gap-8">
        <div className="flex-1 flex flex-col items-center justify-center bg-slate-100 rounded-3xl p-8 border border-slate-200">
          <div className="bg-white p-4 rounded-xl shadow-md mb-6 relative">
             <QRCodeSVG {...qrProps} />
             <div className="hidden">
                 <QRCodeCanvas id="qr-canvas-download" {...qrProps} size={1024} marginSize={4} imageSettings={logoUrl ? { src: logoUrl, height: 250, width: 250, excavate: true } : undefined} />
             </div>
          </div>

          <button onClick={handleDownloadPNG} className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-lg active:scale-95">
            <Download size={18} />
            {t.downloadQR || "تحميل كـ صورة (PNG)"}
          </button>
        </div>

        <div className="flex-1 space-y-6">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">{t.qrFgColor || "لون الكيو آر كود (النقوش)"}</label>
            <div className="flex items-center gap-3">
              <input type="color" value={fgColor} onChange={e => setFgColor(e.target.value)} className="w-12 h-12 rounded cursor-pointer border-0 p-0" />
              <input type="text" value={fgColor} onChange={e => setFgColor(e.target.value)} className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl" dir="ltr" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">{t.qrBgColor || "لون الخلفية"}</label>
            <div className="flex items-center gap-3">
              <input type="color" value={bgColor} onChange={e => setBgColor(e.target.value)} className="w-12 h-12 rounded cursor-pointer border-0 p-0" />
              <input type="text" value={bgColor} onChange={e => setBgColor(e.target.value)} className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl" dir="ltr" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">{t.qrLogo || "شعار المنتصف (Logo)"}</label>
            {logoUrl ? (
              <div className="flex items-center gap-4 p-4 border border-slate-200 rounded-xl bg-slate-50">
                <img src={logoUrl} alt="Logo Preview" className="w-12 h-12 object-contain rounded bg-white shadow-sm" />
                <button onClick={handleRemoveLogo} className="text-red-500 hover:text-red-700 font-bold text-sm bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors">
                  <Trash2 size={16} /> {t.remove || "إزالة"}
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                {uploading ? (
                   <span className="w-6 h-6 border-2 border-slate-300 border-t-indigo-600 rounded-full animate-spin"></span>
                ) : (
                  <>
                    <Upload size={24} className="text-slate-400 mb-2" />
                    <span className="text-sm font-bold text-slate-600">{t.uploadLogo || "اختر صورة الشعار"}</span>
                    <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                  </>
                )}
              </label>
            )}
            <p className="text-xs text-slate-400 mt-2 font-medium">{t.qrLogoTip || "يُفضل استخدام شعار بخلفية شفافة (PNG)."}</p>
          </div>

          <div className="pt-4 border-t border-slate-100">
             <button onClick={handleSave} disabled={saving || uploading} className="w-full py-4 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50">
               {saving ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> : <><Save size={18} /> {t.saveSettings || "حفظ التغييرات"}</>}
             </button>
          </div>
        </div>
      </div>
    );
  };

  if (isEmbedded) {
    return (
      <div className="bg-white rounded-2xl w-full border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between shrink-0">
            <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
               <QrCode className="text-purple-600" size={24} />
               {t.customizeQR || "تخصيص الكيو آر كود"}
            </h2>
        </div>
        <div className="p-6 overflow-y-auto flex-1 bg-white">
          {renderContent()}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center p-6 border-b border-slate-100">
            <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
               <QrCode className="text-purple-600" size={24} />
               {t.customizeQR || "تخصيص الكيو آر كود"}
            </h2>
            <button onClick={onClose} className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-500 rounded-full transition-colors"><X size={20} /></button>
        </div>
        <div className="p-6 overflow-y-auto flex-1 bg-white">
            {renderContent()}
        </div>
      </div>
    </div>
  );
}
