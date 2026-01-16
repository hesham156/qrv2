import { X } from "lucide-react";

export default function PreviewModal({ employee, userId, onClose, t }) {
  const getProfileUrl = () => {
    const origin = window.location.origin;
    if (employee.slug) return `${origin}/p/${employee.slug}`;
    return `${origin}/profile?uid=${userId}&pid=${employee.id}`;
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-[380px] h-[750px] bg-black rounded-[40px] border-8 border-gray-800 shadow-2xl overflow-hidden flex flex-col">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-black rounded-b-xl z-20"></div>
        <div className="h-8 bg-black w-full z-10 flex justify-between items-center px-6 pt-1"><span className="text-white text-[10px]">9:41</span><div className="flex gap-1"><span className="block w-3 h-3 bg-white/20 rounded-full"></span><span className="block w-3 h-3 bg-white/20 rounded-full"></span></div></div>
        <iframe src={getProfileUrl()} className="w-full h-full bg-white border-0" title="Card Preview" />
        <button onClick={onClose} className="absolute top-4 right-4 z-50 bg-white/20 hover:bg-white/40 text-white p-2 rounded-full backdrop-blur-sm"><X size={20} /></button>
        <div className="h-6 bg-black w-full z-10 flex justify-center items-end pb-1"><div className="w-32 h-1 bg-white/30 rounded-full"></div></div>
      </div>
    </div>
  );
}