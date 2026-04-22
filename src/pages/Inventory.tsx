import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Edit, 
  Trash2, 
  Image as ImageIcon,
  QrCode,
  Box,
  ChevronRight,
  ChevronLeft,
  X,
  Upload,
  Loader2,
  Check,
  ArrowUpDown,
  SortAsc,
  SortDesc,
  Camera,
  Smartphone,
  Wrench,
  Cpu,
  LayoutGrid,
  List
} from 'lucide-react';
import { useStore, Product, Category } from '../lib/store';
import { cn, formatCurrency, generateId } from '../lib/utils';
import { identifyProductFromImage } from '../services/aiService';

const CATEGORIES: { id: Category; label: string; icon: any }[] = [
  { id: 'accessories', label: 'إكسسوارات', icon: QrCode },
  { id: 'spare_parts', label: 'قطع غيار', icon: Cpu },
  { id: 'hardware', label: 'هاتف محمول', icon: Smartphone },
  { id: 'maintenance', label: 'خدمات صيانة', icon: Wrench },
  { id: 'software', label: 'سوفت وير', icon: Box },
  { id: 'finance', label: 'خدمات مالية', icon: Box },
];

export default function Inventory() {
  const { products, addProduct, updateProduct, deleteProduct, currentUser } = useStore();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<Category | 'all'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'name' | 'price-low' | 'price-high' | 'qty-low' | 'qty-high'>('newest');
  const [viewType, setViewType] = useState<'grid' | 'list'>('grid');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);
  const [searchConfidence, setSearchConfidence] = useState<number | null>(null);
  
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isDeletingBulk, setIsDeletingBulk] = useState(false);
  
  const isOwner = currentUser?.role === 'owner';

  const handleImageSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsAnalyzingImage(true);
    setSearchConfidence(null);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        const result = await identifyProductFromImage(base64, file.type);
        if (result) {
          setSearch(result.keyword.trim());
          setSearchConfidence(result.confidence);
        }
        setIsAnalyzingImage(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Image search failed:', err);
      setIsAnalyzingImage(false);
      alert('فشل التعرف على الصورة. يرجى المحاولة مرة أخرى.');
    }
  };

  const filteredProducts = useMemo(() => {
    let result = products.filter((p) => {
      const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.code.includes(search);
      const matchesCategory = activeCategory === 'all' || p.category === activeCategory;
      return matchesSearch && matchesCategory;
    });

    // Apply Sorting
    return result.sort((a, b) => {
      switch (sortBy) {
        case 'name': return a.name.localeCompare(b.name, 'ar');
        case 'price-low': return a.sellingPrice - b.sellingPrice;
        case 'price-high': return b.sellingPrice - a.sellingPrice;
        case 'qty-low': 
          if (a.type === 'service') return 1;
          if (b.type === 'service') return -1;
          return a.quantity - b.quantity;
        case 'qty-high': 
          if (a.type === 'service') return -1;
          if (b.type === 'service') return 1;
          return b.quantity - a.quantity;
        case 'newest':
        default:
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      }
    });
  }, [products, search, activeCategory, sortBy]);

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
      const { bulkDeleteProducts } = useStore.getState();
      await bulkDeleteProducts(selectedIds);
      setSelectedIds([]);
    } catch (err) {
      alert('حدث خطأ أثناء الحذف الجماعي');
    } finally {
      setIsDeletingBulk(false);
    }
  };

  const handleSaveProduct = async (data: Partial<Product>) => {
    try {
      if (editingProduct) {
        await updateProduct({ ...editingProduct, ...data } as Product);
      } else {
        await addProduct({
          id: generateId(),
          name: data.name || '',
          code: data.code || generateId().substring(0, 8),
          wholesalePrice: data.wholesalePrice || 0,
          sellingPrice: data.sellingPrice || 0,
          quantity: data.type === 'service' ? 1 : (data.quantity || 0),
          backroomQuantity: data.type === 'service' ? 0 : (data.backroomQuantity || 0),
          notes: data.notes || '',
          imageUrl: data.imageUrl || '',
          category: data.category || 'accessories',
          type: data.type || 'product',
          createdAt: new Date().toISOString(),
        });
      }
      setIsModalOpen(false);
      setEditingProduct(null);
    } catch (err: any) {
      console.error('Failed to save product:', err);
      alert(err.message || 'عذراً، فشل في حفظ المنتج. تأكد من جودة الإنترنت!');
    }
  };

  return (
    <div className="space-y-8 pb-32 lg:pb-8 font-sans relative">
      {/* Floating Bulk Action Bar */}
      <AnimatePresence>
        {selectedIds.length > 0 && isOwner && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-28 lg:bottom-10 left-1/2 -translate-x-1/2 z-[150] bg-slate-900 dark:bg-slate-800 text-white px-8 py-5 rounded-[2.5rem] shadow-2xl flex items-center gap-8 border border-white/10"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center font-black text-xs text-white">
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
                <span>إلغاء التحديد</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header & Actions */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black tracking-tight mb-1 font-sans text-slate-900 dark:text-white border-r-4 border-primary pr-4">إدارة المخزون والعمليات</h2>
          <p className="text-slate-500 dark:text-slate-400 font-bold text-xs pr-4 uppercase tracking-widest">مركز التحكم اللوجستي وإدارة المنتجات</p>
        </div>
        {isOwner && (
          <button 
            onClick={() => { setEditingProduct(null); setIsModalOpen(true); }}
            className="flex items-center gap-2 bg-slate-900 dark:bg-primary hover:bg-slate-800 dark:hover:bg-primary/90 text-white px-8 py-4 rounded-2xl font-bold transition-all shadow-xl shadow-primary/20 active:scale-95 text-xs uppercase tracking-widest"
          >
            <Plus size={18} />
            <span>{activeCategory === 'software' ? 'إضافة خدمة برمجية' : 'إضافة صنف جديد'}</span>
          </button>
        )}
      </div>

      {/* Category Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {CATEGORIES.map((cat) => {
          const catProducts = products.filter(p => p.category === cat.id);
          const totalQty = catProducts.reduce((acc, p) => acc + (p.type === 'service' ? 0 : p.quantity), 0);
          const serviceCount = catProducts.filter(p => p.type === 'service').length;
          const productCount = catProducts.length - serviceCount;
          
          return (
            <div 
              key={cat.id} 
              onClick={() => setActiveCategory(cat.id)}
              className={cn(
                "p-6 rounded-[2rem] border transition-all cursor-pointer group relative overflow-hidden",
                activeCategory === cat.id 
                  ? "bg-primary text-white border-transparent shadow-xl shadow-primary/25 scale-[1.02]" 
                  : "bg-white dark:bg-slate-900 border-slate-100 dark:border-white/5 hover:border-primary/30"
              )}
            >
              <div className="relative z-10">
                <p className={cn("text-[10px] font-black uppercase tracking-widest mb-1", activeCategory === cat.id ? "text-white/60" : "text-slate-400")}>إحصائيات {cat.label}</p>
                <div className="flex justify-between items-end">
                  <div>
                    <h3 className="text-2xl font-black tracking-tighter">
                      {totalQty} <span className="text-[10px] font-bold opacity-60 font-sans tracking-normal">قطعة</span>
                      {serviceCount > 0 && (
                        <span className="text-[10px] font-black mr-2 opacity-80 decoration-primary/30 underline decoration-2">+{serviceCount} خدمة</span>
                      )}
                    </h3>
                    <p className={cn("text-[10px] font-bold mt-1 uppercase tracking-wider", activeCategory === cat.id ? "text-white/40" : "text-slate-400")}>{productCount} منتج | {serviceCount} خدمة</p>
                  </div>
                  <div className={cn("p-2.5 rounded-xl transition-colors", activeCategory === cat.id ? "bg-white/20" : "bg-slate-50 dark:bg-slate-800")}>
                    <cat.icon size={20} className={activeCategory === cat.id ? "text-white" : "text-primary"} />
                  </div>
                </div>
              </div>
              {activeCategory === cat.id && (
                <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-150 duration-700"></div>
              )}
            </div>
          );
        })}
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col xl:flex-row gap-4">
        <div className="flex-1 relative group">
          <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-primary transition-colors">
            <Search size={20} />
          </div>
          <input 
            type="text" 
            placeholder="بحث بالاسم، الكود، أو الباركود..." 
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              if (searchConfidence) setSearchConfidence(null);
            }}
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl py-4 pr-12 pl-24 focus:ring-4 focus:ring-primary/10 transition-all font-bold text-sm outline-none shadow-sm"
          />
          {searchConfidence !== null && (
            <div className="absolute left-16 top-1/2 -translate-y-1/2 flex items-center gap-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 px-2 py-1 rounded-lg border border-emerald-500/20">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-[10px] font-black uppercase tracking-wider">{searchConfidence}% ثقة</span>
            </div>
          )}
          <div className="absolute left-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
            <input 
              type="file" 
              id="imageSearchInput" 
              accept="image/*" 
              capture="environment"
              className="hidden" 
              onChange={handleImageSearch} 
            />
            <button 
              onClick={() => document.getElementById('imageSearchInput')?.click()}
              disabled={isAnalyzingImage}
              className={cn(
                "p-2.5 rounded-xl transition-all active:scale-95 flex items-center gap-2",
                isAnalyzingImage ? "bg-slate-100 text-slate-400" : "bg-primary/10 text-primary hover:bg-primary/20"
              )}
              title="بحث بالصورة"
            >
              {isAnalyzingImage ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Camera size={18} />
              )}
            </button>
          </div>
        </div>

          <div className="flex flex-wrap gap-2 lg:gap-4 items-center">
            {/* View Toggle */}
            <div className="flex bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 p-1 rounded-2xl shadow-sm">
              <button 
                onClick={() => setViewType('grid')}
                className={cn(
                  "p-3 rounded-xl transition-all",
                  viewType === 'grid' ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-slate-400 hover:text-slate-600"
                )}
              >
                <LayoutGrid size={18} />
              </button>
              <button 
                onClick={() => setViewType('list')}
                className={cn(
                  "p-3 rounded-xl transition-all",
                  viewType === 'list' ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-slate-400 hover:text-slate-600"
                )}
              >
                <List size={18} />
              </button>
            </div>

            <div className="relative">
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="appearance-none bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl py-4 pr-12 pl-10 font-bold text-xs focus:ring-4 focus:ring-primary/10 outline-none shadow-sm cursor-pointer min-w-[160px]"
            >
              <option value="newest">الأحدث أولاً</option>
              <option value="name">الاسم (أ-ي)</option>
              <option value="price-low">السعر (الأقل)</option>
              <option value="price-high">السعر (الأعلى)</option>
              <option value="qty-low">الكمية (الأقل)</option>
              <option value="qty-high">الكمية (الأعلى)</option>
            </select>
            <ArrowUpDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
          </div>

          <div className="flex overflow-x-auto gap-2 no-scrollbar pb-2 xl:pb-0">
            <button 
              onClick={() => setActiveCategory('all')}
              className={cn(
                "px-6 py-4 rounded-2xl font-bold text-xs whitespace-nowrap transition-all border shadow-sm",
                activeCategory === 'all' 
                  ? "bg-slate-900 dark:bg-primary text-white border-transparent shadow-lg shadow-primary/20" 
                  : "bg-white dark:bg-slate-900 text-slate-500 border-slate-200 dark:border-white/5 hover:border-primary/50"
              )}
            >
              الكل
            </button>
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={cn(
                  "px-6 py-4 rounded-2xl font-bold text-xs whitespace-nowrap transition-all border shadow-sm",
                  activeCategory === cat.id 
                    ? "bg-slate-900 dark:bg-primary text-white border-transparent shadow-lg shadow-primary/20" 
                    : "bg-white dark:bg-slate-900 text-slate-500 border-slate-200 dark:border-white/5 hover:border-primary/50"
                )}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid Header Actions (Integrated Select All) */}
      {isOwner && filteredProducts.length > 0 && (
        <div className="flex justify-start px-2">
          <button 
            onClick={toggleSelectAll}
            className={cn(
              "flex items-center gap-2 px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
              selectedIds.length === filteredProducts.length 
                ? "bg-primary/10 text-primary" 
                : "text-slate-400 hover:text-slate-900 dark:hover:text-white"
            )}
          >
            <div className={cn(
              "w-4 h-4 rounded border-2 flex items-center justify-center transition-all",
              selectedIds.length === filteredProducts.length ? "bg-primary border-primary text-white" : "border-slate-200 dark:border-white/10"
            )}>
              {selectedIds.length === filteredProducts.length && <Check size={10} strokeWidth={4} />}
            </div>
            <span>{selectedIds.length === filteredProducts.length ? 'إلغاء تحديد الكل' : 'تحديد كل العناصر المعروضة'}</span>
          </button>
        </div>
      )}

      {/* Content Area (Grid or List) */}
      {filteredProducts.length > 0 ? (
        viewType === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            <AnimatePresence mode="popLayout">
              {filteredProducts.map((p, i) => (
                <motion.div
                  key={p.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2, delay: Math.min(i * 0.03, 0.3) }}
                  className={cn(
                    "bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-3xl border transition-all group relative overflow-hidden",
                    selectedIds.includes(p.id) ? "border-primary shadow-xl ring-2 ring-primary/20" : "border-slate-100 dark:border-white/5 shadow-sm hover:shadow-xl"
                  )}
                >
                  {/* Selection Checkbox - Subtle Overlay */}
                  {isOwner && (
                    <div 
                      onClick={(e) => { e.stopPropagation(); toggleSelectOne(p.id); }}
                      className={cn(
                        "absolute top-6 left-6 z-30 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all cursor-pointer shadow-sm",
                        selectedIds.includes(p.id) 
                          ? "bg-primary border-primary text-white scale-110" 
                          : "bg-white/40 dark:bg-black/20 border-white/40 backdrop-blur-md opacity-0 group-hover:opacity-100"
                      )}
                    >
                      {selectedIds.includes(p.id) && <Check size={14} strokeWidth={3} />}
                    </div>
                  )}

                  {/* Product Image Area */}
                  <div className="aspect-square bg-slate-50 dark:bg-slate-800/50 rounded-2xl overflow-hidden mb-4 relative group/img">
                    {p.imageUrl ? (
                      <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover transition-transform group-hover/img:scale-110" loading="lazy" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 dark:text-slate-700">
                        <ImageIcon size={48} strokeWidth={1} />
                        <span className="text-[10px] font-black uppercase mt-2">لا توجد صورة</span>
                      </div>
                    )}
                    <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
                      <div className="px-3 py-1 rounded-full bg-slate-900/60 backdrop-blur-md text-[10px] font-black text-white uppercase border border-white/10 tracking-widest">
                        {p.type === 'service' ? 'خدمة' : 'منتج'} | {CATEGORIES.find(c => c.id === p.category)?.label || p.category}
                      </div>
                      {isOwner && p.sellingPrice > p.wholesalePrice && (
                        <div className="px-3 py-1 rounded-full bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-1 shadow-lg shadow-emerald-500/20">
                          <span>%{Math.round(((p.sellingPrice - p.wholesalePrice) / p.wholesalePrice) * 100)} ربح</span>
                        </div>
                      )}
                    </div>
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center p-4">
                      <button 
                        onClick={() => { setSelectedProduct(p); setIsQuickViewOpen(true); }}
                        className="bg-white text-slate-900 px-6 py-2 rounded-xl text-[10px] font-black shadow-2xl transform translate-y-4 group-hover/img:translate-y-0 transition-all active:scale-95 uppercase tracking-widest"
                      >
                        بيانات تفصيلية
                      </button>
                    </div>
                    {p.category !== 'software' && (p.quantity + (p.backroomQuantity || 0)) === 0 && (
                      <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center">
                        <span className="bg-rose-500 text-white px-4 py-2 rounded-xl text-[10px] font-black rotate-[-10deg] uppercase tracking-tighter">نفذ من المخزن</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-start">
                      <h3 className="font-black text-sm text-slate-900 dark:text-white line-clamp-1 flex-1" title={p.name}>{p.name}</h3>
                      <span className="text-[10px] font-bold text-slate-400 bg-slate-50 dark:bg-slate-800 px-2 py-0.5 rounded-lg mr-2">#{p.code}</span>
                    </div>
                    
                    <div className="flex justify-between items-end border-t border-slate-50 dark:border-white/5 pt-4">
                      <div>
                        <p className="text-[10px] font-black text-slate-400 mb-1 uppercase tracking-widest">السعر النهائي</p>
                        <p className="text-xl font-black text-primary tracking-tight leading-none">{formatCurrency(p.sellingPrice)}</p>
                      </div>
                      <div className="text-left">
                        <p className="text-[10px] font-black text-slate-400 mb-1 uppercase tracking-widest">
                          {p.type === 'service' ? 'الحالة العامة' : 'المخزون المتاح'}
                        </p>
                        <span className={cn(
                          "px-3 py-1 rounded-lg text-[10px] font-black",
                          p.type === 'service' 
                            ? "bg-indigo-500/10 text-indigo-500" 
                            : (p.quantity + (p.backroomQuantity || 0)) > 5 ? "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300" : "bg-rose-500/10 text-rose-500"
                        )}>
                          {p.type === 'service' ? 'خدمة مفعّلة' : `${p.quantity + (p.backroomQuantity || 0)} قطعة`}
                        </span>
                      </div>
                    </div>

                    {p.type === 'product' && p.backroomQuantity > 0 && (
                      <div className="bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-2xl flex items-center justify-between border border-dashed border-slate-200 dark:border-white/5">
                        <div>
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">مخزن الاستوك (Stock)</p>
                           <p className="text-xs font-black text-indigo-500 leading-none">{p.backroomQuantity} قطعة</p>
                        </div>
                        <button 
                          onClick={() => {
                            const amt = prompt(`كم قطعة تريد نقلها للعرض (Available: ${p.backroomQuantity}):`);
                            if (amt && !isNaN(Number(amt))) {
                              const n = Math.min(Number(amt), p.backroomQuantity);
                              if (n <= 0) return;
                              updateProduct({
                                ...p,
                                quantity: p.quantity + n,
                                backroomQuantity: p.backroomQuantity - n
                              });
                            }
                          }}
                          className="p-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors shadow-sm"
                          title="نقل للعرض"
                        >
                           <Check size={14} />
                        </button>
                      </div>
                    )}

                    {isOwner && (
                      <div className="pt-4 mt-2 border-t border-slate-50 dark:border-white/5 flex gap-2">
                        <button 
                          onClick={() => { setEditingProduct(p); setIsModalOpen(true); }}
                          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-50 dark:bg-white/5 hover:bg-primary/10 hover:text-primary transition-all text-[10px] font-black uppercase tracking-wider"
                        >
                          <Edit size={14} /> <span className="hidden sm:inline">تعديل</span>
                        </button>
                        <button 
                          onClick={() => setProductToDelete(p)}
                          className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/5 hover:bg-rose-500/10 hover:text-rose-500 transition-all text-slate-400"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-white/5 overflow-hidden shadow-sm">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-right border-collapse min-w-[1000px]">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-white/10">
                    {isOwner && <th className="p-5 w-16"></th>}
                    <th className="p-5 text-[10px] font-black uppercase tracking-widest text-slate-400">الصورة</th>
                    <th className="p-5 text-[10px] font-black uppercase tracking-widest text-slate-400">الاسم / الكود</th>
                    <th className="p-5 text-[10px] font-black uppercase tracking-widest text-slate-400">القسم</th>
                    <th className="p-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">المخزون (عرض/مخزن)</th>
                    {isOwner && <th className="p-5 text-[10px] font-black uppercase tracking-widest text-slate-400">سعر الجملة</th>}
                    <th className="p-5 text-[10px] font-black uppercase tracking-widest text-slate-400">سعر البيع</th>
                    {isOwner && <th className="p-5 text-[10px] font-black uppercase tracking-widest text-slate-400">الربح (%)</th>}
                    {isOwner && <th className="p-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">الإجراءات</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                  <AnimatePresence mode="popLayout">
                    {filteredProducts.map((p) => (
                      <motion.tr 
                        key={p.id}
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className={cn(
                          "group hover:bg-slate-50 dark:hover:bg-white/5 transition-colors",
                          selectedIds.includes(p.id) && "bg-primary/5 shadow-[inset_4px_0_0_0_#9333ea]"
                        )}
                      >
                        {isOwner && (
                          <td className="p-5">
                            <div 
                              onClick={() => toggleSelectOne(p.id)}
                              className={cn(
                                "w-6 h-6 rounded-full border-2 flex items-center justify-center cursor-pointer transition-all",
                                selectedIds.includes(p.id) ? "bg-primary border-primary text-white" : "border-slate-200 dark:border-white/10"
                              )}
                            >
                              {selectedIds.includes(p.id) && <Check size={14} strokeWidth={3} />}
                            </div>
                          </td>
                        )}
                        <td className="p-5">
                          <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 overflow-hidden flex items-center justify-center border border-slate-200 dark:border-white/5">
                            {p.imageUrl ? <img src={p.imageUrl} className="w-full h-full object-cover" /> : <ImageIcon size={20} className="text-slate-300" />}
                          </div>
                        </td>
                        <td className="p-5">
                          <div className="flex flex-col">
                            <span className="font-black text-sm text-slate-800 dark:text-white">{p.name}</span>
                            <span className="text-[10px] font-bold text-slate-400 tracking-wider">#{p.code}</span>
                          </div>
                        </td>
                        <td className="p-5">
                          <span className="text-[10px] font-black uppercase px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500">
                             {CATEGORIES.find(c => c.id === p.category)?.label || p.category}
                          </span>
                        </td>
                        <td className="p-5 text-center">
                          <div className="flex flex-col items-center">
                            <span className={cn(
                              "text-sm font-black",
                              (p.quantity + (p.backroomQuantity || 0)) <= 5 ? "text-rose-500" : "text-slate-700 dark:text-slate-300"
                            )}>
                              {p.type === 'service' ? 'خدمة' : `${p.quantity} / ${p.backroomQuantity}`}
                            </span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">إجمالي: {p.quantity + (p.backroomQuantity || 0)}</span>
                          </div>
                        </td>
                        {isOwner && <td className="p-5 font-black text-sm text-emerald-600">{formatCurrency(p.wholesalePrice)}</td>}
                        <td className="p-5 font-black text-sm text-primary">{formatCurrency(p.sellingPrice)}</td>
                        {isOwner && (
                          <td className="p-5">
                             {p.sellingPrice > p.wholesalePrice ? (
                               <span className="text-[10px] font-black text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-lg">
                                 %{Math.round(((p.sellingPrice - p.wholesalePrice) / p.wholesalePrice) * 100)} ربح
                               </span>
                             ) : <span className="text-slate-300">--</span>}
                          </td>
                        )}
                        {isOwner && (
                          <td className="p-5">
                            <div className="flex items-center justify-center gap-2">
                              <button 
                                onClick={() => { setEditingProduct(p); setIsModalOpen(true); }}
                                className="p-2.5 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-primary/10 hover:text-primary transition-all text-slate-400"
                              >
                                <Edit size={16} />
                              </button>
                              <button 
                                onClick={() => setProductToDelete(p)}
                                className="p-2.5 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-rose-500/10 hover:text-rose-500 transition-all text-slate-400"
                              >
                                <Trash2 size={16} />
                              </button>
                              <button 
                                onClick={() => { setSelectedProduct(p); setIsQuickViewOpen(true); }}
                                className="p-2.5 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 transition-all text-slate-400"
                              >
                                <ChevronRight size={16} />
                              </button>
                            </div>
                          </td>
                        )}
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-32 text-center"
        >
          <div className="w-24 h-24 rounded-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center mb-6">
            <Box size={40} className="text-slate-300" />
          </div>
          <h3 className="text-xl font-black text-slate-400 tracking-tight">لا توجد نتائج مطابقة</h3>
          <p className="text-slate-500 text-sm mt-2">جرب تعديل كلمات البحث أو الفلاتر</p>
          <button 
            onClick={() => { setSearch(''); setActiveCategory('all'); }}
            className="mt-6 text-primary font-bold hover:underline py-2 px-4 rounded-xl hover:bg-primary/5 transition-all"
          >
            مسح كافة الفلاتر
          </button>
        </motion.div>
      )}

      {/* Modal - Add/Edit Product */}
      <AnimatePresence>
        {isModalOpen && (
          <ProductModal 
            onClose={() => setIsModalOpen(false)} 
            onSave={handleSaveProduct} 
            initialData={editingProduct} 
          />
        )}
      </AnimatePresence>

      {/* Modal - Quick View */}
      <AnimatePresence>
        {isQuickViewOpen && selectedProduct && (
          <QuickViewModal 
            product={selectedProduct} 
            onClose={() => { setIsQuickViewOpen(false); setSelectedProduct(null); }} 
          />
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {productToDelete && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setProductToDelete(null)} 
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
                <h3 className="text-xl font-black text-slate-800 dark:text-white mb-2">تأكيد حذف {productToDelete.type === 'service' ? 'الخدمة' : 'المنتج'}</h3>
                <p className="text-slate-500 dark:text-slate-400 font-medium text-sm leading-relaxed">
                  هل أنت متأكد من حذف <span className="text-rose-500 font-black">"{productToDelete.name}"</span>؟
                  <br />
                  <span className="text-xs opacity-60">سيؤدي هذا إلى حذف الصنف نهائياً من سجلات المخزون.</span>
                </p>
              </div>

              <div className="flex flex-col gap-3">
                <button 
                  onClick={async () => {
                    try {
                      await deleteProduct(productToDelete.id);
                      setProductToDelete(null);
                    } catch (err) {
                      alert('حدث خطأ أثناء الحذف');
                    }
                  }}
                  className="w-full bg-rose-500 text-white py-5 rounded-2xl font-black shadow-xl shadow-rose-500/20 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <Trash2 size={20} />
                  <span>تأكيد الحذف النهائي</span>
                </button>
                <button 
                  onClick={() => setProductToDelete(null)}
                  className="w-full py-4 text-slate-400 font-bold text-sm tracking-widest uppercase hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                >
                  إلغاء
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function QuickViewModal({ product, onClose }: { product: Product, onClose: () => void }) {
  const { currentUser } = useStore();
  const isOwner = currentUser?.role === 'owner';

  return createPortal(
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative bg-white dark:bg-slate-900 w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden p-8 z-10"
      >
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-2xl overflow-hidden flex items-center justify-center border border-slate-100 dark:border-white/5">
              {product.imageUrl ? <img src={product.imageUrl} className="w-full h-full object-cover" /> : <Box size={24} className="text-slate-400" />}
            </div>
            <div>
              <h3 className="text-xl font-black">{product.name}</h3>
              <p className="text-xs font-bold text-slate-400">كود المنتج: #{product.code}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-rose-500 transition-colors"><X size={24} /></button>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                {product.type === 'service' ? 'نوع الخدمة' : 'الكمية الكلية'}
              </p>
              <p className="text-lg font-black">
                {product.type === 'service' ? 'خدمة فنية/برمجية' : `${product.quantity + product.backroomQuantity} قطعة`}
              </p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">القسم</p>
              <p className="text-sm font-black">{CATEGORIES.find(c => c.id === product.category)?.label || product.category}</p>
            </div>
            <div className="bg-primary/5 p-4 rounded-2xl">
              <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">سعر البيع</p>
              <p className="text-lg font-black text-primary">{formatCurrency(product.sellingPrice)}</p>
            </div>
            {isOwner && (
              <div className="bg-emerald-500/5 p-4 rounded-2xl">
                <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1">سعر الجملة</p>
                <p className="text-sm font-black text-emerald-600">{formatCurrency(product.wholesalePrice)}</p>
              </div>
            )}
          </div>

          <div className="space-y-4">
             {product.type === 'product' && (
               <>
                 <div className="flex justify-between text-xs font-bold border-b border-slate-100 dark:border-white/5 pb-2">
                    <span className="text-slate-400">في صالة العرض:</span>
                    <span>{product.quantity} قطعة</span>
                 </div>
                 <div className="flex justify-between text-xs font-bold border-b border-slate-100 dark:border-white/5 pb-2">
                    <span className="text-slate-400">في المخزن الخلفي:</span>
                    <span>{product.backroomQuantity} قطعة</span>
                 </div>
               </>
             )}
             {product.expirationDate && (
               <div className="flex justify-between text-xs font-bold border-b border-slate-100 dark:border-white/5 pb-2">
                  <span className="text-rose-500">تاريخ الانتهاء:</span>
                  <span className="text-rose-600">{product.expirationDate}</span>
               </div>
             )}
          </div>

          {product.notes && (
            <div className="bg-amber-500/5 p-4 rounded-2xl border border-amber-500/10">
              <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-1">ملاحظات المنتج</p>
              <p className="text-xs font-medium text-amber-700 leading-relaxed">{product.notes}</p>
            </div>
          )}
        </div>

        <button onClick={onClose} className="w-full mt-8 py-4 bg-slate-900 dark:bg-primary text-white rounded-2xl font-black text-xs">إغلاق</button>
      </motion.div>
    </div>,
    document.body
  );
}

function ProductModal({ 
  onClose, 
  onSave, 
  initialData 
}: { 
  onClose: () => void, 
  onSave: (data: Partial<Product>) => void,
  initialData?: Product | null
}) {
  const { currentUser } = useStore();
  const isOwner = currentUser?.role === 'owner';

  const [data, setData] = useState<Partial<Product>>(initialData || {
    category: 'accessories',
    type: 'product',
    quantity: 1,
    backroomQuantity: 0,
  });
  const [dragActive, setDragActive] = useState(false);
  const [compressing, setCompressing] = useState(false);

  const handleImageUpload = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    setCompressing(true);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        // Max resolution 800px
        const MAX_SIZE = 800;
        if (width > MAX_SIZE || height > MAX_SIZE) {
          if (width > height) {
            height = (height / width) * MAX_SIZE;
            width = MAX_SIZE;
          } else {
            width = (width / height) * MAX_SIZE;
            height = MAX_SIZE;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
        setData(prev => ({ ...prev, imageUrl: dataUrl }));
        setCompressing(false);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) {
      handleImageUpload(e.dataTransfer.files[0]);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 sm:p-6 md:p-10">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] z-10"
      >
        <div className="p-8 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-black font-sans">
              {initialData 
                ? (data.type === 'service' ? 'تعديل الخدمة' : 'تعديل بيانات المنتج') 
                : (data.type === 'service' ? 'إضافة خدمة جديدة' : 'إضافة صنف جديد')}
            </h3>
            <p className="text-[10px] text-slate-400 font-black uppercase mt-1 tracking-widest">سجل البيانات بدقة لضمان صحة الميزانية الربحية</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-primary transition-all"><X size={24} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <form className="space-y-8" id="product-form" onSubmit={(e) => { e.preventDefault(); onSave(data); }}>
            
            {/* Image Upload Area */}
            <div 
              onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
              onDragLeave={() => setDragActive(false)}
              onDrop={onDrop}
              className={cn(
                "relative h-48 rounded-3xl border-2 border-dashed flex flex-col items-center justify-center transition-all overflow-hidden bg-slate-50 dark:bg-slate-800/20",
                dragActive ? "border-primary bg-primary/5 scale-[0.98]" : "border-slate-200 dark:border-white/5",
                data.imageUrl ? "border-none" : ""
              )}
            >
              {data.imageUrl ? (
                <>
                  <img src={data.imageUrl} className="w-full h-full object-cover" alt="Preview" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                    <button type="button" onClick={() => setData(prev => ({ ...prev, imageUrl: '' }))} className="p-3 bg-rose-500 text-white rounded-2xl shadow-xl"><Trash2 size={20} /></button>
                    <label className="p-3 bg-primary text-white rounded-2xl shadow-xl cursor-pointer"><Upload size={20} /><input type="file" className="hidden" onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])} /></label>
                  </div>
                </>
              ) : (
                <>
                  <div className="p-4 rounded-3xl bg-white dark:bg-slate-800 shadow-sm mb-3">
                    {compressing ? <Loader2 className="animate-spin text-primary" /> : <Upload className="text-slate-400" />}
                  </div>
                  <p className="text-xs font-black text-slate-500 uppercase">اسحب الصورة هنا أو <label className="text-primary cursor-pointer hover:underline">اضغط للاختيار<input type="file" className="hidden" onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])} /></label></p>
                </>
              )}
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase text-slate-400 px-1">نوع المدخل (منتج أم خدمة؟)</label>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setData(prev => ({ ...prev, type: 'product' }))}
                  className={cn(
                    "flex-1 flex flex-col items-center gap-3 p-6 rounded-3xl border-[3px] transition-all",
                    data.type === 'product' 
                      ? "border-white dark:border-white bg-primary/10 text-primary shadow-2xl shadow-primary/20 scale-[1.02]" 
                      : "border-slate-100 dark:border-white/5 text-slate-400 opacity-40 hover:opacity-100"
                  )}
                >
                  <Box size={32} className={cn(data.type === 'product' ? "text-primary" : "text-slate-400")} />
                  <span className="font-black text-sm">منتج (بكمية ومخزون)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setData(prev => ({ 
                      ...prev, 
                      type: 'service',
                      quantity: 1,
                      backroomQuantity: 0
                    }))
                  }}
                  className={cn(
                    "flex-1 flex flex-col items-center gap-3 p-6 rounded-3xl border-[3px] transition-all",
                    data.type === 'service' 
                      ? "border-white dark:border-white bg-indigo-500/10 text-indigo-400 shadow-2xl shadow-indigo-500/20 scale-[1.02]" 
                      : "border-slate-100 dark:border-white/5 text-slate-400 opacity-40 hover:opacity-100"
                  )}
                >
                  <Wrench size={32} className={cn(data.type === 'service' ? "text-indigo-400" : "text-slate-400")} />
                  <span className="font-black text-sm">خدمة (بدون مخزون)</span>
                </button>
              </div>
              {['accessories', 'spare_parts', 'hardware', 'software'].includes(data.category || '') && (
                <p className="text-[9px] font-bold text-slate-400 mr-2">* يتم تفعيل نظام المخزون تلقائياً لهذا القسم</p>
              )}
              {['maintenance', 'finance'].includes(data.category || '') && (
                <p className="text-[9px] font-bold text-indigo-400 mr-2">* يتم تفعيل نظام "بدون مخزون" تلقائياً لهذا القسم</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 px-1">
                  {data.type === 'service' ? 'اسم الخدمة' : 'اسم الصنف'}
                </label>
                <input 
                  required
                  type="text" 
                  value={data.name || ''}
                  onChange={(e) => setData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-white/5 rounded-2xl p-4 font-bold outline-none focus:ring-4 focus:ring-primary/10 transition-all"
                  placeholder={data.type === 'service' ? "مثال: صيانة شاشة آيفون 13" : "مثال: شاحن آيفون الأصلي"}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 px-1">الكود / الباركود</label>
                <div className="relative group">
                  <input 
                    type="text" 
                    value={data.code || ''}
                    onChange={(e) => setData(prev => ({ ...prev, code: e.target.value }))}
                    className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-white/5 rounded-2xl p-4 font-bold outline-none focus:ring-4 focus:ring-primary/10 transition-all"
                    placeholder="سيتم التوليد تلقائياً إذا ترك فارغاً"
                  />
                  <QrCode size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-colors" />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 px-1">القسم المستهدف</label>
                <select 
                  value={data.category}
                  onChange={(e) => {
                    const cat = e.target.value as Category;
                    const isTangible = ['accessories', 'spare_parts', 'hardware', 'software'].includes(cat);
                    const isServiceOnly = ['maintenance', 'finance'].includes(cat);
                    setData(prev => ({ 
                      ...prev, 
                      category: cat,
                      type: isTangible ? 'product' : (isServiceOnly ? 'service' : prev.type)
                    }));
                  }}
                  className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-white/5 rounded-2xl p-4 font-bold outline-none focus:ring-4 focus:ring-primary/10 transition-all appearance-none cursor-pointer"
                >
                  {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                </select>
              </div>

              {data.type === 'product' && (
                <>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 px-1">الكمية المتاحة حالياً</label>
                    <input 
                      required
                      type="number" 
                      value={data.quantity || ''}
                      onChange={(e) => setData(prev => ({ ...prev, quantity: Number(e.target.value) }))}
                      className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-white/5 rounded-2xl p-4 font-bold outline-none focus:ring-4 focus:ring-primary/10 transition-all"
                      placeholder="مثال: 50"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 px-1">الكمية في المخزن (Stock Area)</label>
                    <input 
                      type="number" 
                      value={data.backroomQuantity || ''}
                      onChange={(e) => setData(prev => ({ ...prev, backroomQuantity: Number(e.target.value) }))}
                      className="w-full bg-indigo-500/5 border border-indigo-500/10 rounded-2xl p-4 font-bold text-indigo-600 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
                      placeholder="البضاعة المخزنة احتياطياً"
                    />
                  </div>
                </>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {isOwner && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 px-1 text-primary">
                      {data.type === 'service' ? 'تكلفة الخدمة (Wholesale)' : 'سعر الجملة (التكلفة)'}
                    </label>
                    <input 
                      required
                      type="number" 
                      value={data.wholesalePrice || ''}
                      onChange={(e) => setData(prev => ({ ...prev, wholesalePrice: Number(e.target.value) }))}
                      className="w-full bg-primary/5 border border-primary/20 rounded-2xl p-4 font-black outline-none focus:ring-4 focus:ring-primary/10 transition-all text-primary"
                      placeholder="0.00"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 px-1 text-emerald-500">
                    {data.type === 'service' ? 'سعر الخدمة النهائي' : 'سعر البيع'}
                  </label>
                  <input 
                    required
                    type="number" 
                    value={data.sellingPrice || ''}
                    onChange={(e) => setData(prev => ({ ...prev, sellingPrice: Number(e.target.value) }))}
                    className="w-full bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-4 font-black outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all text-emerald-600"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 px-1">تاريخ الانتهاء (اختياري)</label>
                <input 
                  type="date" 
                  value={data.expirationDate || ''}
                  onChange={(e) => setData(prev => ({ ...prev, expirationDate: e.target.value }))}
                  className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-white/5 rounded-2xl p-4 font-bold outline-none focus:ring-4 focus:ring-primary/10 transition-all"
                />
              </div>

              <div className="md:col-span-2 space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 px-1">ملاحظات إضافية</label>
                <textarea 
                  rows={3}
                  value={data.notes || ''}
                  onChange={(e) => setData(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-white/5 rounded-2xl p-4 font-medium outline-none focus:ring-4 focus:ring-primary/10 transition-all resize-none"
                  placeholder="أدخل ميزات المنتج أو شروط الضمان..."
                />
              </div>
            </div>
          </form>
        </div>

        <div className="p-8 border-t border-slate-100 dark:border-white/5 flex gap-4 bg-slate-50 dark:bg-slate-900/50">
          <button onClick={onClose} className="flex-1 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-2xl font-bold transition-all hover:bg-slate-100 active:scale-95 text-sm">إلغاء</button>
          <button 
            type="submit" 
            form="product-form"
            className="flex-[2] py-4 bg-primary text-white rounded-2xl font-black shadow-xl shadow-primary/20 transition-all hover:translate-y-[-2px] active:scale-[0.98] text-sm flex items-center justify-center gap-2"
          >
            <Check size={20} />
            <span>{initialData ? 'حفظ التعديلات' : 'تأكيد الإضافة للمخزون'}</span>
          </button>
        </div>
      </motion.div>
    </div>,
    document.body
  );
}
