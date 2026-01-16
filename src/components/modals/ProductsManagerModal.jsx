
import { useEffect, useState } from "react";
import { collection, addDoc, doc, onSnapshot, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { appId, db } from "../../config/firebase";
import { Package, Plus, ShoppingBag, Trash2, X, Lock, Upload, Loader2 } from "lucide-react";
import { isItemLocked } from "../../utils/planHelpers";
import { uploadToWordPress } from "../../services/wordpressStorage";

export default function ProductsManagerModal({ userId, employee, onClose, t, user, onUpgrade }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newProduct, setNewProduct] = useState({ name: '', price: '', description: '', imageUrl: '', link: '' });

  const [isAdding, setIsAdding] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const url = await uploadToWordPress(file);
      setNewProduct(prev => ({ ...prev, imageUrl: url }));
    } catch (error) {
      alert("Upload failed: " + error.message);
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
      else alert(t.upgradeMsg);
      return;
    }

    setIsAdding(true);
    try {
      await addDoc(collection(db, 'artifacts', appId, 'users', userId, 'employees', employee.id, 'products'), {
        ...newProduct,
        createdAt: serverTimestamp()
      });
      setNewProduct({ name: '', price: '', description: '', imageUrl: '', link: '' });
    } catch (error) {
      console.error(error);
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteProduct = async (prodId) => {
    if (window.confirm('Delete product?')) {
      try {
        await deleteDoc(doc(db, 'artifacts', appId, 'users', userId, 'employees', employee.id, 'products', prodId));
      } catch (error) { console.error(error); }
    }
  };

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
          {/* Add Form */}
          <form onSubmit={handleAddProduct} className="bg-white p-4 rounded-xl border border-slate-200 mb-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2"><Plus size={16} /> {t.addProduct}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input required value={newProduct.name} onChange={e => setNewProduct({ ...newProduct, name: e.target.value })} className="px-3 py-2 border rounded-lg text-sm" placeholder={t.prodName} />
              <input value={newProduct.price} onChange={e => setNewProduct({ ...newProduct, price: e.target.value })} className="px-3 py-2 border rounded-lg text-sm" placeholder={t.prodPrice} />
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
          {loading ? <div className="text-center py-4">{t.loading}</div> : (
            products.length === 0 ? <div className="text-center text-slate-400 py-4">{t.noProducts}</div> : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {products.map((prod, index) => {
                  const isLocked = isItemLocked(index, user);
                  return (
                    <div key={prod.id} className="relative">
                      <div className="bg-white p-3 rounded-xl border border-slate-200 flex gap-3 relative group">
                        <div className="w-16 h-16 bg-slate-100 rounded-lg overflow-hidden flex-shrink-0">
                          {prod.imageUrl ? <img src={prod.imageUrl} className="w-full h-full object-cover" alt={prod.name} /> : <Package className="w-full h-full p-4 text-slate-300" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-slate-800 truncate">{prod.name}</div>
                          <div className="text-indigo-600 text-sm font-bold">{prod.price} {t.currency}</div>
                          <p className="text-xs text-slate-500 line-clamp-2">{prod.description}</p>
                        </div>
                        {!isLocked && (
                          <button onClick={() => handleDeleteProduct(prod.id)} className="absolute top-2 right-2 p-1.5 bg-red-50 text-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
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
        </div>
      </div>
    </div>
  );
}