import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
  Image as ImageIcon,
  Download,
  Upload
} from 'lucide-react';
import { useStore, Customer, Sale } from '../lib/store';
import { cn, formatCurrency, generateId, formatArabicDate } from '../lib/utils';
import { ImageUpload } from '../components/ImageUpload';

export default function Customers() {
  const { customers, sales, transactions, addCustomer, updateCustomer, deleteCustomer, currentUser, addTransaction, importBulkData } = useStore();
  const [search, setSearch] = useState('');
  const [viewType, setViewType] = useState<'grid' | 'list'>('grid');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showHistoryCustomer, setShowHistoryCustomer] = useState<Customer | null>(null);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const [actionType, setActionType] = useState<'pay' | 'add_debt'>('pay');
  const [payAmount, setPayAmount] = useState<number>(0);
  const [transactionNote, setTransactionNote] = useState('');
  const [proofImageUrl, setProofImageUrl] = useState('');
  const isOwner = currentUser?.role === 'owner';

  // Lock scroll when any modal is open
  useEffect(() => {
    const isAnyModalOpen = selectedCustomer || showHistoryCustomer || customerToDelete || isModalOpen;
    if (isAnyModalOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = 'var(--removed-body-scroll-bar-size)';
      // Smooth scroll to top to ensure modal context is clear
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    };
  }, [selectedCustomer, showHistoryCustomer, customerToDelete, isModalOpen]);

  const filteredCustomers = useMemo(() => {
    return customers.filter(c => 
      c.name.toLowerCase().includes(search.toLowerCase()) || 
      c.phone?.includes(search)
    ).map(c => {
      // Calculate Loyalty and Sentiment
      const customerSales = sales.filter(s => s.customerId === c.id);
      const totalSalesValue = customerSales.reduce((acc, s) => acc + s.finalPrice, 0);
      const totalProfitValue = customerSales.reduce((acc, s) => acc + s.profit, 0);
      
      let loyalty: 'VIP' | 'Regular' | 'New' = 'New';
      if (customerSales.length > 10 || totalSalesValue > 10000) loyalty = 'VIP';
      else if (customerSales.length > 3) loyalty = 'Regular';

      // Debt Sentiment: Happy if debt is 0 or credit, Angry if high debt
      let sentiment: 'positive' | 'neutral' | 'negative' = 'neutral';
      if (c.totalDebt <= 0) sentiment = 'positive';
      else if (c.totalDebt > 5000) sentiment = 'negative';

      return { ...c, loyalty, totalSalesValue, totalProfitValue, sentiment };
    }).sort((a, b) => b.totalDebt - a.totalDebt);
  }, [customers, search, sales]);

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

  const exportCustomers = () => {
    const data = {
      customers,
      debts_snapshot: customers.map(c => ({ name: c.name, debt: c.totalDebt })),
      exportDate: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `عملاء_وديون_راضي_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  const importCustomers = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = event.target?.result as string;
        const imported = JSON.parse(json);
        const customersToImport = imported.customers || imported;
        
        if (confirm(`هل تريد استيراد ${customersToImport.length} عميل؟ سيتم دمجهم مع البيانات الحالية.`)) {
          await importBulkData({ customers: customersToImport });
          alert('تم استيراد بيانات العملاء بنجاح');
        }
      } catch (err) {
        alert('خطأ في قراءة الملف');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-12 pb-32 lg:pb-12" dir="rtl">
      {/* Header & Quick Summary */}
      <div className="relative overflow-hidden bg-slate-900 dark:bg-slate-950 rounded-[3rem] p-8 sm:p-12 text-white shadow-2xl border border-white/5">
        {/* Abstract Background Patterns */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-[100px] -mr-32 -mt-32 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-[80px] -ml-24 -mb-24 pointer-events-none"></div>
        
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
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-6 w-full lg:w-auto relative z-30">
            <div className="flex flex-col gap-2 relative z-30">
              <div className="flex gap-2">
                <button 
                  type="button"
                  onClick={exportCustomers}
                  className="flex-1 bg-white/10 hover:bg-white/20 text-white p-4 rounded-2xl transition-all flex items-center justify-center gap-2 text-[10px] font-black border border-white/10 cursor-pointer relative z-40"
                  title="تصدير بيانات العملاء والديون"
                >
                  <Download size={14} />
                  تصدير
                </button>
                <label className="flex-1 bg-white/10 hover:bg-white/20 text-white p-4 rounded-2xl transition-all flex items-center justify-center gap-2 text-[10px] font-black border border-white/10 cursor-pointer relative z-40">
                  <Upload size={14} />
                  استيراد
                  <input type="file" className="hidden" accept=".json" onChange={importCustomers} />
                </label>
              </div>
              <div className="bg-white/5 backdrop-blur-md border border-white/10 px-8 py-6 rounded-[2.5rem] flex items-center gap-8 shadow-inner group pointer-events-none">
                <div className="flex flex-col z-10 pointer-events-auto">
                  <span className="text-[10px] font-black uppercase text-rose-400 tracking-[0.2em] mb-2">إجمالي مستحقاتك لدى العملاء</span>
                  <div className="flex items-end gap-2">
                    <span className="text-4xl font-black text-white tracking-tighter leading-none">
                      {formatCurrency(customerStats.totalDebt).split(' ')[0]}
                    </span>
                    <span className="text-sm font-black text-primary uppercase pb-1">ج.م</span>
                  </div>
                </div>
                <div className="w-14 h-14 bg-primary/20 rounded-[1.5rem] flex items-center justify-center text-primary group-hover:rotate-12 transition-all duration-500 shadow-lg shadow-primary/20 z-10 pointer-events-auto">
                  <HandCoins size={28} />
                </div>
              </div>
            </div>
          
            <button 
              type="button"
              onClick={(e) => { e.stopPropagation(); setIsModalOpen(true); }}
              className="group bg-white hover:bg-slate-50 text-slate-900 px-10 py-6 rounded-[2.5rem] font-black shadow-2xl transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-4 text-base cursor-pointer relative z-50"
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
      <div className="flex flex-col lg:flex-row gap-6 items-center max-w-4xl mx-auto w-full">
        <div className="relative group flex-1 w-full">
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
        </div>

        {/* View Toggle */}
        <div className="flex bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 p-1 rounded-2xl shadow-sm h-fit">
          <button 
            onClick={() => setViewType('grid')}
            className={cn(
              "p-3 rounded-xl transition-all",
              viewType === 'grid' ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-slate-400 hover:text-slate-600"
            )}
          >
            <Users size={20} />
          </button>
          <button 
            onClick={() => setViewType('list')}
            className={cn(
              "p-3 rounded-xl transition-all",
              viewType === 'list' ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-slate-400 hover:text-slate-600"
            )}
          >
            <History size={20} />
          </button>
        </div>
      </div>

      {/* Customer List */}
      {viewType === 'grid' ? (
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
                  <div className="relative">
                    <div className="w-16 h-16 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center font-black text-slate-400 group-hover:scale-110 transition-transform overflow-hidden border border-slate-100 dark:border-white/5">
                      {customer.imageUrl ? (
                        <img src={customer.imageUrl} alt={customer.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <span className="text-xl uppercase">{customer.name[0]}</span>
                      )}
                    </div>
                    {/* Loyalty Badge */}
                    <div className={cn(
                      "absolute -bottom-2 -right-2 px-2 py-0.5 rounded-lg text-[8px] font-black uppercase text-white shadow-lg z-20",
                      customer.loyalty === 'VIP' ? "bg-amber-500" : customer.loyalty === 'Regular' ? "bg-indigo-500" : "bg-slate-500"
                    )}>
                      {customer.loyalty}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
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
                    {/* Sentiment Indicator */}
                    <div className={cn(
                      "w-4 h-4 rounded-full flex items-center justify-center",
                      customer.sentiment === 'positive' ? "text-emerald-500" : customer.sentiment === 'negative' ? "text-rose-500" : "text-amber-500"
                    )}>
                      {customer.sentiment === 'positive' ? '😊' : customer.sentiment === 'negative' ? '🤬' : '😐'}
                    </div>
                  </div>
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

                  <div className="flex flex-col gap-2 relative z-10">
                  <div className="flex gap-2">
                    <button 
                      type="button"
                      onClick={() => {
                        setSelectedCustomer(customer);
                        setActionType('pay');
                      }}
                      className="flex-1 bg-emerald-500 text-white py-4 rounded-xl font-black text-[10px] shadow-lg shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <ArrowDownLeft size={16} />
                      <span>تحصيل</span>
                    </button>
                    <button 
                      type="button"
                      onClick={() => {
                        setSelectedCustomer(customer);
                        setActionType('add_debt');
                      }}
                      className="flex-1 bg-rose-500 text-white py-4 rounded-xl font-black text-[10px] shadow-lg shadow-rose-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <ArrowUpRight size={16} />
                      <span>زيادة دين</span>
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      type="button"
                      onClick={() => setShowHistoryCustomer(customer)}
                      className="flex-1 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-95 text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <History size={14} />
                      سجل المعاملات
                    </button>
                    <button 
                      type="button"
                      onClick={() => setCustomerToDelete(customer)}
                      className="p-3 rounded-xl bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-all active:scale-95 cursor-pointer"
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
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-white/5 overflow-hidden shadow-sm relative z-10">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-right border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-white/10">
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">العميل</th>
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">رقم الهاتف</th>
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">صافي المديونية</th>
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">الإجراءات والسجلات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                <AnimatePresence mode="popLayout">
                  {filteredCustomers.length > 0 ? filteredCustomers.map((customer) => (
                    <motion.tr 
                      key={customer.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="group hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                    >
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-black text-xs text-slate-400 border border-slate-200 dark:border-white/5 overflow-hidden">
                            {customer.imageUrl ? <img src={customer.imageUrl} className="w-full h-full object-cover" /> : customer.name[0]}
                          </div>
                          <span className="font-black text-sm text-slate-800 dark:text-white">{customer.name}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span className="text-xs font-bold text-slate-500">{customer.phone || '--'}</span>
                      </td>
                      <td className="px-8 py-6">
                        <span className={cn(
                          "font-black text-sm",
                          customer.totalDebt > 0 ? "text-rose-500" : customer.totalDebt < 0 ? "text-emerald-500" : "text-slate-400"
                        )}>
                          {formatCurrency(customer.totalDebt)}
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center justify-center gap-2">
                          <button 
                            type="button"
                            onClick={() => { setSelectedCustomer(customer); setActionType('pay'); }}
                            className="px-4 py-2 rounded-lg bg-emerald-500 text-white text-[10px] font-black hover:bg-emerald-600 transition-colors shadow-sm cursor-pointer relative z-10"
                          >تحصيل</button>
                          <button 
                            type="button"
                            onClick={() => { setSelectedCustomer(customer); setActionType('add_debt'); }}
                            className="px-4 py-2 rounded-lg bg-rose-500 text-white text-[10px] font-black hover:bg-rose-600 transition-colors shadow-sm cursor-pointer relative z-10"
                          >زيادة</button>
                          <button 
                            type="button"
                            onClick={() => setShowHistoryCustomer(customer)}
                            className="p-2 rounded-lg bg-slate-100 dark:bg-white/5 text-slate-500 hover:text-primary transition-colors cursor-pointer relative z-10"
                          ><History size={16} /></button>
                          <button 
                            type="button"
                            onClick={() => setCustomerToDelete(customer)}
                            className="p-2 rounded-lg bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-colors cursor-pointer relative z-10"
                          ><Trash2 size={16} /></button>
                        </div>
                      </td>
                    </motion.tr>
                  )) : (
                    <tr>
                      <td colSpan={4} className="py-20 text-center opacity-30 text-sm font-black italic">لا يوجد نتائج للبحث</td>
                    </tr>
                  )}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pay Debt Modal */}
      <AnimatePresence>
        {selectedCustomer && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setSelectedCustomer(null)} 
              className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 100 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 100 }}
              className="relative bg-[#161b22] w-full max-w-lg rounded-t-[2.5rem] sm:rounded-[3rem] shadow-2xl border border-white/5 flex flex-col max-h-[95vh] sm:max-h-[90vh] overflow-hidden"
            >
              {/* Header */}
              <div className="px-10 pt-10 pb-6 border-b border-white/5 flex justify-between items-center bg-[#1c2128]">
                <button 
                  onClick={() => setSelectedCustomer(null)}
                  className="p-2 rounded-xl bg-white/5 text-slate-400 hover:text-rose-500 transition-all"
                >
                  <X size={20} />
                </button>
                <div className="text-right">
                  <h3 className="text-xl font-black text-white">
                    {actionType === 'pay' ? 'تحصيل مديونية' : 'زيادة مديونية'}
                  </h3>
                  <p className="text-[10px] text-slate-500 font-bold tracking-widest mt-0.5 uppercase">سجل البيانات بدقة لضمان صحة الميزانية الربحية</p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-10 space-y-8 custom-scrollbar">
                {/* Customer Info Card */}
                <div className="bg-[#0d1117] p-6 rounded-3xl border border-white/5 flex items-center justify-between">
                   <div className="text-right">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">العميل الحالي</p>
                      <h4 className="text-lg font-black text-primary">{selectedCustomer.name}</h4>
                   </div>
                   <div className="text-left">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{selectedCustomer.totalDebt >= 0 ? "إجمالي الدين" : "المحل مديون له"}</p>
                      <h4 className="text-lg font-black text-white tracking-tighter">{formatCurrency(Math.abs(selectedCustomer.totalDebt))}</h4>
                   </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-center gap-4 mb-2">
                    <div className={cn(
                      "w-12 h-12 rounded-2xl flex items-center justify-center border",
                      actionType === 'pay' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.1)]" : "bg-rose-500/10 text-rose-500 border-rose-500/20 shadow-[0_0_20px_rgba(244,63,94,0.1)]"
                    )}>
                      {actionType === 'pay' ? <ArrowDownLeft size={24} /> : <ArrowUpRight size={24} />}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] block pr-4">المبلغ ج.م</label>
                    <div className="relative">
                      <input 
                        type="number" 
                        autoFocus
                        value={payAmount || ''}
                        onChange={(e) => setPayAmount(Number(e.target.value))}
                        className={cn(
                          "w-full bg-[#0d1117] border-2 border-transparent rounded-3xl p-8 font-black text-4xl outline-none text-center transition-all shadow-inner placeholder:text-slate-800",
                          actionType === 'pay' ? "text-emerald-500 focus:border-emerald-500/20" : "text-rose-500 focus:border-rose-500/20"
                        )}
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4 text-right">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] block pr-4">ملاحظات إضافية (اختياري)</label>
                    <textarea 
                      value={transactionNote}
                      onChange={(e) => setTransactionNote(e.target.value)}
                      className="w-full bg-[#0d1117] border-2 border-transparent rounded-[2rem] p-6 font-bold text-sm outline-none focus:border-white/10 transition-all h-28 resize-none shadow-inner text-white text-right"
                      placeholder="اكتب أي ملاحظات تخص هذه الحركة هنا..."
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] block pr-4">صورة التوثيق (اختياري)</label>
                    <ImageUpload 
                      label=""
                      value={proofImageUrl}
                      onUpload={setProofImageUrl}
                    />
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="p-8 border-t border-white/5 bg-[#1c2128] flex gap-4">
                <button 
                  onClick={() => setSelectedCustomer(null)}
                  className="flex-1 py-5 rounded-2xl font-black text-slate-400 bg-white/5 hover:bg-white/10 transition-all text-sm"
                >
                  إلغاء
                </button>
                <button 
                  onClick={handlePayDebt}
                  disabled={payAmount <= 0}
                  className={cn(
                    "flex-[2] py-5 rounded-2xl font-black shadow-2xl transition-all transform active:scale-95 flex items-center justify-center gap-3 text-sm disabled:opacity-20",
                    actionType === 'pay' ? "bg-emerald-500 text-white shadow-emerald-500/20" : "bg-rose-500 text-white shadow-rose-500/20"
                  )}
                >
                  <Check size={18} />
                  <span>{actionType === 'pay' ? 'تأكيد التحصيل' : 'زيادة المديونية'}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>


      {/* Customer History Modal */}
      <AnimatePresence>
        {showHistoryCustomer && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-hidden" dir="rtl">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setShowHistoryCustomer(null)} 
              className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
            />
            
            <motion.div 
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 100 }}
              className="relative bg-[#161b22] w-full max-w-2xl rounded-t-[3rem] sm:rounded-[3rem] shadow-2xl h-[95vh] sm:h-auto sm:max-h-[85vh] flex flex-col overflow-hidden text-right border border-white/10"
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
             <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setCustomerToDelete(null)} 
              className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white dark:bg-slate-900 w-full max-w-md rounded-[2.5rem] shadow-2xl p-8 overflow-hidden text-right border border-white/10"
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
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center overflow-hidden p-4" dir="rtl">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setIsModalOpen(false)} 
              className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 100 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 100 }}
              className="relative bg-white dark:bg-slate-900 w-full max-w-lg rounded-t-[3rem] sm:rounded-[3rem] shadow-2xl p-10 overflow-hidden text-right border border-white/10"
            >
              <button 
                onClick={() => setIsModalOpen(false)}
                className="absolute top-6 left-6 text-slate-400 hover:text-rose-500 transition-colors"
              >
                <X size={24} />
              </button>
              <div className="mb-10 text-center">
                  <div className="w-20 h-20 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
                      <Plus size={32} />
                  </div>
                  <h3 className="text-2xl font-black text-slate-800 dark:text-white">إضافة عميل جديد</h3>
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
