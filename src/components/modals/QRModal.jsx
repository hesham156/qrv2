import { useMemo } from "react";
import { X, Download, ExternalLink, Copy, QrCode } from "lucide-react";
import { doc, setDoc, increment, serverTimestamp } from "firebase/firestore";
import { db, appId } from "../../config/firebase";

export default function QRModal({ employee, userId, onClose, t, lang = "ar" }) {
  const L = (lang || "ar").toLowerCase() === "en" ? "en" : "ar";

  const toText = (v) => {
    if (v == null) return "";
    if (typeof v === "string" || typeof v === "number") return String(v);
    if (typeof v === "object") return String(v?.[L] ?? v?.ar ?? v?.en ?? "");
    return "";
  };

  const pick = (arField, enField, legacyField) => {
    const ar = toText(arField);
    const en = toText(enField);
    const legacy = toText(legacyField);
    if (L === "en") return en || legacy || ar || "";
    return ar || legacy || en || "";
  };

  const nameText = pick(employee?.name_ar, employee?.name_en, employee?.name);

  const baseUrl = useMemo(() => window.location.origin, []);
  const getProfileUrl = () => {
    if (employee?.slug) return `${baseUrl}/p/${employee.slug}`;
    return `${baseUrl}/profile?uid=${userId}&pid=${employee?.id}`;
  };

  const profileUrl = getProfileUrl();

  const qrColor = employee?.qrColor?.replace("#", "") || "000000";
  const qrBgColor = employee?.qrBgColor?.replace("#", "") || "ffffff";
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=420x420&margin=10&data=${encodeURIComponent(
    profileUrl
  )}&color=${qrColor}&bgcolor=${qrBgColor}`;

  // ✅ سجل Scan (حل سريع: عند الضغط على "زيارة")
  const logScan = async () => {
    try {
      const empRef = doc(db, "artifacts", appId, "users", userId, "employees", employee.id);
      await setDoc(
        empRef,
        { stats: { scans: increment(1), lastScanAt: serverTimestamp() } },
        { merge: true }
      );
    } catch (e) {
      // ignore
    }
  };

  const handleVisit = async () => {
    await logScan(); // (اختياري) سجل scan عند زيارة
    window.open(profileUrl, "_blank");
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(profileUrl);
      window.alert(t?.copied || "Copied");
    } catch (e) {
      window.alert("Copy failed");
    }
  };

  const downloadQR = async () => {
    try {
      const response = await fetch(qrImageUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${(nameText || "qr")}-qr.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      window.alert(t?.saveError || "Error");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden border border-slate-100 relative">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-slate-900 to-slate-700 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-2 rounded-full hover:bg-white/10 transition-colors"
            aria-label="Close"
          >
            <X size={20} />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center">
              <QrCode size={20} />
            </div>
            <div className="min-w-0">
              <h3 className="font-extrabold text-base leading-5 line-clamp-1">
                {nameText || (t?.qrTitle || "QR Code")}
              </h3>
              <p className="text-xs text-white/80 line-clamp-1">
                {t?.qrSubtitle || "Scan to open the profile"}
              </p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6">
          <div className="flex justify-center">
            <div className="bg-white rounded-2xl p-3 border border-slate-200 shadow-sm">
              <img src={qrImageUrl} alt="QR" className="w-48 h-48 rounded-xl" />
            </div>
          </div>

          {/* Slug / link preview */}
          <div className="mt-4 bg-slate-50 border border-slate-200 rounded-2xl p-3">
            <p className="text-[11px] text-slate-500 font-bold mb-1">{t?.link || "Link"}</p>
            <p className="text-xs text-slate-700 font-mono break-all line-clamp-2">{profileUrl}</p>
            <div className="flex gap-2 mt-3">
              <button
                onClick={copyLink}
                className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl border border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-100 transition-colors"
              >
                <Copy size={16} />
                {t?.copy || "Copy"}
              </button>
              <button
                onClick={downloadQR}
                className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl bg-slate-900 text-white font-bold text-sm hover:opacity-90 transition-opacity"
              >
                <Download size={16} />
                {t?.download || "Download"}
              </button>
            </div>
          </div>

          {/* Primary CTA */}
          <button
            onClick={handleVisit}
            className="w-full mt-4 flex items-center justify-center gap-2 py-3 rounded-2xl text-white font-extrabold shadow-lg hover:opacity-90 transition-opacity"
            style={{ backgroundColor: employee?.themeColor || "#2563eb" }}
          >
            <ExternalLink size={18} />
            {t?.visit || "Visit Profile"}
          </button>

          {/* Optional hint */}
          <p className="mt-3 text-center text-xs text-slate-400">
            {t?.qrHint || "Tip: Print this QR on your business card or sticker."}
          </p>
        </div>
      </div>
    </div>
  );
}
