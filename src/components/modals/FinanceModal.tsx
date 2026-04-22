import React from 'react';
import { X, ArrowRightLeft, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';

interface FinanceModalProps {
  financeForm: any;
  setFinanceForm: (form: any) => void;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export default function FinanceModal({ financeForm, setFinanceForm, onClose, onSubmit }: FinanceModalProps) {
  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 z-50 print:hidden transition-opacity">
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden flex flex-col animate-fade-in-down border border-slate-100">
        <div className="flex justify-between p-6 border-b border-slate-100 bg-emerald-50/50 text-emerald-900">
          <h2 className="text-xl font-black flex items-center gap-2"><ArrowRightLeft size={20} className="text-emerald-600" /> تسجيل معاملة مالية</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-emerald-100/50 text-emerald-600 hover:bg-rose-500 hover:text-white transition-colors"><X size={18} /></button>
        </div>
        <div className="p-8">
          <form id="financeForm" onSubmit={onSubmit} className="space-y-6">
            <div className="space-y-3">
              <label className="block text-xs font-black text-slate-500 uppercase tracking-wider">نوع العملية</label>
              <div className="grid grid-cols-2 gap-4">
                <label className={`cursor-pointer border-2 p-4 rounded-2xl flex flex-col items-center gap-2 transition-all ${financeForm.type === 'receive' ? 'border-rose-500 bg-rose-50 text-rose-700 shadow-sm' : 'border-slate-100 text-slate-400 hover:bg-slate-50 hover:border-slate-200'}`}>
                  <input type="radio" name="type" value="receive" className="hidden" checked={financeForm.type === 'receive'} onChange={(e) => setFinanceForm({...financeForm, type: e.target.value})} />
                  <ArrowDownCircle size={28} />
                  <span className="font-bold text-sm">استلام (سحب)</span>
                </label>
                <label className={`cursor-pointer border-2 p-4 rounded-2xl flex flex-col items-center gap-2 transition-all ${financeForm.type === 'send' ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm' : 'border-slate-100 text-slate-400 hover:bg-slate-50 hover:border-slate-200'}`}>
                  <input type="radio" name="type" value="send" className="hidden" checked={financeForm.type === 'send'} onChange={(e) => setFinanceForm({...financeForm, type: e.target.value})} />
                  <ArrowUpCircle size={28} />
                  <span className="font-bold text-sm">تحويل (إيداع)</span>
                </label>
              </div>
            </div>
            <div>
              <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">الجهة</label>
              <select value={financeForm.method} onChange={e => setFinanceForm({...financeForm, method: e.target.value})} className="w-full p-3.5 border-2 border-slate-100 rounded-2xl bg-slate-50 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none font-bold text-slate-700 cursor-pointer transition-all">
                <option value="vodafone">فودافون كاش</option>
                <option value="instapay">انستا باي</option>
                <option value="bank">تحويل بنكي</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">المبلغ الأساسي</label><input required type="number" min="1" step="0.5" value={financeForm.amount} onChange={e => setFinanceForm({...financeForm, amount: e.target.value})} className="w-full p-3.5 border-2 border-slate-100 rounded-2xl bg-slate-50 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none font-black text-center text-lg transition-all" /></div>
              <div><label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">عمولتك</label><input required type="number" min="0" step="0.5" value={financeForm.commission} onChange={e => setFinanceForm({...financeForm, commission: e.target.value})} className="w-full p-3.5 border-2 border-emerald-100 rounded-2xl bg-emerald-50 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none text-emerald-700 font-black text-center text-lg transition-all" /></div>
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-black text-slate-500 uppercase tracking-wider">ملاحظات إضافية</label>
              <input type="text" value={financeForm.notes} onChange={e => setFinanceForm({...financeForm, notes: e.target.value})} className="w-full p-3.5 border-2 border-slate-100 rounded-2xl bg-slate-50 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none font-medium transition-all" placeholder="رقم المحول، تفاصيل..." />
            </div>
          </form>
        </div>
        <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
          <button onClick={onClose} className="px-6 py-3.5 bg-white border border-slate-200 rounded-2xl font-bold text-slate-600 hover:bg-slate-50 transition-colors">إلغاء</button>
          <button type="submit" form="financeForm" className="px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold shadow-lg shadow-emerald-600/30 transition-all active:scale-95">تأكيد وتنفيذ</button>
        </div>
      </div>
    </div>
  );
}
