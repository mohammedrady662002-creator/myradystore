import React from 'react';
import { FileText, CalendarDays, BarChart3, History, Calendar, Printer, Download, TrendingUp, Loader2 } from 'lucide-react';

interface ReportsTabProps {
  reportPeriod: string;
  setReportPeriod: (p: string) => void;
  customDate: string;
  setCustomDate: (d: string) => void;
  reportRef: React.RefObject<HTMLDivElement | null>;
  reportData: any;
  handlePrint: () => void;
  handleDownloadPNG: () => void;
  isExporting: boolean;
  formatDateTime: (d: string) => string;
  getCategoryNameAr: (c: string) => string;
}

export default function ReportsTab({
  reportPeriod, setReportPeriod, customDate, setCustomDate, reportRef, reportData,
  handlePrint, handleDownloadPNG, isExporting, formatDateTime, getCategoryNameAr
}: ReportsTabProps) {
  return (
    <div className="animate-fade-in">
      <div className="flex flex-col xl:flex-row justify-between items-center gap-4 mb-8 print:hidden">
        <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3"><div className="p-2 bg-rose-50 text-rose-600 rounded-xl"><FileText size={24} /></div> كشف حساب شامل</h2>
        <div className="flex flex-col md:flex-row items-center gap-3 w-full xl:w-auto">
          <div className="flex flex-wrap items-center bg-white border border-slate-200 rounded-2xl p-1.5 shadow-sm w-full md:w-auto">
            <button onClick={() => setReportPeriod('today')} className={`flex-1 md:flex-none px-5 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${reportPeriod === 'today' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'}`}><CalendarDays size={16} /> اليوم</button>
            <button onClick={() => setReportPeriod('month')} className={`flex-1 md:flex-none px-5 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${reportPeriod === 'month' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'}`}><BarChart3 size={16} /> الشهر</button>
            <button onClick={() => setReportPeriod('all')} className={`flex-1 md:flex-none px-5 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${reportPeriod === 'all' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'}`}><History size={16} /> الكل</button>
            <div className={`flex items-center gap-2 px-3 border-r border-slate-200 mr-2 transition-all ${reportPeriod === 'custom' ? 'bg-slate-900 rounded-xl text-white shadow-md py-2.5' : 'py-2.5 text-slate-400 hover:text-slate-800'}`}>
              <Calendar size={16} />
              <input type="date" value={customDate} onChange={(e) => { setCustomDate(e.target.value); setReportPeriod('custom'); }} className="bg-transparent outline-none cursor-pointer font-mono text-sm font-bold" />
            </div>
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <button onClick={handlePrint} className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 px-5 py-3.5 rounded-2xl font-bold flex items-center justify-center flex-1 md:flex-none gap-2 shadow-sm transition-all"><Printer size={18} /><span>طباعة / PDF</span></button>
            <button onClick={handleDownloadPNG} disabled={isExporting} className="bg-rose-600 hover:bg-rose-700 text-white px-5 py-3.5 rounded-2xl font-bold flex items-center justify-center flex-1 md:flex-none gap-2 shadow-lg shadow-rose-500/25 transition-all disabled:opacity-70">
              {isExporting ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}<span>صورة</span>
            </button>
          </div>
        </div>
      </div>

      <div ref={reportRef} className="print:w-full print:absolute print:left-0 print:top-0 print:bg-white print:p-8 bg-transparent pb-4">
        <div className="hidden print:block text-center mb-10 border-b-2 border-slate-200 pb-6">
          <h1 className="text-4xl font-black text-slate-900 mb-2">Rady Store</h1>
          <p className="text-xl text-slate-500 font-bold mb-3">التقرير المالي وكشف الحساب المجمع</p>
          <div className="inline-block bg-slate-100 px-4 py-2 rounded-xl font-bold text-slate-700 text-sm">الفترة: {reportPeriod === 'today' ? 'اليوم' : reportPeriod === 'month' ? 'الشهر الحالي' : reportPeriod === 'custom' ? `يوم ${customDate}` : 'كل الأوقات'}</div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5 mb-8">
          {[ 
            { id: 'accessories', title: 'الإكسسوارات', color: 'indigo', data: reportData.totals.accessories },
            { id: 'hardware', title: 'قطع الغيار', color: 'orange', data: reportData.totals.hardware },
            { id: 'maintenance', title: 'الصيانة', color: 'blue', data: reportData.totals.maintenance },
            { id: 'software', title: 'السوفت وير', color: 'purple', data: reportData.totals.software },
          ].map((item) => (
            <div key={item.id} className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-sm relative overflow-hidden flex flex-col justify-between group hover:border-slate-300 transition-colors print:border-slate-300">
              <div className={`absolute top-0 right-0 w-2 h-full bg-${item.color}-500 print:hidden`}></div>
              <p className="text-slate-400 text-xs font-black uppercase tracking-wider mb-4">{item.title}</p>
              <div className="space-y-3">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 mb-0.5">الإيرادات</p>
                  <h3 className="text-2xl font-black text-slate-800 leading-none">{item.data.revenue.toLocaleString()} <span className="text-sm font-bold text-slate-400">ج</span></h3>
                </div>
                <div className="pt-3 border-t border-slate-100">
                  <p className="text-[10px] font-bold text-emerald-500/70 mb-0.5">صافي الربح</p>
                  <h3 className="text-lg font-black text-emerald-600 leading-none">+{item.data.profit.toLocaleString()} <span className="text-xs font-bold">ج</span></h3>
                </div>
              </div>
            </div>
          ))}
          
          <div className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-sm relative overflow-hidden flex flex-col justify-between print:border-slate-300">
            <div className="absolute top-0 right-0 w-2 h-full bg-emerald-500 print:hidden"></div>
            <p className="text-slate-400 text-xs font-black uppercase tracking-wider mb-4">الخدمات المالية</p>
            <div className="space-y-3">
              <div>
                <p className="text-[10px] font-bold text-slate-400 mb-0.5">إجمالي الحركات</p>
                <h3 className="text-2xl font-black text-slate-800 leading-none">{reportData.totals.finance.toLocaleString()} <span className="text-sm font-bold text-slate-400">ج</span></h3>
              </div>
              <div className="pt-3 border-t border-slate-100">
                <p className="text-[10px] font-bold text-emerald-500/70 mb-0.5">ربح العمولات</p>
                <h3 className="text-lg font-black text-emerald-600 leading-none">+{reportData.totals.finance.toLocaleString()} <span className="text-xs font-bold">ج</span></h3>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-bl from-slate-900 via-slate-800 to-indigo-950 p-10 rounded-[2.5rem] shadow-2xl shadow-indigo-900/20 mb-10 text-white relative overflow-hidden flex flex-col md:flex-row items-center justify-between print:from-white print:to-white print:border-4 print:border-slate-900 print:text-slate-900 print:shadow-none print:rounded-3xl">
          <div className="absolute -left-20 -bottom-20 opacity-10 print:hidden"><TrendingUp size={240} /></div>
          <div className="relative z-10 text-center md:text-right mb-8 md:mb-0 print:text-right">
            <p className="text-indigo-300 font-black text-xl mb-2 tracking-wide print:text-slate-500">الملخص المالي الشامل</p>
            <div className="inline-block bg-white/10 px-4 py-1.5 rounded-lg border border-white/10 backdrop-blur-md text-sm font-bold text-indigo-100 print:border-slate-300 print:text-slate-700 print:bg-slate-50">
              فترة التقرير: {reportPeriod === 'today' ? 'مبيعات وحركات اليوم' : reportPeriod === 'month' ? 'مبيعات وحركات الشهر' : reportPeriod === 'custom' ? `يوم ${customDate}` : 'كل البيانات المسجلة'}
            </div>
          </div>
          
          <div className="relative z-10 flex flex-col sm:flex-row gap-5 w-full md:w-auto">
            <div className="bg-white/5 p-6 rounded-3xl backdrop-blur-md border border-white/10 flex-1 text-center print:border-slate-300 print:bg-slate-50 min-w-[200px]">
              <p className="text-indigo-200 text-xs font-bold uppercase tracking-widest mb-2 print:text-slate-500">إجمالي الإيرادات</p>
              <h2 className="text-4xl font-black">{reportData.grandRevenue.toLocaleString()} <span className="text-lg font-bold text-indigo-300 print:text-slate-400">ج.م</span></h2>
            </div>
            <div className="bg-emerald-500/20 p-6 rounded-3xl backdrop-blur-md border border-emerald-400/30 flex-1 text-center print:border-emerald-300 print:bg-emerald-50 min-w-[200px]">
              <p className="text-emerald-200 text-xs font-bold uppercase tracking-widest mb-2 print:text-emerald-700">صافي الأرباح العام</p>
              <h2 className="text-4xl font-black text-emerald-400 print:text-emerald-700">+{reportData.grandProfit.toLocaleString()} <span className="text-lg font-bold text-emerald-500/50 print:text-emerald-500">ج.م</span></h2>
            </div>
          </div>
        </div>

        <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-3"><span className="w-8 h-8 rounded-lg bg-slate-200 flex items-center justify-center"><History className="text-slate-600" size={18} /></span> السجل التفصيلي المجمع</h3>
        <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-200/60 overflow-hidden print:border-slate-300 print:shadow-none">
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-200/80 text-slate-500 text-xs uppercase tracking-wider font-black print:bg-slate-100">
                  <th className="p-5 print:border-b print:border-slate-300">الوقت والتاريخ</th>
                  <th className="p-5 print:border-b print:border-slate-300">القسم</th>
                  <th className="p-5 print:border-b print:border-slate-300">البيان</th>
                  <th className="p-5 print:border-b print:border-slate-300">التفاصيل</th>
                  <th className="p-5 text-center print:border-b print:border-slate-300">الإيراد</th>
                  <th className="p-5 text-center print:border-b print:border-slate-300">صافي الربح</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 print:divide-slate-200">
                {reportData.combinedLog.map((log: any) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-5 text-xs text-slate-400 font-bold whitespace-nowrap" dir="ltr" style={{textAlign: 'right'}}>{formatDateTime(log.date)}</td>
                    <td className="p-5">
                      <span className={`px-3 py-1.5 rounded-lg text-[10px] font-black border ${
                        log.category === 'accessories' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                        log.category === 'hardware' ? 'bg-orange-50 text-orange-600 border-orange-100' :
                        log.category === 'maintenance' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                        log.category === 'software' ? 'bg-purple-50 text-purple-600 border-purple-100' :
                        'bg-emerald-50 text-emerald-600 border-emerald-100'
                      }`}>
                        {getCategoryNameAr(log.category)}
                      </span>
                    </td>
                    <td className="p-5 font-bold text-slate-800 text-sm">{log.name}</td>
                    <td className="p-5 text-xs font-medium text-slate-500">{log.details}</td>
                    <td className="p-5 text-center font-bold text-slate-600 text-sm">{log.revenue}</td>
                    <td className="p-5 text-center font-black text-emerald-600 bg-emerald-50/30 text-sm">+{log.profit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
