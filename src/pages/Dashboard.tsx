import React, { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus,
  Trash2,
  Check,
  X,
  TrendingUp, 
  Package, 
  ShoppingCart, 
  Wallet, 
  ArrowUpRight, 
  Clock,
  ChevronRight,
  Smartphone,
  History,
  Calculator,
  Bell,
  AlertTriangle,
  ArrowRight,
  Box
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from 'recharts';
import { useStore, Product } from '../lib/store';
import { formatCurrency, cn, formatArabicDate } from '../lib/utils';
import { startOfDay, subDays, isSameDay, format, parseISO } from 'date-fns';

export default function Dashboard() {
  const { products, sales, transactions, currentUser, updateProduct } = useStore();
  const isOwner = currentUser?.role === 'owner';

  const [showAllLowStock, setShowAllLowStock] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Real Stats Calculations
  const statsData = useMemo(() => {
    const totalSales = sales.reduce((acc, s) => acc + s.finalPrice, 0);
    const totalProfit = sales.reduce((acc, s) => acc + s.profit, 0) + transactions.reduce((acc, t) => acc + t.commission, 0);
    
    // Calculate Total Cash Balance (same logic as Finance)
    const bals: Record<string, number> = { cash: 0, vodafone: 0, bank: 0, debt: 0 };
    sales.forEach(s => { if (bals[s.method] !== undefined) bals[s.method] += s.finalPrice; });
    transactions.forEach(t => {
      if (t.sourceAccount !== 'external' && bals[t.sourceAccount] !== undefined) bals[t.sourceAccount] -= t.amount;
      if (t.destinationAccount && t.destinationAccount !== 'external' && bals[t.destinationAccount] !== undefined) {
        bals[t.destinationAccount] += t.amount;
      }
      // Add commission to profitAccount (default to destination)
      const pAcc = t.profitAccount || (t.destinationAccount as any);
      if (pAcc && pAcc !== 'external' && bals[pAcc] !== undefined) {
        bals[pAcc] += t.commission;
      }
    });
    // Liquidity only includes ready cash/bank/vodafone. Debt is receivables.
    const totalCash = bals.cash + bals.vodafone + bals.bank;
    const totalDebt = bals.debt;
    const totalInventoryCapital = products.reduce((acc, p) => acc + (p.wholesalePrice * (p.type === 'service' ? 0 : (p.quantity || 0) + (p.backroomQuantity || 0))), 0);
    const potentialProfit = products.reduce((acc, p) => acc + ((p.sellingPrice - p.wholesalePrice) * (p.type === 'service' ? 0 : (p.quantity || 0) + (p.backroomQuantity || 0))), 0);

    return {
      totalSales,
      totalProfit, // Realized
      potentialProfit, // From stock
      totalCash,
      totalDebt,
      totalInventoryCapital,
      availableStock: products.reduce((acc, p) => acc + (p.type === 'service' ? 0 : (p.quantity || 0) + (p.backroomQuantity || 0)), 0),
      lowStockItems: products.filter(p => p.type === 'product' && (p.quantity + (p.backroomQuantity || 0)) < 5)
    };
  }, [sales, transactions, products]);

  // Chart Data Preparation (Last 7 Days)
  const chartData = useMemo(() => {
    const days = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = subDays(new Date(), 6 - i);
      const daySales = sales.filter(s => isSameDay(parseISO(s.date), date));
      const dayProfitFromSales = daySales.reduce((acc, s) => acc + s.profit, 0);
      const dayProfitFromCommissions = transactions.filter(t => isSameDay(parseISO(t.date), date)).reduce((acc, t) => acc + t.commission, 0);
      
      return {
        name: days[date.getDay()],
        sales: daySales.reduce((acc, s) => acc + s.finalPrice, 0),
        profit: dayProfitFromSales + dayProfitFromCommissions
      };
    });
    return last7Days;
  }, [sales, transactions]);

  // Top Products Logic
  const topProducts = useMemo(() => {
    const counts: Record<string, { name: string, qty: number, category: string }> = {};
    sales.forEach(s => {
      if (!counts[s.productId]) {
        counts[s.productId] = { name: s.productName, qty: 0, category: s.category };
      }
      counts[s.productId].qty += s.quantity;
    });
    return Object.values(counts).sort((a,b) => b.qty - a.qty).slice(0, 4);
  }, [sales]);

  const stats = [
    { label: 'إجمالي المبيعات', value: formatCurrency(statsData.totalSales), icon: ShoppingCart, color: 'primary' },
    { label: 'الأصناف المتوفرة', value: `${statsData.availableStock} قطعة`, icon: Package, color: 'emerald' },
    { label: 'السيولة المتاحة', value: formatCurrency(statsData.totalCash), icon: Wallet, color: 'blue' },
    { label: 'ديون / شكك', value: formatCurrency(statsData.totalDebt), icon: Wallet, color: 'rose' },
    { label: 'صافي الربح الكلي', value: formatCurrency(statsData.totalProfit), icon: TrendingUp, color: 'indigo', private: !isOwner },
  ];

  return (
    <div className="space-y-8 pb-8 text-right font-sans" dir="rtl">
      {/* Welcome Header - Arabic Style */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-slate-100 dark:border-white/5 pb-8">
        <div>
          <h2 className="text-4xl font-black text-luxury tracking-tight mb-2 bg-gradient-to-l from-slate-900 to-slate-500 dark:from-white dark:to-slate-400 bg-clip-text text-transparent">مركز القيادة والتحكم</h2>
          <div className="flex items-center gap-3">
            <div className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <p className="text-slate-500 dark:text-slate-400 font-bold text-[10px] uppercase tracking-widest">
              الحالة: النظام نشط | {currentUser?.name} | {formatArabicDate(new Date().toISOString())}
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <div className="glass px-6 py-3 rounded-2xl flex items-center gap-3 shadow-2xl">
            <Clock size={18} className="text-primary" />
            <span className="font-black text-sm tracking-tight text-luxury">{new Date().toLocaleTimeString('en-US', { hour12: true, hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        </div>
      </div>

      {/* Stats Grid - Hybrid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 p-1.5 rounded-[3rem] bg-slate-200/20 dark:bg-white/5 border border-white/10 luxury-shadow backdrop-blur-xl relative group/grid">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover/grid:opacity-100 transition-opacity duration-1000 rounded-[3rem] pointer-events-none" />
        <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6 relative z-10">
          <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white relative overflow-hidden group shadow-2xl border border-white/5">
            <div className="relative z-10">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-4 opacity-50">إجمالي السيولة النقدية</p>
              <h3 className="text-4xl font-black text-luxury tracking-tighter mb-2">{formatCurrency(statsData.totalCash)}</h3>
              <div className="flex items-center gap-2 text-emerald-400 text-[10px] font-black uppercase">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>سيولة جارية آمنة</span>
              </div>
            </div>
            <Wallet className="absolute -bottom-6 -right-6 w-32 h-32 opacity-10 group-hover:scale-110 transition-transform duration-700 pointer-events-none" />
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full -mr-16 -mt-16 blur-3xl opacity-50 pointer-events-none" />
          </div>
          
          <div className="bg-primary p-8 rounded-[2.5rem] text-white relative overflow-hidden group shadow-xl border border-white/10">
            <div className="relative z-10">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-4 opacity-70">المبيعات الإجمالية</p>
              <h3 className="text-4xl font-black text-luxury tracking-tighter mb-2">{formatCurrency(statsData.totalSales)}</h3>
              <div className="flex items-center gap-2">
                 <p className="text-[10px] font-bold opacity-60 uppercase">إيرادات الفواتير المكتملة</p>
                 <div className="px-2 py-0.5 bg-white/20 rounded-md text-[8px] font-black">LIVE</div>
              </div>
            </div>
            <ShoppingCart className="absolute -bottom-6 -right-6 w-32 h-32 opacity-10 group-hover:rotate-12 transition-transform duration-700 pointer-events-none" />
          </div>
        </div>

        <div className="xl:col-span-2 grid grid-cols-1 lg:grid-cols-2 gap-6 relative z-10">
          <div className="glass p-8 rounded-[2.5rem] relative group luxury-shadow border border-white/5 overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-rose-500 opacity-20 pointer-events-none" />
            <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-4 text-slate-400">إجمالي الديون (الشكك)</p>
            <h3 className="text-3xl font-black text-luxury tracking-tighter mb-2 text-rose-500">{formatCurrency(statsData.totalDebt)}</h3>
            <div className="mt-4 flex items-center justify-between">
               <div className="flex h-1 w-24 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-rose-500 w-[45%]" />
               </div>
               <span className="text-[9px] font-black text-rose-400 uppercase">مستحقات معلقة</span>
            </div>
          </div>

          {isOwner && (
            <div className="glass p-8 rounded-[2.5rem] relative group luxury-shadow border border-white/5 bg-gradient-to-br from-emerald-500/5 to-transparent overflow-hidden">
              <div className="absolute top-0 right-0 w-1 h-full bg-emerald-500 opacity-20 pointer-events-none" />
              <div className="flex justify-between items-start mb-4 relative z-10">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">صافي الأرباح المحققة</p>
                  <p className="text-[8px] font-bold uppercase text-emerald-500 tracking-wider">السيولة الربحية الصافية</p>
                </div>
                <div className="text-left bg-emerald-500/10 px-2 py-1 rounded-lg border border-emerald-500/20">
                  <p className="text-[7px] font-black text-slate-500 uppercase">الربح المتوقع بالمخزن</p>
                  <p className="text-[9px] font-black text-emerald-500 leading-none">+{formatCurrency(statsData.potentialProfit)}</p>
                </div>
              </div>
              <h3 className="text-3xl font-black text-luxury tracking-tighter mb-2 text-emerald-500 relative z-10">
                 {formatCurrency(statsData.totalProfit)}
              </h3>
              {statsData.totalSales > 0 && (
                <div className="flex items-center gap-2 mt-4 relative z-10">
                   <div className="px-2 py-0.5 bg-emerald-500 text-white text-[8px] font-black rounded-md">
                      MARKUP: {Math.round((statsData.totalProfit / (statsData.totalSales - statsData.totalProfit)) * 100)}%
                   </div>
                   <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">متوسط ربحية المتجر</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Notifications & Low Stock Section */}
      {statsData.lowStockItems.length > 0 && (
        <div className="bg-rose-500/5 border border-rose-500/10 rounded-[2.5rem] p-8 relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-rose-500 text-white rounded-xl shadow-lg shadow-rose-500/20 animate-pulse">
                <Bell size={20} />
              </div>
              <h3 className="text-xl font-black text-rose-600">تنبيهات نقص المخزون</h3>
            </div>
            <span className="text-[10px] font-black bg-rose-500 text-white px-3 py-1 rounded-full uppercase tracking-widest">{statsData.lowStockItems.length} تنبيه</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {statsData.lowStockItems.slice(0, 6).map((product) => (
              <button 
                key={product.id} 
                type="button"
                onClick={() => setSelectedProduct(product)}
                className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 p-4 rounded-2xl flex items-center gap-4 group hover:border-rose-500/50 transition-all text-right w-full active:scale-[0.98] cursor-pointer relative z-20"
              >
                <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-xl overflow-hidden flex items-center justify-center text-slate-300">
                  {product.imageUrl ? <img src={product.imageUrl} className="w-full h-full object-cover" /> : <Package size={20} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm truncate">{product.name}</p>
                  <p className="text-[10px] font-black text-rose-400">إجمالي الرصيد: {product.quantity + product.backroomQuantity} قطعة</p>
                </div>
                <div className="text-rose-500">
                  <AlertTriangle size={18} />
                </div>
              </button>
            ))}
          </div>
          {statsData.lowStockItems.length > 6 && (
            <div className="mt-8 flex justify-center">
              <button 
                type="button"
                onClick={() => setShowAllLowStock(true)}
                className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 px-8 py-3 rounded-2xl text-xs font-black text-slate-500 hover:text-primary transition-all flex items-center gap-2 cursor-pointer"
              >
                <span>عرض كافة النواقص ({statsData.lowStockItems.length})</span>
                <ChevronRight size={14} className="rotate-180" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Performance Insights - Smart Indicator */}
      <div className="bg-slate-900 border border-white/10 rounded-[2.5rem] p-8 text-white relative overflow-hidden group shadow-2xl z-10">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="p-4 bg-primary/20 rounded-2xl border border-primary/30 group-hover:rotate-12 transition-transform duration-500">
               <TrendingUp size={32} className="text-primary" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-1">تحليلات النظام الذكية</p>
              <h3 className="text-2xl font-black mb-2 tracking-tight">التوصية الذكية لتحسين الأداء</h3>
              <p className="text-slate-400 text-sm max-w-2xl leading-relaxed">
                بناءً على نشاط المبيعات الأخير، {statsData.lowStockItems.length > 0 
                  ? "يوجد نقص في بـعض الأصناف الهامة. ننصح بمراجعة قسم النواقص لضمان عدم توقف عمليات البيع." 
                  : "أداء المخزون مستقر تماماً. الأقسام الأكثر ربحية حالياً هي الإكسسوارات والصيانة الفنية."}
              </p>
            </div>
          </div>
          <button type="button" className="bg-white text-slate-900 px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-primary hover:text-white transition-all shadow-xl active:scale-95 cursor-pointer relative z-20">
            تحليل الأداء الكامل
          </button>
        </div>
        <div className="absolute top-0 right-1/4 w-64 h-64 bg-primary/5 rounded-full blur-3xl opacity-30 pointer-events-none" />
      </div>

      {/* Analytics Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Main Chart */}
        <div className="xl:col-span-2 bg-white dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-100 dark:border-white/5 shadow-sm">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="text-lg font-black tracking-tight">إحصائيات الأداء الأسبوعي</h3>
              <p className="text-xs text-slate-400 font-bold mt-1 uppercase tracking-wider">البيانات تعتمد على عمليات البيع والتحويلات المسجلة</p>
            </div>
          </div>
          
          <div className="h-[300px] w-full min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }}
                  orientation="right"
                  tickFormatter={(val) => val.toLocaleString('en-US')}
                />
                <Tooltip 
                  formatter={(val: number) => [val.toLocaleString('en-US'), '']}
                  contentStyle={{ 
                    backgroundColor: '#1e293b', 
                    border: 'none', 
                    borderRadius: '16px',
                    color: '#fff',
                    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                    textAlign: 'right'
                  }}
                  itemStyle={{ fontSize: '12px', fontWeight: 700 }}
                />
                <Area 
                  type="monotone" 
                  dataKey="sales" 
                  name="المبيعات"
                  stroke="#6366f1" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorSales)" 
                />
                {isOwner && (
                  <Area 
                    type="monotone" 
                    dataKey="profit" 
                    name="الأرباح"
                    stroke="#10b981" 
                    strokeWidth={3}
                    fill="transparent"
                  />
                )}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-100 dark:border-white/5 shadow-sm">
          <h3 className="text-lg font-black tracking-tight mb-8">أكثر المنتجات طلباً</h3>
          <div className="space-y-6">
            {topProducts.length > 0 ? topProducts.map((p, i) => (
              <div key={i} className="flex items-center gap-4 group">
                <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center p-2 group-hover:scale-110 transition-transform">
                  <Smartphone size={24} className="text-slate-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm truncate">{p.name}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{p.category} • {p.qty} قطعة</p>
                </div>
                <div className="text-left">
                  <p className="font-black text-sm text-emerald-500">+{p.qty}</p>
                  <div className="w-16 h-1 bg-slate-100 dark:bg-slate-800 rounded-full mt-1 overflow-hidden">
                    <div className="bg-emerald-500 h-full" style={{ width: `${Math.min(100, (p.qty / topProducts[0].qty) * 100)}%` }}></div>
                  </div>
                </div>
              </div>
            )) : (
              <div className="py-20 text-center opacity-30 text-xs font-bold uppercase">لا يوجد بيانات مبيعات</div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white dark:bg-slate-900/50 rounded-[2.5rem] border border-slate-100 dark:border-white/5 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-100 dark:border-white/5 flex justify-between items-center">
          <h3 className="text-lg font-black tracking-tight flex items-center gap-2">
            <History size={20} className="text-primary" /> سجل العمليات الأخيرة
          </h3>
        </div>
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-right">
            <thead>
              <tr className="text-[10px] uppercase font-black text-slate-400 tracking-wider">
                <th className="px-8 py-4">المنتج / العملية</th>
                <th className="px-8 py-4">التاريخ</th>
                <th className="px-8 py-4">القيمة</th>
                <th className="px-8 py-4">الحالة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-white/5">
              {sales.sort((a,b) => parseISO(b.date).getTime() - parseISO(a.date).getTime()).slice(0, 5).map((s) => (
                <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group cursor-default">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">{s.productName[0]}</div>
                      <div>
                        <p className="font-bold text-sm">{s.productName}</p>
                        <p className="text-[10px] font-bold text-slate-400">#{s.id.slice(-8).toUpperCase()}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-xs font-medium text-slate-500">{formatArabicDate(s.date)}</td>
                  <td className="px-8 py-6">
                    <p className="font-black text-sm">{formatCurrency(s.finalPrice)}</p>
                    <p className="text-[10px] font-bold text-emerald-500">تم الدفع ({s.method === 'cash' ? 'نقدي' : s.method === 'bank' ? 'بنكي' : 'فودافون'})</p>
                  </td>
                  <td className="px-8 py-6">
                    <span className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase">ناجحة</span>
                  </td>
                </tr>
              ))}
              {sales.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-20 text-center opacity-30 text-sm font-black uppercase tracking-widest">لا توجد عمليات بيع مسجلة</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      {/* Modals */}
      <AnimatePresence>
        {showAllLowStock && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAllLowStock(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 30 }}
              className="relative bg-white dark:bg-slate-900 w-full max-w-4xl rounded-[2.5rem] shadow-2xl p-8 max-h-[85vh] flex flex-col"
            >
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h3 className="text-2xl font-black">كافة النواقص</h3>
                  <p className="text-xs text-rose-500 font-bold uppercase mt-1">يوجد {statsData.lowStockItems.length} منتجات رصيدها أقل من 5 قطع</p>
                </div>
                <button onClick={() => setShowAllLowStock(false)} className="p-2 text-slate-400 hover:text-rose-500 transition-colors"><X size={24} /></button>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 pb-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {statsData.lowStockItems.map((product) => (
                    <button 
                      key={product.id} 
                      onClick={() => {
                        setSelectedProduct(product);
                        // Don't close All modal yet, let them edit and come back
                      }}
                      className="bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-white/5 p-4 rounded-2xl flex items-center gap-4 group hover:ring-2 hover:ring-primary/20 transition-all text-right"
                    >
                      <div className="w-10 h-10 bg-white dark:bg-slate-800 rounded-xl overflow-hidden flex items-center justify-center text-slate-300 border border-slate-100 dark:border-white/5">
                        {product.imageUrl ? <img src={product.imageUrl} className="w-full h-full object-cover" /> : <Package size={18} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-xs truncate">{product.name}</p>
                        <p className="text-[10px] font-black text-rose-500">الرصيد: {product.quantity + product.backroomQuantity} قطعة</p>
                      </div>
                      <Box size={16} className="text-slate-300" />
                    </button>
                  ))}
                </div>
              </div>
              <button 
                onClick={() => setShowAllLowStock(false)}
                className="w-full mt-6 py-4 bg-slate-900 dark:bg-primary text-white rounded-2xl font-black text-xs"
              >
                إغلاق
              </button>
            </motion.div>
          </div>
        )}

        {selectedProduct && (
          <QuickStockUpdateModal 
            product={selectedProduct} 
            onClose={() => setSelectedProduct(null)} 
            onUpdate={async (q1, q2) => {
              setIsUpdating(true);
              try {
                await updateProduct({
                  ...selectedProduct,
                  quantity: q1,
                  backroomQuantity: q2
                });
                setSelectedProduct(null);
              } catch (err) {
                alert('خطأ أثناء التحديث');
              } finally {
                setIsUpdating(false);
              }
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function QuickStockUpdateModal({ product, onClose, onUpdate }: { product: Product, onClose: () => void, onUpdate: (q1: number, q2: number) => void }) {
  const [q1, setQ1] = useState(product.quantity);
  const [q2, setQ2] = useState(product.backroomQuantity || 0);

  return createPortal(
    <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative bg-white dark:bg-slate-900 w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden p-10"
      >
        <div className="flex justify-between items-start mb-8">
          <div>
            <h3 className="text-xl font-black">تحديث رصيد المنتج</h3>
            <p className="text-xs text-slate-400 font-bold mt-1 truncate max-w-[250px]">{product.name}</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-rose-500 transition-colors"><X size={24} /></button>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pr-2">الكمية في صالة العرض</label>
            <input 
              type="number" 
              value={q1}
              onChange={(e) => setQ1(Number(e.target.value))}
              placeholder="0"
              className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-transparent rounded-2xl p-5 font-black text-2xl outline-none focus:border-primary/20 focus:ring-4 focus:ring-primary/5 transition-all text-center"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pr-2">الكمية في المخزن (احتياطي)</label>
            <input 
              type="number" 
              value={q2}
              onChange={(e) => setQ2(Number(e.target.value))}
              placeholder="0"
              className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-transparent rounded-2xl p-5 font-black text-2xl outline-none focus:border-indigo-500/20 focus:ring-4 focus:ring-indigo-500/5 transition-all text-center text-indigo-500"
            />
          </div>

          <div className="pt-4 flex gap-3">
             <button onClick={onClose} className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 rounded-2xl font-bold text-xs">إلغاء</button>
             <button 
                onClick={() => onUpdate(q1, q2)}
                className="flex-[2] py-4 bg-primary text-white rounded-2xl font-black text-xs shadow-xl shadow-primary/20 flex items-center justify-center gap-2"
              >
                <Check size={18} />
                تحديث الأرصدة
             </button>
          </div>
        </div>
      </motion.div>
    </div>,
    document.body
  );
}
