
import { useEffect, useState } from "react";
import { collection, addDoc, doc, onSnapshot, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { appId, db } from "../../config/firebase";
import { Package, Plus, ShoppingBag, Trash2, X, Lock, Upload, Loader2 } from "lucide-react";
import { isItemLocked } from "../../utils/planHelpers";
import { uploadToWordPress } from "../../services/wordpressStorage";
import { useToast } from "../../context/ToastContext";
import ConfirmDialog from "../common/ConfirmDialog";

export default function ProductsManagerModal({ userId, employee, onClose, t, user, onUpgrade, isEmbedded }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newProduct, setNewProduct] = useState({ name: '', price: '', description: '', imageUrl: '', link: '' });

  const [isAdding, setIsAdding] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const toast = useToast();
  const [productToDelete, setProductToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const url = await uploadToWordPress(file);
      setNewProduct(prev => ({ ...prev, imageUrl: url }));
      toast.success(t.uploadSuccess || "Image uploaded!");
    } catch (error) {
      toast.error((t.uploadFailed || "Upload failed") + ": " + error.message);
    } finally {
      setUploading(false);
    }
  };

  // Fetch Products
  useEffect(() => {
    const q = collection(db, 'artifacts', appId, 'users', userId, 'employees', employee.id, 'products');
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      data.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setProducts(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [userId, employee.id]);

  const handleAddProduct = async (e) => {
    e.preventDefault();

    // Check Limits
    const plan = user?.plan || 'free';
    if (plan === 'free' && products.length >= 1) {
      if (onUpgrade) onUpgrade();
      else toast.info(t.upgradeMsg);
      return;
    }

    setIsAdding(true);
    try {
      await addDoc(collection(db, 'artifacts', appId, 'users', userId, 'employees', employee.id, 'products'), {
        ...newProduct,
        createdAt: serverTimestamp()
      });
      setNewProduct({ name: '', price: '', description: '', imageUrl: '', link: '' });
      toast.success(t.saved || "Product Added!");
    } catch (error) {
      console.error(error);
      toast.error(t.saveError || "Error saving product.");
    } finally {
      setIsAdding(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!productToDelete) return;
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, 'artifacts', appId, 'users', userId, 'employees', employee.id, 'products', productToDelete.id));
      toast.success(t.deleted || "Product deleted.");
      setProductToDelete(null);
    } catch (error) {
      console.error(error);
      toast.error(t.deleteError || "Error deleting.");
    } finally {
      setIsDeleting(false);
    }
  };

  if (isEmbedded) {
    return (
      <div className="bg-white rounded-2xl w-full border border-slate-200 shadow-sm overflow-hidden h-full flex flex-col">
        {/* Header embedded or simplified */}
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white z-10">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <ShoppingBag size={20} className="text-indigo-600" />
            {t.productsTitle || "Products"}
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
          {/* ... Content ... */}
          {renderContent()}
        </div>
      </div>
    )
  }

  // Helper to allow sharing content logic
  function renderContent() {
    return (
      <>
        {/* Add Form */}
        <form onSubmit={handleAddProduct} className="bg-white p-5 rounded-2xl border border-slate-200 mb-6 shadow-sm">
          <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
            <div className="bg-indigo-50 p-1.5 rounded-lg">
              <Plus size={16} className="text-indigo-600" />
            </div>
            {t.addProduct || "Add New Product"}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input required value={newProduct.name} onChange={e => setNewProduct({ ...newProduct, name: e.target.value })} className="px-3 py-2 border rounded-lg text-sm" placeholder={t.prodName} />
            <input value={newProduct.price} onChange={e => setNewProduct({ ...newProduct, price: e.target.value })} className="px-3 py-2 border rounded-lg text-sm" placeholder={t.prodPrice} />
            <div className="flex gap-2">
              <input value={newProduct.imageUrl} onChange={e => setNewProduct({ ...newProduct, imageUrl: e.target.value })} className="flex-1 px-3 py-2 border rounded-lg text-sm dir-ltr" placeholder={t.prodImg} dir="ltr" />
              <label className="cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 rounded-lg flex items-center justify-center transition-colors">
                <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} disabled={uploading} />
                {uploading ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
              </label>
            </div>
            <input value={newProduct.link} onChange={e => setNewProduct({ ...newProduct, link: e.target.value })} className="px-3 py-2 border rounded-lg text-sm dir-ltr" placeholder={t.prodLink} dir="ltr" />
            <textarea value={newProduct.description} onChange={e => setNewProduct({ ...newProduct, description: e.target.value })} className="col-span-1 md:col-span-2 px-3 py-2 border rounded-lg text-sm" placeholder={t.prodDesc} rows="2"></textarea>
          </div>
          <button type="submit" disabled={isAdding} className="mt-3 w-full bg-indigo-600 text-white py-2 rounded-lg text-sm font-bold hover:bg-indigo-700 disabled:opacity-50">
            {isAdding ? t.saving : t.save}
          </button>
        </form>

        {/* List */}
        {loading ? <div className="text-center py-4 flex justify-center"><Loader2 size={24} className="animate-spin text-indigo-500" /></div> : (
          products.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-slate-50 text-slate-300 flex items-center justify-center rounded-2xl mb-4">
                <Package size={32} />
              </div>
              <h4 className="text-lg font-bold text-slate-800 mb-1">{t.noProducts || "No Products Yet"}</h4>
              <p className="text-sm text-slate-500 max-w-sm">
                Add your first product or service using the form above to start displaying it on your digital card.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {products.map((prod, index) => {
                const isLocked = isItemLocked(index, user);
                return (
                  <div key={prod.id} className="relative">
                    <div className="bg-white p-3 rounded-xl border border-slate-200 flex gap-3 relative group transition-all hover:border-indigo-200 hover:shadow-md">
                      <div className="w-16 h-16 bg-slate-50 rounded-lg overflow-hidden flex-shrink-0">
                        {prod.imageUrl ? <img src={prod.imageUrl} className="w-full h-full object-cover" alt={prod.name} /> : <Package className="w-full h-full p-4 text-slate-300" />}
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col justify-center">
                        <div className="font-bold text-slate-800 truncate leading-none mb-1.5">{prod.name}</div>
                        <div className="text-indigo-600 text-sm font-bold mb-1">{prod.price} {t.currency}</div>
                        <p className="text-xs text-slate-500 line-clamp-1">{prod.description}</p>
                      </div>
                      {!isLocked && (
                        <button type="button" onClick={() => setProductToDelete(prod)} className="absolute top-2 right-2 p-1.5 bg-red-50 hover:bg-red-100 text-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-all">
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>

                    {isLocked && (
                      <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-10 rounded-xl flex items-center justify-center border border-slate-200">
                        <button
                          onClick={onUpgrade}
                          className="bg-slate-900 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow flex items-center gap-2 hover:bg-black transition-colors"
                        >
                          <Lock size={12} />
                          {t.upgradeBtn || "Upgrade"}
                        </button>
                      </div>
                    )}
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
            <ShoppingBag size={20} className="text-indigo-600" />
            {t.productsTitle}: {employee.name}
          </h2>
          <button onClick={onClose}><X size={20} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
          {renderContent()}
        </div>
      </div>

      <ConfirmDialog
        isOpen={!!productToDelete}
        title={t.confirmDeleteTitle || "Delete Product?"}
        message={t.confirmDeleteMsg || "Are you sure you want to permanently delete this product from your list?"}
        onConfirm={handleConfirmDelete}
        onCancel={() => setProductToDelete(null)}
        isLoading={isDeleting}
        confirmText={t.deleteBtn || "Delete"}
        cancelText={t.cancel || "Cancel"}
      />
    </div>
  );
}