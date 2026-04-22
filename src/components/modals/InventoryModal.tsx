import React, { useRef } from 'react';
import { X, Box, ImageIcon, Sparkles, CheckCircle2 } from 'lucide-react';
import { Product } from '../../types';

interface InventoryModalProps {
  editingProduct: Product | null;
  formData: any;
  setFormData: (data: any) => void;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  onGenerateDescription: () => void;
  onDiagnoseIssue: () => void;
  isGeneratingAi: boolean;
  isDiagnosingAi: boolean;
}

export default function InventoryModal({
  editingProduct, formData, setFormData, onClose, onSubmit,
  onGenerateDescription, onDiagnoseIssue, isGeneratingAi, isDiagnosingAi
}: InventoryModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setFormData({ ...formData, imageUrl: url });
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 z-50 print:hidden transition-opacity">
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] animate-fade-in-down border border-slate-100">
        <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50/50">
          <h2 className="text-xl font-black text-slate-800 flex items-center gap-2"><Box size={20} className="text-indigo-600" />{editingProduct ? 'تعديل السجل' : 'إضافة سجل جديد'}</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-200 text-slate-500 hover:bg-rose-500 hover:text-white transition-colors"><X size={18} /></button>
        </div>
        <div className="p-8 overflow-y-auto custom-scrollbar">
          <form id="inventoryForm" onSubmit={onSubmit} className="space-y-6">
            <div className="flex flex-col items-center justify-center">
              <div 
                className="w-32 h-32 rounded-3xl border-2 border-dashed border-slate-300 bg-slate-50 flex flex-col items-center justify-center overflow-hidden relative group cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 transition-colors" 
                onClick={() => fileInputRef.current?.click()}
              >
                {formData.imageUrl ? (
                  <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <>
                    <ImageIcon className="text-slate-400 mb-2 group-hover:text-indigo-400 transition-colors" size={32} />
                    <span className="text-[10px] text-slate-500 font-bold text-center px-2">صورة المنتج</span>
                  </>
                )}
                <div className="absolute inset-0 bg-slate-900/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-white text-xs font-bold">تغيير الصورة</span>
                </div>
              </div>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">القسم</label>
                <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full p-3.5 border-2 border-slate-100 rounded-2xl bg-slate-50 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none font-bold text-slate-700 transition-all cursor-pointer">
                  <option value="accessories">إكسسوارات الموبايل</option>
                  <option value="hardware">قطع غيار داخلي</option>
                  <option value="maintenance">عمليات الصيانة</option>
                  <option value="software">خدمات السوفت وير</option>
                </select>
              </div>
              <div><label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">الاسم <span className="text-rose-500">*</span></label><input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-3.5 border-2 border-slate-100 rounded-2xl bg-slate-50 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none font-bold transition-all" /></div>
              <div><label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">الكود <span className="text-rose-500">*</span></label><input required type="text" value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} className="w-full p-3.5 border-2 border-slate-100 rounded-2xl bg-slate-50 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none font-bold transition-all font-mono" /></div>
              <div><label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">التكلفة/الجملة <span className="text-rose-500">*</span></label><input required type="number" min="0" step="0.5" value={formData.wholesalePrice} onChange={e => setFormData({...formData, wholesalePrice: Number(e.target.value)})} className="w-full p-3.5 border-2 border-slate-100 rounded-2xl bg-slate-50 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none font-black text-slate-700 transition-all text-center" /></div>
              <div><label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">سعر البيع المقترح <span className="text-rose-500">*</span></label><input required type="number" min="0" step="0.5" value={formData.sellingPrice} onChange={e => setFormData({...formData, sellingPrice: Number(e.target.value)})} className="w-full p-3.5 border-2 border-emerald-100 rounded-2xl bg-emerald-50/50 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none font-black text-emerald-700 transition-all text-center" /></div>
              <div className="md:col-span-2"><label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">الكمية المتاحة <span className="text-rose-500">*</span></label><input required type="number" min="0" value={formData.quantity} onChange={e => setFormData({...formData, quantity: Number(e.target.value)})} className="w-full p-3.5 border-2 border-slate-100 rounded-2xl bg-slate-50 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none font-bold transition-all text-center" /></div>
              <div className="md:col-span-2">
                <div className="flex justify-between items-end mb-2">
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-wider">ملاحظات / تفاصيل</label>
                  <div className="flex gap-2">
                    {['accessories', 'hardware'].includes(formData.category) && <button type="button" onClick={onGenerateDescription} disabled={isGeneratingAi} className="text-[10px] bg-indigo-50 hover:bg-indigo-100 text-indigo-600 px-3 py-1.5 rounded-lg font-black flex items-center gap-1 transition-colors disabled:opacity-50"><Sparkles size={12} /> {isGeneratingAi ? 'جاري التوليد...' : 'توليد وصف بالذكاء الاصطناعي'}</button>}
                    {['maintenance', 'software'].includes(formData.category) && <button type="button" onClick={onDiagnoseIssue} disabled={isDiagnosingAi} className="text-[10px] bg-blue-50 hover:bg-blue-100 text-blue-600 px-3 py-1.5 rounded-lg font-black flex items-center gap-1 transition-colors disabled:opacity-50"><Sparkles size={12} /> {isDiagnosingAi ? 'جاري التشخيص...' : 'تشخيص العطل'}</button>}
                  </div>
                </div>
                <textarea rows={3} value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} className="w-full p-4 border-2 border-slate-100 rounded-2xl bg-slate-50 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none font-medium transition-all resize-none"></textarea>
              </div>
            </div>
          </form>
        </div>
        <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
          <button onClick={onClose} className="px-6 py-3.5 bg-white border border-slate-200 rounded-2xl font-bold text-slate-600 hover:bg-slate-50 transition-colors">إلغاء</button>
          <button type="submit" form="inventoryForm" className="px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition-all active:scale-95"><CheckCircle2 size={18} /> {editingProduct ? 'حفظ التعديلات' : 'إضافة للسيستم'}</button>
        </div>
      </div>
    </div>
  );
}
