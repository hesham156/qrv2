import React from 'react';
import { ShoppingBag, Package, ArrowRight } from 'lucide-react';

export default function ProductsView({ employees, onManageProducts, t }) {
    const visibleEmployees = employees.filter(emp => !emp.hidden);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <ShoppingBag className="text-indigo-600" />
                        {t.productsTitle || "Products & Services"}
                    </h2>
                    <p className="text-slate-500 mt-1">
                        {t.productsSubtitle || "Manage products and services for each of your digital cards."}
                    </p>
                </div>
            </div>

            {/* Cards Grid */}
            {visibleEmployees.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300">
                    <div className="w-16 h-16 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Package size={32} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 mb-2">{t.noCards || "No cards found"}</h3>
                    <p className="text-slate-500 mb-6">{t.noCardsSub || "Create a card first to add products."}</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {visibleEmployees.map((emp) => (
                        <div key={emp.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow group">

                            {/* Card Preview Header */}
                            <div className="h-24 bg-gradient-to-r from-indigo-500 to-purple-600 relative p-4 flex items-center justify-center">
                                {emp.photoUrl ? (
                                    <img
                                        src={emp.photoUrl}
                                        alt={emp.name}
                                        className="w-16 h-16 rounded-full border-4 border-white shadow-sm object-cover bg-white absolute -bottom-8"
                                    />
                                ) : (
                                    <div className="w-16 h-16 rounded-full border-4 border-white shadow-sm bg-indigo-100 flex items-center justify-center text-indigo-500 font-bold text-xl absolute -bottom-8">
                                        {emp.name?.charAt(0) || '?'}
                                    </div>
                                )}
                            </div>

                            {/* Card Content */}
                            <div className="pt-10 pb-6 px-6 text-center space-y-1">
                                <h3 className="font-bold text-slate-800 text-lg truncate">{emp.name}</h3>
                                <p className="text-sm text-slate-500 truncate">{emp.jobTitle}</p>
                                <div className="pt-4 flex justify-center">
                                    <button
                                        onClick={() => onManageProducts(emp)}
                                        className="flex items-center gap-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-4 py-2 rounded-lg font-bold text-sm transition-colors w-full justify-center"
                                    >
                                        <ShoppingBag size={16} />
                                        {t.manageProducts || "Manage Products"}
                                        <ArrowRight size={16} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
