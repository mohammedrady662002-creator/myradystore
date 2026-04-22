import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  Search, 
  HandCoins, 
  Phone, 
  Calendar, 
  ChevronRight, 
  Plus, 
  X, 
  Check, 
  Trash2,
  ArrowDownLeft,
  ArrowUpRight,
  History,
  CreditCard,
  ShoppingCart,
  Image as ImageIcon
} from 'lucide-react';
import { useStore, Customer, Sale } from '../lib/store';
import { cn, formatCurrency, generateId, formatArabicDate } from '../lib/utils';
import { ImageUpload } from '../components/ImageUpload';

export default function Customers() {
  const { customers, sales, transactions, addCustomer, updateCustomer, deleteCustomer, currentUser, addTransaction } = useStore();
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showHistoryCustomer, setShowHistoryCustomer] = useState<Customer | null>(null);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const [actionType, setActionType] = useState<'pay' | 'add_debt'>('pay');
  const [payAmount, setPayAmount] = useState<number>(0);
  const [transactionNote, setTransactionNote] = useState('');
  const [proofImageUrl, setProofImageUrl] = useState('');
  const isOwner = currentUser?.role === 'owner';

  const filteredCustomers = useMemo(() => {
    return customers.filter(c => 
      c.name.toLowerCase().includes(search.toLowerCase()) || 
      c.phone?.includes(search)
    ).sort((a, b) => b.totalDebt - a.totalDebt);
  }, [customers, search]);

  const customerStats = useMemo(() => {
    const totals = customers.reduce((acc, c) => {
      const debt = c.totalDebt || 0;
      if (debt > 0) acc.totalDebt += debt;
      else acc.totalCredit += Math.abs(debt);
      return acc;
    }, { totalDebt: 0, totalCredit: 0 });

    return {
      ...totals,
      count: customers.length,
      indebtedCount: customers.filter(c => c.totalDebt > 0).length,
      creditedCount: customers.filter(c => c.totalDebt < 0).length
    };
  }, [customers]);

  const handlePayDebt = async () => {
    if (!selectedCustomer || payAmount <= 0) return;
    
    try {
      const isAdding = actionType === 'add_debt';
      const updatedDebt = isAdding 
        ? (selectedCustomer.totalDebt || 0) + payAmount
        : (selectedCustomer.totalDebt || 0) - payAmount;
      
      await updateCustomer({
        ...selectedCustomer,
        totalDebt: updatedDebt
      });
      
      // Add a transaction to reflect the debt change in financial totals
      await addTransaction({
        id: generateId(),
        type: isAdding ? 'withdraw' : 'transfer',
        amount: payAmount,
        commission: 0,
        sourceAccount: isAdding ? 'cash' : 'debt',
        destinationAccount: isAdding ? 'debt' : 'cash',
        date: new Date().toISOString(),
        customerId: selectedCustomer.id,
        proofImageUrl: proofImageUrl || undefined,
        notes: transactionNote || (isAdding 
          ? `زيادة مديونية: ${selectedCustomer.name}` 
          : `تحصيل جزء من مديونية: ${selectedCustomer.name}`)
      });
      
      setPayAmount(0);
      setTransactionNote('');
      setProofImageUrl('');
      setSelectedCustomer(null);
      alert('تمت العملية بنجاح وتحديث السجلات المالية');
    } catch (err) {
      alert('حدث خطأ أثناء تنفيذ العملية');
    }
  };

  return (
    <div className="space-y-12 pb-32 lg:pb-12" dir="rtl">
      {/* Header & Quick Summary */}
      <div className="relative overflow-hidden bg-slate-900 dark:bg-slate-950 rounded-[3rem] p-8 sm:p-12 text-white shadow-2xl border border-white/5">
        {/* Abstract Background Patterns */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-[100px] -mr-32 -mt-32"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-[80px] -ml-24 -mb-24"></div>
        
        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-10">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="p-3.5 bg-white/10 backdrop-blur-xl border border-white/10 rounded-2xl text-primary shadow-inner">
                 <Users size={32} strokeWidth={2.5} />
              </div>
              <div>
                <h2 className="text-4xl font-black tracking-tighter mb-1">إدارة العملاء والديون</h2>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                  <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.3em]">نظام التتبع المالي الذكي لمتجر راضي</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-6 w-full lg:w-auto">
            {/* Elegant Summary Box */}
            <div className="bg-white/5 backdrop-blur-md border border-white/10 px-8 py-6 rounded-[2.5rem] flex items-center gap-8 shadow-inner group">
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase text-rose-400 tracking-[0.2em] mb-2">إجمالي مستحقاتك لدى العملاء</span>
                <div className="flex items-end gap-2">
                  <span className="text-4xl font-black text-white tracking-tighter leading-none">
                    {formatCurrency(customerStats.totalDebt).split(' ')[0]}
                  </span>
                  <span className="text-sm font-black text-primary uppercase pb-1">ج.م</span>
                </div>
              </div>
              <div className="w-14 h-14 bg-primary/20 rounded-[1.5rem] flex items-center justify-center text-primary group-hover:rotate-12 transition-all duration-500 shadow-lg shadow-primary/20">
                <HandCoins size={28} />
              </div>
            </div>

            <button 
              onClick={() => setIsModalOpen(true)}
              className="group bg-white hover:bg-slate-50 text-slate-900 px-10 py-6 rounded-[2.5rem] font-black shadow-2xl transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-4 text-base"
            >
              <span>إضافة عميل</span>
              <div className="w-8 h-8 bg-slate-900 text-white rounded-full flex items-center justify-center group-hover:rotate-90 transition-transform duration-500">
                <Plus size={20} />
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Summary - Redesigned for Elegance */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'فلوس ليا بره', value: customerStats.totalDebt, icon: HandCoins, color: 'text-rose-500', bg: 'bg-rose-500/10' },
          { label: 'فلوس عليا للناس', value: customerStats.totalCredit, icon: History, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
          { label: 'إجمالي العملاء', value: customerStats.count, icon: Users, color: 'text-indigo-500', bg: 'bg-indigo-500/10', isQty: true },
          { label: 'عملاء مديونين', value: customerStats.indebtedCount, icon: CreditCard, color: 'text-amber-500', bg: 'bg-amber-500/10', isQty: true },
        ].map((stat, i) => (
          <div key={i} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 p-8 rounded-[2.5rem] shadow-sm relative overflow-hidden group hover:scale-[1.02] transition-all">
            <div className={cn("p-4 w-fit rounded-2xl mb-6 shadow-sm", stat.bg, stat.color)}>
              <stat.icon size={26} />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">{stat.label}</p>
            <h3 className={cn("text-3xl font-black tracking-tighter", stat.color)}>
              {stat.isQty ? `${stat.value} عميل` : formatCurrency(stat.value as number)}
            </h3>
          </div>
        ))}
      </div>

      {/* Search Bar - Sophisticated Design */}
      <div className="relative group max-w-2xl mx-auto w-full">
        <div className="absolute inset-y-0 right-6 flex items-center text-slate-400 group-focus-within:text-primary transition-colors">
          <Search size={22} />
        </div>
        <input 
          type="text" 
          placeholder="ابحث عن عميل (الاسم أو الرقم)..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 rounded-[2rem] py-6 pr-16 pl-8 text-lg font-bold shadow-sm outline-none focus:ring-8 focus:ring-primary/5 transition-all text-right"
        />
        <div className="absolute left-4 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-2">
           <span className="text-[10px] font-black uppercase text-slate-300 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-100 dark:border-white/5">فلترة ذكية</span>
        </div>
      </div>

      {/* Customer List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8">
        <AnimatePresence>
          {filteredCustomers.length > 0 ? filteredCustomers.map((customer, i) => (
            <motion.div
              key={customer.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-white/5 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden"
            >
              <div className="flex justify-between items-start mb-6">
                <div className="w-16 h-16 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center font-black text-slate-400 group-hover:scale-110 transition-transform overflow-hidden border border-slate-100 dark:border-white/5">
                  {customer.imageUrl ? (
                    <img src={customer.imageUrl} alt={customer.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <span className="text-xl uppercase">{customer.name[0]}</span>
                  )}
                </div>
                {customer.totalDebt > 0 ? (
                  <div className="bg-rose-500/10 text-rose-500 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase border border-rose-500/20">
                    مديون
                  </div>
                ) : customer.totalDebt < 0 ? (
                  <div className="bg-emerald-500/10 text-emerald-500 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase border border-emerald-500/20">
                    ليه فلوس
                  </div>
                ) : (
                  <div className="bg-slate-500/10 text-slate-500 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase border border-slate-500/20">
                    خالص
                  </div>
                )}
              </div>

              <div className="space-y-1 mb-6">
                <h3 className="text-xl font-black text-slate-800 dark:text-white truncate">{customer.name}</h3>
                <div className="flex items-center gap-2 text-slate-400 font-bold text-xs">
                  <Phone size={12} />
                  <span>{customer.phone || 'رقم غير مسجل'}</span>
                </div>
              </div>

               <div className="bg-slate-50 dark:bg-black/20 p-6 rounded-[2rem] mb-6 border border-slate-100 dark:border-white/5 group-hover:bg-primary/5 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    {customer.totalDebt >= 0 ? "صافي الدين الحالي" : "المبلغ المستحق للعميل"}
                  </p>
                  <HandCoins size={14} className="text-primary opacity-20" />
                </div>
                <div className="flex items-baseline gap-2">
                  <h4 className={cn(
                    "text-4xl font-black tracking-tighter",
                    customer.totalDebt > 0 ? "text-rose-500" : customer.totalDebt < 0 ? "text-emerald-500" : "text-slate-500"
                  )}>
                    {formatCurrency(Math.abs(customer.totalDebt)).split(' ')[0]}
                    <span className="text-xs font-black mr-1 opacity-40 uppercase">ج.م</span>
                  </h4>
                </div>
              </div>

                <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                  <button 
                    onClick={() => {
                      setSelectedCustomer(customer);
                      setActionType('pay');
                    }}
                    className="flex-1 bg-emerald-500 text-white py-4 rounded-xl font-black text-[10px] shadow-lg shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    <ArrowDownLeft size={16} />
                    <span>تحصيل</span>
                  </button>
                  <button 
                    onClick={() => {
                      setSelectedCustomer(customer);
                      setActionType('add_debt');
                    }}
                    className="flex-1 bg-rose-500 text-white py-4 rounded-xl font-black text-[10px] shadow-lg shadow-rose-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    <ArrowUpRight size={16} />
                    <span>زيادة دين</span>
                  </button>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setShowHistoryCustomer(customer)}
                    className="flex-1 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-95 text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2"
                  >
                    <History size={14} />
                    سجل المعاملات
                  </button>
                  <button 
                    onClick={() => setCustomerToDelete(customer)}
                    className="p-3 rounded-xl bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-all active:scale-95"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </motion.div>
          )) : (
            <div className="col-span-full py-20 text-center opacity-30 text-sm font-black uppercase tracking-widest italic">لا يوجد عملاء مطابقين للبحث</div>
          )}
        </AnimatePresence>
      </div>

      {/* Pay Debt Modal */}
      <AnimatePresence>
        {selectedCustomer && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedCustomer(null)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white dark:bg-slate-900 w-full max-w-lg rounded-[3rem] shadow-2xl p-10 overflow-hidden text-right"
            >
              <div className="mb-10 text-center">
                  <div className={cn(
                    "w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 border-2",
                    actionType === 'pay' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-rose-500/10 text-rose-500 border-rose-500/20"
                  )}>
                      {actionType === 'pay' ? <ArrowDownLeft size={32} /> : <ArrowUpRight size={32} />}
                  </div>
                  <h3 className="text-2xl font-black text-slate-800 dark:text-white">
                    {actionType === 'pay' ? 'تحصيل مديونية' : 'إضافة مديونية جديدة'}
                  </h3>
                  <p className="text-slate-400 font-medium text-sm mt-2"> العميل: <span className="text-primary font-black">{selectedCustomer.name}</span></p>
                  <p className="text-slate-400 font-bold text-xs mt-1 italic">
                    {selectedCustomer.totalDebt >= 0 ? "إجمالي الدين الحالي:" : "إجمالي المديونية لي (علي المحل):"} {formatCurrency(Math.abs(selectedCustomer.totalDebt))}
                  </p>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">المبلغ (ج.م)</label>
                  <input 
                    type="number" 
                    value={payAmount || ''}
                    onChange={(e) => setPayAmount(Number(e.target.value))}
                    className={cn(
                      "w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl p-6 font-black text-3xl outline-none text-center focus:ring-4 transition-all md:text-4xl",
                      actionType === 'pay' ? "text-emerald-500 focus:ring-emerald-500/10" : "text-rose-500 focus:ring-rose-500/10"
                    )}
                    placeholder="0.00"
                  />
                  {actionType === 'pay' && payAmount > selectedCustomer.totalDebt && (
                    <p className="text-[10px] font-black text-rose-500 mt-2">⚠️ المبلغ المدخل أكبر من مديونية العميل</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">ملاحظات إضافية (اختياري)</label>
                  <textarea 
                    value={transactionNote}
                    onChange={(e) => setTransactionNote(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl p-4 font-bold text-sm outline-none focus:ring-4 focus:ring-primary/10 transition-all h-24 max-h-32"
                    placeholder="اكتب أي ملاحظات تخص هذه الحركة هنا..."
                  />
                </div>

                <ImageUpload 
                  label="صورة التوثيق (اختياري)"
                  value={proofImageUrl}
                  onUpload={setProofImageUrl}
                />

                <button 
                  onClick={handlePayDebt}
                  disabled={payAmount <= 0}
                  className={cn(
                    "w-full py-6 rounded-3xl font-black shadow-xl transition-all transform active:scale-95 flex items-center justify-center gap-3 text-lg disabled:opacity-50",
                    actionType === 'pay' ? "bg-emerald-500 text-white shadow-emerald-500/20" : "bg-rose-500 text-white shadow-rose-500/20"
                  )}
                >
                  <Check size={20} />
                  {actionType === 'pay' ? 'تأكيد التحصيل' : 'زيادة المديونية'}
                </button>
                
                <button onClick={() => setSelectedCustomer(null)} className="w-full py-4 text-slate-400 font-bold text-sm tracking-widest uppercase">إلغاء العملية</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Customer History Modal */}
      <AnimatePresence>
        {showHistoryCustomer && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowHistoryCustomer(null)} className="absolute inset-0 bg-black/70 backdrop-blur-md" />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 30 }}
              className="relative bg-white dark:bg-slate-900 w-full max-w-2xl h-[85vh] rounded-[3rem] shadow-2xl flex flex-col overflow-hidden text-right"
            >
              <div className="p-8 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-slate-800/20">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                      <History size={28} />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-slate-800 dark:text-white">سجل معاملات العميل</h3>
                      <p className="text-sm font-bold text-slate-400 mt-0.5">{showHistoryCustomer.name}</p>
                    </div>
                  </div>
                  <button onClick={() => setShowHistoryCustomer(null)} className="p-3 rounded-2xl bg-white dark:bg-slate-800 text-slate-400 hover:text-rose-500 transition-all shadow-sm">
                    <X size={24} />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-4 custom-scrollbar">
                {(() => {
                  const customerHistory = [
                    ...sales.filter(s => s.customerId === showHistoryCustomer.id).map(s => ({
                      id: s.id,
                      date: s.date,
                      type: 'sale',
                      amount: s.finalPrice,
                      label: `بيع: ${s.productName}`,
                      notes: s.notes
                    })),
                    ...transactions.filter(t => t.customerId === showHistoryCustomer.id).map(t => ({
                      id: t.id,
                      date: t.date,
                      type: t.type === 'transfer' ? 'payment' : 'adjustment',
                      amount: t.amount,
                      label: t.type === 'transfer' ? 'تحصيل مديونية' : 'زيادة مديونية',
                      notes: t.notes,
                      image: t.proofImageUrl
                    }))
                  ].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());

                  return customerHistory.length > 0 ? customerHistory.map((item, idx) => (
                    <motion.div 
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      key={item.id} 
                      className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-white/5 flex flex-col gap-4"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4">
                          <div className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                            item.type === 'sale' ? "bg-amber-500/10 text-amber-500" :
                            item.type === 'payment' ? "bg-emerald-500/10 text-emerald-500" :
                            "bg-rose-500/10 text-rose-500"
                          )}>
                            {item.type === 'sale' ? <ShoppingCart size={18} /> : 
                             item.type === 'payment' ? <ArrowDownLeft size={18} /> : 
                             <ArrowUpRight size={18} />}
                          </div>
                          <div>
                            <p className="font-black text-sm text-slate-800 dark:text-white">{item.label}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase mt-1 tracking-tight flex items-center gap-1">
                              <Calendar size={10} />
                              {formatArabicDate(item.date)}
                            </p>
                          </div>
                        </div>
                        <div className="text-left">
                          <p className={cn(
                            "font-black text-lg tracking-tighter",
                            item.type === 'payment' ? "text-emerald-500" : "text-rose-500"
                          )}>
                            {item.type === 'payment' ? '-' : '+'}{formatCurrency(item.amount)}
                          </p>
                        </div>
                      </div>

                      {(item.notes || (item as any).image) && (
                        <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-white/5">
                          {item.notes && (
                            <div className="p-3 bg-white/50 dark:bg-slate-900/50 rounded-xl border border-dotted border-slate-200 dark:border-white/10 italic text-[11px] font-medium text-slate-500 dark:text-slate-400">
                              💬 {item.notes}
                            </div>
                          )}
                          {(item as any).image && (
                            <div className="relative group w-24 h-24 rounded-xl overflow-hidden cursor-pointer">
                              <img 
                                src={(item as any).image} 
                                alt="Documentation" 
                                className="w-full h-full object-cover transition-transform group-hover:scale-110" 
                                referrerPolicy="no-referrer"
                                onClick={() => window.open((item as any).image, '_blank')}
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </motion.div>
                  )) : (
                    <div className="h-full flex flex-col items-center justify-center opacity-20 py-20 italic font-black text-sm">
                      <History size={48} className="mb-4" />
                      لا توجد سجلات معاملات لهذا العميل حتى الآن
                    </div>
                  );
                })()}
              </div>

              <div className="p-8 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-white/5">
                <div className="flex justify-between items-center">
                   <p className="text-xs font-black text-slate-400 uppercase tracking-widest">إجمالي المديونية الحالية</p>
                   <h4 className="text-2xl font-black text-rose-500 tracking-tighter">{formatCurrency(showHistoryCustomer.totalDebt)}</h4>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {customerToDelete && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setCustomerToDelete(null)} 
              className="absolute inset-0 bg-black/80 backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white dark:bg-slate-900 w-full max-w-md rounded-[2.5rem] shadow-2xl p-8 overflow-hidden text-right"
            >
              <div className="mb-6 text-center">
                <div className="w-20 h-20 bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-rose-500/20">
                  <Trash2 size={32} />
                </div>
                <h3 className="text-xl font-black text-slate-800 dark:text-white mb-2">تأكيد حذف العميل</h3>
                <p className="text-slate-500 dark:text-slate-400 font-medium text-sm leading-relaxed">
                  هل أنت متأكد من حذف العميل <span className="text-rose-500 font-black">"{customerToDelete.name}"</span>؟
                  <br />
                  <span className="text-xs opacity-60">سيؤدي هذا إلى حذف كافة سجلات ديونه ومعاملاته نهائياً من النظام.</span>
                </p>
              </div>

              <div className="flex flex-col gap-3">
                <button 
                  onClick={() => {
                    deleteCustomer(customerToDelete.id);
                    setCustomerToDelete(null);
                  }}
                  className="w-full bg-rose-500 text-white py-5 rounded-2xl font-black shadow-xl shadow-rose-500/20 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <Trash2 size={20} />
                  <span>تأكيد الحذف النهائي</span>
                </button>
                <button 
                  onClick={() => setCustomerToDelete(null)}
                  className="w-full py-4 text-slate-400 font-bold text-sm tracking-widest uppercase hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                >
                  إلغاء
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Customer Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white dark:bg-slate-900 w-full max-w-lg rounded-[3rem] shadow-2xl p-10 overflow-hidden text-right"
            >
              <div className="mb-10 text-center">
                  <div className="w-20 h-20 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
                      <Plus size={32} />
                  </div>
                  <h3 className="text-2xl font-black text-slate-800 dark:text-white">إضافة عميل جديد للشكك</h3>
                  <p className="text-slate-400 font-medium text-sm mt-2">تسجيل عميل جديد لبدء تتبع معاملاته المالية</p>
              </div>

              <AddCustomerForm onSave={() => setIsModalOpen(false)} onClose={() => setIsModalOpen(false)} />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function AddCustomerForm({ onSave, onClose }: { onSave: () => void, onClose: () => void }) {
  const { addCustomer } = useStore();
  const [data, setData] = useState({
    name: '',
    phone: '',
    imageUrl: '',
    totalDebt: 0
  });

  const handleSubmit = async () => {
    if (!data.name.trim()) {
      alert('يرجى إدخال اسم العميل');
      return;
    }
    
    try {
      await addCustomer({
        id: generateId(),
        ...data,
        createdAt: new Date().toISOString()
      });
      onSave();
    } catch (err) {
      alert('حدث خطأ أثناء حفظ العميل');
    }
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2 md:col-span-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block pr-2">الاسم بالكامل</label>
          <div className="relative">
            <Users className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={20} />
            <input 
              type="text" 
              value={data.name}
              onChange={(e) => setData({ ...data, name: e.target.value })}
              className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-transparent rounded-[1.5rem] p-5 pr-14 font-bold outline-none focus:border-primary/20 focus:ring-4 focus:ring-primary/5 transition-all"
              placeholder="مثال: أحمد محمد علي"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block pr-2">رقم الهاتف</label>
          <div className="relative">
            <Phone className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={20} />
            <input 
              type="text" 
              value={data.phone}
              onChange={(e) => setData({ ...data, phone: e.target.value })}
              className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-transparent rounded-[1.5rem] p-5 pr-14 font-bold outline-none focus:border-primary/20 focus:ring-4 focus:ring-primary/5 transition-all"
              placeholder="010XXXXXXXX"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block pr-2">رصيد مديونية ابتدائي</label>
          <div className="relative">
            <HandCoins className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={20} />
            <input 
              type="number" 
              value={data.totalDebt || ''}
              onChange={(e) => setData({ ...data, totalDebt: Number(e.target.value) })}
              className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-transparent rounded-[1.5rem] p-5 pr-14 font-bold outline-none focus:border-primary/20 focus:ring-4 focus:ring-primary/5 transition-all"
              placeholder="0.00"
            />
          </div>
        </div>

        <div className="space-y-2 md:col-span-2">
          <ImageUpload 
            label="صورة العميل"
            value={data.imageUrl}
            onUpload={(url) => setData({ ...data, imageUrl: url })}
          />
        </div>
      </div>

      <div className="flex flex-col gap-3 pt-4">
        <button 
          onClick={handleSubmit}
          className="w-full bg-primary text-white py-6 rounded-3xl font-black shadow-xl shadow-primary/25 transition-all transform active:scale-95 flex items-center justify-center gap-3 text-lg"
        >
          <Check size={24} />
          تأكيد وحفظ العميل
        </button>
        
        <button onClick={onClose} className="w-full py-2 text-slate-400 font-bold text-xs uppercase tracking-widest hover:text-slate-600 transition-colors">إلغاء وإغلاق</button>
      </div>
    </div>
  );
}
