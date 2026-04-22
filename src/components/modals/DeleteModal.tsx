import React from 'react';
import { Trash2 } from 'lucide-react';

interface DeleteModalProps {
  type: 'product' | 'sale';
  onConfirm: () => void;
  onCancel: () => void;
}

export default function DeleteModal({ type, onConfirm, onCancel }: DeleteModalProps) {
  const isProduct = type === 'product';

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 z-50 print:hidden transition-opacity">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-8 text-center border border-slate-100 animate-fade-in-down">
        <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <Trash2 size={36} className="text-rose-500" />
        </div>
        <h2 className="text-2xl font-black text-slate-800 mb-3">{isProduct ? 'إزالة العنصر؟' : 'حذف الفاتورة؟'}</h2>
        <p className="text-slate-500 font-medium mb-8 leading-relaxed">
          {isProduct 
            ? 'بمجرد الحذف لا يمكن التراجع. سيتم إزالة هذا العنصر من المخزون تماماً.' 
            : 'هل أنت متأكد؟ سيتم استرجاع المنتجات للمخزون وسحب أموال هذه العملية من الدرج فوراً.'}
        </p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="px-5 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-bold flex-1 transition-colors">إلغاء</button>
          <button onClick={onConfirm} className="px-5 py-3.5 bg-rose-500 hover:bg-rose-600 text-white rounded-2xl font-bold flex-1 shadow-lg shadow-rose-500/30 transition-colors active:scale-95">تأكيد الحذف</button>
        </div>
      </div>
    </div>
  );
}
