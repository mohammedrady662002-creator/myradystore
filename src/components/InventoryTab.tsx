import React, { useState } from 'react';
import { Box, Search, Plus, ShoppingCart, Edit, Trash2, ImageIcon, Receipt, CheckCircle2, ChevronRight, X } from 'lucide-react';
import { Product, Sale, Category, User } from '../types';
import { useStore } from '../lib/store';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface InventoryTabProps {
  products: Product[];
  sales: Sale[];
  activeTab: Category;
  viewMode: 'inventory' | 'sales';
  setViewMode: (mode: 'inventory' | 'sales') => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onOpenModal: (product?: Product) => void;
  onOpenSellModal: (product?: Product, sale?: Sale) => void;
  setProductToDelete: (id: string) => void;
  setSaleToDelete: (id: string) => void;
  currentUser: User;
  formatDateTime: (date: string) => string;
  getMethodName: (method: string) => string;
}

export default function InventoryTab({ 
  products, sales, activeTab, viewMode, setViewMode, searchQuery, setSearchQuery,
  onOpenModal, onOpenSellModal, setProductToDelete, setSaleToDelete, currentUser,
  formatDateTime, getMethodName
}: InventoryTabProps) {
  const isOwner = currentUser?.role === 'owner';
  const { bulkDeleteProducts } = useStore();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isDeletingBulk, setIsDeletingBulk] = useState(false);

  const filteredProducts = products.filter(product => {
    const matchesCategory = product.category === activeTab;
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         product.code.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  }).sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }));

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredProducts.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredProducts.map(p => p.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = async () => {
    if (!confirm(`هل أنت متأكد من حذف ${selectedIds.length} عنصر؟ لا يمكن التراجع عن هذه الخطوة.`)) return;
    
    setIsDeletingBulk(true);
    try {
      await bulkDeleteProducts(selectedIds);
      setSelectedIds([]);
    } catch (err) {
      alert('حدث خطأ أثناء الحذف الجماعي');
    } finally {
      setIsDeletingBulk(false);
    }
  };

  const totalStock = filteredProducts.reduce((sum, p) => sum + Number(p.quantity || 0), 0);

  return (
    <div className="animate-fade-in print:hidden relative">
      {/* Floating Bulk Action Bar */}
      <AnimatePresence>
        {selectedIds.length > 0 && viewMode === 'inventory' && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-24 lg:bottom-10 left-1/2 -translate-x-1/2 z-[100] bg-slate-900 text-white px-8 py-5 rounded-[2.5rem] shadow-2xl flex items-center gap-8 border border-white/10"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center font-black text-xs">
                {selectedIds.length}
              </div>
              <span className="font-bold text-sm">عناصر مختارة</span>
            </div>
            
            <div className="w-px h-8 bg-white/10" />
            
            <div className="flex items-center gap-4">
              <button 
                onClick={handleBulkDelete}
                disabled={isDeletingBulk}
                className="flex items-center gap-2 text-rose-400 hover:text-rose-500 font-black text-xs transition-colors disabled:opacity-50"
              >
                <Trash2 size={18} />
                <span>حذف جماعي</span>
              </button>
              
              <button 
                onClick={() => setSelectedIds([])}
                className="flex items-center gap-2 text-slate-400 hover:text-white font-black text-xs transition-colors"
              >
                <X size={18} />
                <span>إلغاء</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col xl:flex-row justify-between items-center gap-4 mb-8">
        <div className="flex bg-slate-200/50 p-1.5 rounded-2xl w-full xl:w-auto border border-slate-200">
          <button onClick={() => setViewMode('inventory')} className={`flex-1 xl:flex-none px-6 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${viewMode === 'inventory' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}><Box size={18} /> المخزون والخدمات</button>
          <button onClick={() => setViewMode('sales')} className={`flex-1 xl:flex-none px-6 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${viewMode === 'sales' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}><Receipt size={18} /> سجل المبيعات</button>
        </div>

        <div className="w-full xl:w-1/3 relative group">
          <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-500 transition-colors"><Search size={20} /></div>
          <input type="text" placeholder="بحث بالاسم، الباركود..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-white border border-slate-200 rounded-2xl py-3.5 pr-12 pl-4 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 shadow-sm font-medium transition-all" />
        </div>
        
        <div className="flex items-center gap-3 w-full xl:w-auto">
          {viewMode === 'inventory' ? (
            <>
              <div className="bg-white border border-slate-200 rounded-2xl px-5 py-2.5 flex items-center gap-3 shadow-sm hidden md:flex">
                <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600"><Box size={16}/></div>
                <div>
                  <span className="block text-[10px] font-bold text-slate-400 uppercase">إجمالي العناصر</span>
                  <span className="font-black text-slate-800 leading-none">{totalStock}</span>
                </div>
              </div>
              {isOwner && (
                <button onClick={() => onOpenModal()} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3.5 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-500/25 active:scale-95 flex-1 xl:flex-none">
                  <Plus size={20} /><span>سجل جديد</span>
                </button>
              )}
            </>
          ) : (
            <button onClick={() => onOpenSellModal()} className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3.5 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/25 active:scale-95 flex-1 xl:flex-none">
              <ShoppingCart size={20} /><span>تسجيل بيع جديد</span>
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-200/60 overflow-hidden">
        {viewMode === 'inventory' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-200/80 text-slate-500 text-xs uppercase tracking-wider font-black">
                  {isOwner && (
                    <th className="p-5 w-12 text-center">
                      <input 
                        type="checkbox" 
                        checked={selectedIds.length > 0 && selectedIds.length === filteredProducts.length}
                        onChange={toggleSelectAll}
                        className="w-5 h-5 rounded-lg border-2 border-slate-200 text-primary focus:ring-primary transition-all cursor-pointer"
                      />
                    </th>
                  )}
                  <th className="p-5 w-24 text-center">الصورة</th>
                  <th className="p-5">التفاصيل</th>
                  <th className="p-5 w-32 text-center">الكود / QR</th>
                  <th className="p-5 w-24 text-center">الرصيد</th>
                  <th className="p-5 text-center">{isOwner ? 'السعر (جملة / بيع)' : 'سعر البيع'}</th>
                  <th className="p-5 w-32 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.map((product) => (
                  <tr 
                    key={product.id} 
                    className={cn(
                      "hover:bg-slate-50/80 transition-colors group",
                      selectedIds.includes(product.id) && "bg-primary/5 hover:bg-primary/5"
                    )}
                  >
                    {isOwner && (
                      <td className="p-5 text-center">
                        <input 
                          type="checkbox" 
                          checked={selectedIds.includes(product.id)}
                          onChange={() => toggleSelectOne(product.id)}
                          className="w-5 h-5 rounded-lg border-2 border-slate-200 text-primary focus:ring-primary transition-all cursor-pointer"
                        />
                      </td>
                    )}
                    <td className="p-5 text-center">
                      <div className="w-14 h-14 rounded-2xl bg-slate-100 border border-slate-200 overflow-hidden mx-auto flex items-center justify-center shadow-sm">
                        {product.imageUrl ? <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" /> : <ImageIcon className="text-slate-300" size={20} />}
                      </div>
                    </td>
                    <td className="p-5">
                      <h3 className="font-bold text-slate-800 text-base mb-1">{product.name}</h3>
                      {product.notes && <p className="text-xs font-medium text-slate-400 line-clamp-2">{product.notes}</p>}
                    </td>
                    <td className="p-5 text-center">
                      <div className="flex flex-col items-center gap-1.5">
                        <span className="px-2.5 py-1 bg-slate-100 text-slate-600 font-mono font-bold rounded-lg text-xs border border-slate-200/50">#{product.code}</span>
                        <img src={`https://api.qrserver.com/v1/create-qr-code/?size=60x60&data=${encodeURIComponent(product.code)}`} alt="QR" className="w-10 h-10 rounded-lg p-1 bg-white border border-slate-200 shadow-sm" />
                      </div>
                    </td>
                    <td className="p-5 text-center">
                      <span className={`inline-flex items-center justify-center min-w-[3rem] h-8 px-2 rounded-xl font-bold text-sm ${Number(product.quantity) <= 5 ? 'bg-rose-50 text-rose-600 ring-1 ring-rose-500/20' : 'bg-slate-100 text-slate-700'}`}>{product.quantity}</span>
                    </td>
                    <td className="p-5 text-center font-bold text-sm">
                      <div className="flex flex-col items-center gap-1.5">
                        {isOwner && <span className="text-slate-500 bg-slate-50 border border-slate-200/60 px-2 py-1 rounded-lg w-full text-xs" title="سعر التكلفة/الجملة">ج: {product.wholesalePrice || '-'}</span>}
                        <span className="text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-1 rounded-lg w-full text-xs" title="سعر البيع المقترح">{isOwner ? 'ب: ' : ''}{product.sellingPrice ? `${product.sellingPrice} ج` : '-'}</span>
                      </div>
                    </td>
                    <td className="p-5 text-center">
                      <div className="flex items-center justify-center gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
                        <button onClick={() => onOpenSellModal(product)} className="w-9 h-9 flex items-center justify-center text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 rounded-xl transition-colors" title="تسجيل بيع سريع"><ShoppingCart size={18} /></button>
                        {isOwner && (
                          <>
                            <button onClick={() => onOpenModal(product)} className="w-9 h-9 flex items-center justify-center text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700 rounded-xl transition-colors" title="تعديل"><Edit size={18} /></button>
                            <button onClick={() => setProductToDelete(product.id)} className="w-9 h-9 flex items-center justify-center text-rose-500 hover:bg-rose-50 hover:text-rose-600 rounded-xl transition-colors" title="حذف"><Trash2 size={18} /></button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-200/80 text-slate-500 text-xs uppercase tracking-wider font-black">
                  <th className="p-5">رقم العملية</th>
                  <th className="p-5">المنتج / الخدمة</th>
                  <th className="p-5 text-center">الكمية</th>
                  <th className="p-5 text-center">السعر</th>
                  <th className="p-5 text-center">الخصم</th>
                  <th className="p-5 text-center">الصافي</th>
                  <th className="p-5 text-center">الدفع</th>
                  <th className="p-5 text-center">الوقت</th>
                  {isOwner && <th className="p-5 text-center">الإجراءات</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sales.filter(s => s.category === activeTab).map((sale) => (
                  <tr key={sale.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="p-5 font-mono text-xs font-bold text-slate-400">#{sale.id.slice(-6)}</td>
                    <td className="p-5 font-bold text-slate-800 text-sm">{sale.productName}</td>
                    <td className="p-5 text-center font-bold text-slate-600">{sale.quantity}</td>
                    <td className="p-5 text-center font-bold text-slate-400 line-through decoration-slate-300 decoration-2">{sale.totalBasePrice}</td>
                    <td className="p-5 text-center font-bold text-rose-500 bg-rose-50/30">{sale.discount > 0 ? `-${sale.discount}` : '-'}</td>
                    <td className="p-5 text-center font-black text-emerald-600 bg-emerald-50/30">{sale.finalPrice} <span className="text-[10px] text-emerald-500 font-normal">ج</span></td>
                    <td className="p-5 text-center text-xs font-bold text-slate-500"><span className="bg-slate-100 px-2 py-1 rounded-lg border border-slate-200">{getMethodName(sale.method)}</span></td>
                    <td className="p-5 text-center text-xs text-slate-400 font-bold whitespace-nowrap" dir="ltr">{formatDateTime(sale.date)}</td>
                    {isOwner && (
                      <td className="p-5 text-center">
                        <div className="flex items-center justify-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all">
                          <button onClick={() => onOpenSellModal(undefined, sale)} className="w-8 h-8 flex items-center justify-center text-indigo-600 hover:bg-indigo-50 rounded-lg"><Edit size={14} /></button>
                          <button onClick={() => setSaleToDelete(sale.id)} className="w-8 h-8 flex items-center justify-center text-rose-500 hover:bg-rose-50 rounded-lg"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
