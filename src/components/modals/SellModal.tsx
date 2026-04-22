import React from 'react';
import { X, ShoppingCart, Edit, CheckCircle2 } from 'lucide-react';
import { Product, Sale, Category } from '../../types';

interface SellModalProps {
  editingSale: Sale | null;
  sellForm: any;
  setSellForm: (form: any) => void;
  products: Product[];
  currentSellProduct: Product | undefined;
  activeTab: Category;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  calcFinalPrice: number;
  calcEstimatedProfit: number;
  isOwner: boolean;
}

export default function SellModal({
  editingSale, sellForm, setSellForm, products, currentSellProduct, activeTab,
  onClose, onSubmit, calcFinalPrice, calcEstimatedProfit, isOwner
}: SellModalProps) {
  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 z-50 print:hidden transition-opacity">
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden flex flex-col animate-fade-in-down border border-slate-100">
        <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-indigo-50/50">
          <h2 className="text-xl font-black text-indigo-900 flex items-center gap-2">
            {editingSale ? <Edit size={20} className="text-indigo-600" /> : <ShoppingCart size={20} className="text-indigo-600" />} 
            {editingSale ? 'تعديل فاتورة' : 'فاتورة مبيعات جديدة'}
          </h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-indigo-100/50 text-indigo-600 hover:bg-rose-500 hover:text-white transition-colors"><X size={18} /></button>
        </div>
        <div className="p-8">
          <form id="sellForm" onSubmit={onSubmit} className="space-y-6">
            <div>
              <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">المنتج / الخدمة <span className="text-rose-500">*</span></label>
              <select 
                required 
                value={sellForm.productId} 
                disabled={editingSale !== null} 
                onChange={e => {
                  const p = products.find(x => x.id === e.target.value);
                  setSellForm({...sellForm, productId: e.target.value, unitPrice: p?.sellingPrice || ''});
                }} 
                className="w-full p-4 border-2 border-slate-100 rounded-2xl bg-slate-50 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none font-bold text-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                <option value="" disabled>-- حدد العنصر المباع --</option>
                {products.filter(p => p.category === activeTab || (editingSale && p.id === editingSale.productId)).map(p => (
                  <option key={p.id} value={p.id}>{p.name} {['accessories', 'hardware'].includes(p.category) ? `(المتاح بالمخزن: ${p.quantity + (editingSale && p.id === editingSale.productId ? editingSale.quantity : 0)})` : ''}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-5">
              <div><label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">الكمية المباعة</label><input required type="number" min="1" max={currentSellProduct && ['accessories', 'hardware'].includes(currentSellProduct.category) ? currentSellProduct.quantity + (editingSale ? editingSale.quantity : 0) : undefined} value={sellForm.quantity} onChange={e => setSellForm({...sellForm, quantity: Number(e.target.value)})} className="w-full p-3.5 border-2 border-slate-100 rounded-2xl bg-slate-50 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none text-center font-black text-xl transition-all" /></div>
              <div><label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">سعر الوحدة</label><input required type="number" min="0" step="0.5" value={sellForm.unitPrice} onChange={e => setSellForm({...sellForm, unitPrice: Number(e.target.value)})} className="w-full p-3.5 border-2 border-slate-100 rounded-2xl bg-slate-50 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none text-center font-black text-xl transition-all" /></div>
            </div>
            <div className="grid grid-cols-2 gap-5 items-end p-5 bg-slate-50/80 rounded-2xl border border-slate-100">
              <div><label className="block text-xs font-black text-rose-500 uppercase tracking-wider mb-2">خصم (ج.م)</label><input type="number" min="0" step="0.5" value={sellForm.discount} onChange={e => setSellForm({...sellForm, discount: Number(e.target.value)})} className="w-full p-3.5 border-2 border-rose-100 rounded-xl bg-white focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 outline-none text-rose-600 text-center font-black transition-all" placeholder="0.00" /></div>
              <div className="text-center relative">
                <span className="block text-[10px] font-black text-indigo-400 uppercase tracking-wider mb-1">الصافي للدفع</span>
                <span className="font-black text-3xl text-indigo-700">{calcFinalPrice.toFixed(1)}</span>
                {isOwner && calcEstimatedProfit > 0 && currentSellProduct?.wholesalePrice && <span className="absolute -bottom-6 left-0 right-0 text-[10px] bg-emerald-100 text-emerald-700 font-bold py-1 rounded-md border border-emerald-200">الربح: +{calcEstimatedProfit} ج</span>}
              </div>
            </div>
            <div>
              <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">خزينة الدفع</label>
              <select value={sellForm.method} onChange={e => setSellForm({...sellForm, method: e.target.value})} className="w-full p-3.5 border-2 border-slate-100 rounded-2xl bg-slate-50 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none font-bold text-slate-700 transition-all cursor-pointer">
                <option value="cash">درج الكاش (نقدي)</option>
                <option value="vodafone">فودافون كاش</option>
                <option value="instapay">انستا باي</option>
                <option value="bank">تحويل بنكي مباشر</option>
              </select>
            </div>
          </form>
        </div>
        <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3 mt-4">
          <button onClick={onClose} className="px-6 py-3.5 bg-white border border-slate-200 rounded-2xl font-bold text-slate-600 hover:bg-slate-50 transition-colors">إلغاء</button>
          <button type="submit" form="sellForm" className="px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black shadow-lg shadow-indigo-600/30 transition-all active:scale-95 flex items-center gap-2"><CheckCircle2 size={18}/> {editingSale ? 'تحديث الفاتورة' : 'تأكيد ودفع'}</button>
        </div>
      </div>
    </div>
  );
}
