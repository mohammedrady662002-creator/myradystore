import React from 'react';
import { X } from 'lucide-react';

interface BalanceEditModalProps {
  balanceEditForm: any;
  setBalanceEditForm: (form: any) => void;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export default function BalanceEditModal({ balanceEditForm, setBalanceEditForm, onClose, onSubmit }: BalanceEditModalProps) {
  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 z-50 print:hidden transition-opacity">
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-sm overflow-hidden flex flex-col border border-slate-100 animate-fade-in-down">
        <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-indigo-50/50">
          <h2 className="text-xl font-black text-indigo-900">ضبط الأرصدة يدوياً</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-indigo-100/50 text-indigo-600 hover:bg-rose-500 hover:text-white transition-colors"><X size={18}/></button>
        </div>
        <div className="p-8">
          <form id="balanceEditForm" onSubmit={onSubmit} className="space-y-5">
            <div><label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">رصيد الدرج الفعلي (كاش)</label><input required type="number" value={balanceEditForm.cash} onChange={e => setBalanceEditForm({...balanceEditForm, cash: Number(e.target.value)})} className="w-full p-4 border-2 border-slate-100 rounded-2xl bg-slate-50 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none font-black text-xl text-center transition-all" /></div>
            <div><label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">رصيد المحافظ الفعلي</label><input required type="number" value={balanceEditForm.digital} onChange={e => setBalanceEditForm({...balanceEditForm, digital: Number(e.target.value)})} className="w-full p-4 border-2 border-slate-100 rounded-2xl bg-slate-50 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none font-black text-xl text-center transition-all" /></div>
          </form>
        </div>
        <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
          <button onClick={onClose} className="px-6 py-3.5 bg-white border border-slate-200 rounded-2xl font-bold text-slate-600 hover:bg-slate-50 transition-colors">إلغاء</button>
          <button type="submit" form="balanceEditForm" className="px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold shadow-lg shadow-indigo-600/30 transition-colors active:scale-95">تحديث الآن</button>
        </div>
      </div>
    </div>
  );
}
