import { CreditCard, Wallet, Loader2 } from "lucide-react";
import { useState } from "react";
import { getFunctions, httpsCallable } from "firebase/functions";

export default function WalletPreviewModal({ type, data, onClose, t }) {
  const isApple = type === 'apple';
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleAddToWallet = async () => {
    if (isApple) {
      alert("Apple Wallet requires a developer account and backend certificate setup. This is a placeholder.");
      return;
    }

    // Direct Link Mode (Preferred/Simple)
    if (data.googleWalletUrl) {
      window.location.href = data.googleWalletUrl;
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const functions = getFunctions();
      const createPass = httpsCallable(functions, 'createGoogleWalletPass');

      // Call Backend
      const result = await createPass({
        name: data.name || data.name_en || data.name_ar,
        jobTitle: data.jobTitle || data.jobTitle_en || data.jobTitle_ar,
        photoUrl: data.photoUrl,
        email: data.email
      });

      if (result.data.saveUrl) {
        window.location.href = result.data.saveUrl;
      } else {
        throw new Error("No URL returned");
      }
    } catch (err) {
      console.error(err);
      // Fallback for demo/if backend not deployed
      window.open('https://pay.google.com/about/', '_blank');
      alert("Backend function not found or failed. Please ensure you have deployed the Cloud Function.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in duration-200">
        <div className="p-6 text-center">
          <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg" style={{ backgroundColor: isApple ? 'black' : 'white', border: isApple ? 'none' : '1px solid #eee' }}>
            {isApple ? <Wallet size={32} className="text-white" /> : <CreditCard size={32} className="text-blue-500" />}
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">{isApple ? t.addToApple : t.addToGoogle}</h3>

          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

          <p className="text-sm text-slate-500 mt-6 bg-slate-50 p-3 rounded-lg">
            {isApple ? t.walletNote : (t.walletNoteGoogle || "Save this pass to your Google Wallet for quick access.")}
          </p>

          <div className="mt-6 flex gap-3 flex-col">
            <button
              onClick={handleAddToWallet}
              disabled={loading}
              className="w-full py-3 bg-slate-900 text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : (isApple ? t.addToApple : t.addToGoogle)}
            </button>
            <button onClick={onClose} className="w-full py-3 text-slate-400 font-bold hover:text-slate-600 transition-colors">
              {t.cancel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}