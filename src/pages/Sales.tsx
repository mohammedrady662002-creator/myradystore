import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Minus, 
  Trash2, 
  ShoppingCart, 
  CreditCard, 
  Banknote, 
  Smartphone, 
  Search, 
  Scan,
  User as UserIcon,
  TicketPercent,
  CheckCircle2,
  ChevronLeft,
  X,
  TriangleAlert,
  ShieldCheck,
  Edit,
  Loader2,
  HandCoins
} from 'lucide-react';
import { useStore, Product, Sale, PaymentMethod } from '../lib/store';
import { cn, formatCurrency, generateId } from '../lib/utils';

interface CartItem {
  product: Product;
  quantity: number;
  customPrice: number;
}

export default function Sales() {
  const { products, addSale, updateProduct, currentUser, addTransaction, customers, addCustomer, updateCustomer } = useStore();
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [success, setSuccess] = useState(false);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);

  // Debt Customer State
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [isAddingNewCustomer, setIsAddingNewCustomer] = useState(false);
  
  const isOwner = currentUser?.role === 'owner';

  const filteredProducts = useMemo(() => {
    if (!search || search.length < 2) return [];
    return products.filter(p => 
      p.name.toLowerCase().includes(search.toLowerCase()) || 
      p.code.includes(search)
    ).slice(0, 8);
  }, [products, search]);

  const addToCart = (product: Product) => {
    if (product.type === 'product' && product.quantity <= 0) return;
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        if (product.type === 'product' && existing.quantity >= product.quantity) return prev;
        return prev.map(item => item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { product, quantity: 1, customPrice: product.sellingPrice }];
    });
    setSearch('');
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.product.id === id) {
        const maxQty = item.product.type === 'service' ? 999 : item.product.quantity;
        const newQty = Math.max(1, Math.min(maxQty, item.quantity + delta));
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const updatePrice = (id: string, price: number) => {
    if (!isOwner) return; // Only owner can change prices at checkout
    setCart(prev => prev.map(item => {
      if (item.product.id === id) return { ...item, customPrice: price };
      return item;
    }));
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.product.id !== id));
  };

  const totals = useMemo(() => {
    const subtotal = cart.reduce((acc, item) => acc + (item.customPrice * item.quantity), 0);
    const total = Math.max(0, subtotal - discount);
    return { subtotal, total };
  }, [cart, discount]);

  const { sales: allSales, deleteSale } = useStore();

  const CATEGORY_LABELS: Record<string, string> = {
    accessories: 'إكسسوارات',
    hardware: 'قطع غيار / شاشات',
    maintenance: 'صيانة',
    software: 'سوفت وير / برامج',
    finance: 'خدمات مالية'
  };

  const filteredInfoCustomers = useMemo(() => {
    if (!customerSearch) return [];
    return customers.filter(c => 
      c.name.toLowerCase().includes(customerSearch.toLowerCase()) || 
      c.phone?.includes(customerSearch)
    ).slice(0, 5);
  }, [customers, customerSearch]);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    
    // Validate customer for debt payment
    if (paymentMethod === 'debt') {
      if (isAddingNewCustomer && !newCustomerName.trim()) {
        alert('يرجى إدخال اسم العميل الجديد');
        return;
      }
      if (!isAddingNewCustomer && !selectedCustomerId) {
        alert('يرجى اختيار عميل من القائمة أو إضافة عميل جديد');
        return;
      }
    }

    try {
      let finalCustomerId = selectedCustomerId;
      let finalCustomerName = '';
      let finalCustomerPhone = '';

      if (paymentMethod === 'debt') {
        if (isAddingNewCustomer) {
          const newId = generateId();
          await addCustomer({
            id: newId,
            name: newCustomerName,
            phone: newCustomerPhone,
            totalDebt: totals.total,
            createdAt: new Date().toISOString()
          });
          finalCustomerId = newId;
          finalCustomerName = newCustomerName;
          finalCustomerPhone = newCustomerPhone;
        } else {
          const customer = customers.find(c => c.id === selectedCustomerId);
          if (customer) {
            await updateCustomer({
              ...customer,
              totalDebt: (customer.totalDebt || 0) + totals.total
            });
            finalCustomerName = customer.name;
            finalCustomerPhone = customer.phone || '';
          }
        }
      }

      for (const item of cart) {
        const wholesaleUnitCost = item.product.wholesalePrice;
        const profitPerUnit = item.customPrice - wholesaleUnitCost;
        const totalProfit = (profitPerUnit * item.quantity) - (discount / cart.length);
      
      const newSale: Sale = {
        id: generateId(),
        productId: item.product.id,
        productName: item.product.name,
        category: item.product.category,
        type: item.product.type,
        quantity: item.quantity,
        unitPrice: item.customPrice,
        totalBasePrice: item.customPrice * item.quantity,
        wholesaleTotalCost: wholesaleUnitCost * item.quantity,
        discount: discount / cart.length,
        finalPrice: (item.customPrice * item.quantity) - (discount / cart.length),
        profit: totalProfit,
        method: paymentMethod,
          date: new Date().toISOString(),
          customerId: paymentMethod === 'debt' ? finalCustomerId : undefined,
          customerName: paymentMethod === 'debt' ? finalCustomerName : undefined,
          customerPhone: paymentMethod === 'debt' ? finalCustomerPhone : undefined,
        };
        
        await addSale(newSale);
        
        // Update inventory (Skip for services)
        if (item.product.type === 'product') {
          const updatedProduct = { ...item.product, quantity: item.product.quantity - item.quantity };
          await updateProduct(updatedProduct);
        }
      }

      setSuccess(true);
      setCart([]);
      setDiscount(0);
      setSearch('');
      setNewCustomerName('');
      setNewCustomerPhone('');
      setSelectedCustomerId('');
      setCustomerSearch('');
      setIsAddingNewCustomer(false);
      setPaymentMethod('cash');
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Checkout failed:', err);
      alert('فشلت عملية البيع. يرجى التأكد من اتصال الإنترنت');
    }
  };

  return (
    <div className="space-y-12 pb-32 lg:pb-12">
      <div className="flex flex-col gap-8">
        
        {/* Top: POS Input (Full Width) */}
        <div className="w-full space-y-8">
        {/* Search Header */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-white/5 shadow-sm relative z-[80]">
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 bg-primary/10 text-primary rounded-2xl">
              <ShoppingCart size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-black tracking-tight">نقطة البيع (POS)</h2>
              <p className="text-xs text-slate-400 font-bold uppercase mt-1">نظام البيع السريع والاحترافي لمتجر راضي</p>
            </div>
          </div>

          <div className="relative group">
            <div className="absolute inset-y-0 right-3 sm:right-5 flex items-center text-slate-400 group-focus-within:text-primary transition-colors">
              <Search className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <input 
              type="text" 
              placeholder="ابحث بالاسم أو الكود (مثال: شاحن، آيفون...)" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-white/5 rounded-2xl py-4 sm:py-6 pr-12 sm:pr-16 pl-12 sm:pl-16 font-black outline-none focus:ring-4 focus:ring-primary/10 transition-all text-base sm:text-xl"
              autoFocus
            />
            <div className="absolute left-2.5 sm:left-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
               <span className="hidden sm:block text-[10px] font-black uppercase text-slate-300 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-lg">F2 للبحث</span>
               <div className="p-2 sm:p-2.5 bg-primary/10 text-primary rounded-xl">
                 <Scan className="w-4 h-4 sm:w-5 sm:h-5" />
               </div>
            </div>

            {/* Professional Dropdown Results */}
            <AnimatePresence>
              {filteredProducts.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute top-full left-0 right-0 mt-4 bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl border border-slate-100 dark:border-white/10 overflow-hidden z-[100] p-3 space-y-1.5"
                >
                  <p className="text-[10px] font-black text-slate-400 uppercase px-4 py-2 border-b border-slate-50 dark:border-white/5 mb-2">نتائج البحث المتاحة</p>
                  {filteredProducts.map(p => (
                    <button
                      key={p.id}
                      onClick={() => addToCart(p)}
                      className={cn(
                        "w-full p-4 rounded-2xl flex items-center justify-between transition-all group",
                        p.quantity > 0 ? "hover:bg-primary/5 dark:hover:bg-primary/10" : "opacity-40 cursor-not-allowed"
                      )}
                      disabled={p.quantity === 0}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center overflow-hidden border border-slate-100 dark:border-white/5">
                          {p.imageUrl ? <img src={p.imageUrl} className="w-full h-full object-cover" /> : <Smartphone size={24} className="text-slate-300" />}
                        </div>
                      <div className="text-right">
                        <p className="font-black text-sm group-hover:text-primary transition-colors">{p.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[9px] font-black uppercase bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-500">{CATEGORY_LABELS[p.category] || p.category}</span>
                          {p.type === 'service' ? (
                            <span className="text-[9px] font-black uppercase text-indigo-500 bg-indigo-500/5 px-2 py-0.5 rounded">خدمة (بدون مخزون)</span>
                          ) : (
                            <span className={cn(
                              "text-[9px] font-black uppercase px-2 py-0.5 rounded",
                              p.quantity > 0 ? "text-emerald-500 bg-emerald-500/5" : "text-rose-500 bg-rose-500/5"
                            )}>
                              متبقي: {p.quantity}
                            </span>
                          )}
                        </div>
                      </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <p className="font-black text-lg text-primary">{formatCurrency(p.sellingPrice)}</p>
                        <span className="text-[9px] font-bold text-slate-400 italic">#{p.code}</span>
                      </div>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Cart Display */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-4 mb-2">
            <h3 className="font-black text-sm uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <ShoppingCart size={16} /> قائمة المشتريات الحالية
            </h3>
            <span className="text-[10px] font-bold bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">{cart.length} أصناف</span>
          </div>
          
          <AnimatePresence mode="popLayout">
            {cart.length > 0 ? cart.map(item => (
              <motion.div 
                key={item.product.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-100 dark:border-white/5 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm group hover:border-primary/20 transition-all"
              >
                <div className="flex items-center gap-5 flex-1 w-full">
                  <div className="w-16 h-16 rounded-[1.25rem] bg-slate-50 dark:bg-slate-800 flex items-center justify-center overflow-hidden border border-slate-100 dark:border-white/5 relative">
                    {item.product.imageUrl ? <img src={item.product.imageUrl} className="w-full h-full object-cover" /> : <Smartphone className="text-slate-300" size={32} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-black text-base truncate">{item.product.name}</h4>
                    <div className="flex items-center gap-3 mt-1">
                       <span className="text-[10px] font-bold text-slate-400 uppercase">{CATEGORY_LABELS[item.product.category] || item.product.category} | {item.product.type === 'service' ? 'خـدمة' : 'مـنتج'}</span>
                       <div className="w-1 h-1 rounded-full bg-slate-200"></div>
                       {isOwner ? (
                         <input 
                           type="number" 
                           value={item.customPrice}
                           onChange={(e) => updatePrice(item.product.id, Number(e.target.value))}
                           className="bg-primary/5 text-primary text-[10px] font-black border-none focus:ring-0 w-20 p-0 h-4 rounded cursor-edit"
                           title="اضغط لتعديل سعر الوحدة للمدير"
                         />
                       ) : (
                         <span className="text-[10px] font-black text-primary uppercase">سعر الوحدة: {formatCurrency(item.customPrice)}</span>
                       )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-8 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-4 md:pt-0 border-slate-50 dark:border-white/5">
                  <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800 p-2 rounded-2xl border border-slate-100 dark:border-white/5">
                    <button onClick={() => updateQuantity(item.product.id, -1)} className="w-10 h-10 rounded-xl bg-white dark:bg-slate-700 flex items-center justify-center text-slate-500 hover:text-rose-500 transition-all shadow-sm active:scale-90"><Minus size={16} /></button>
                    <span className="font-black text-xl w-10 text-center">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.product.id, 1)} className="w-10 h-10 rounded-xl bg-white dark:bg-slate-700 flex items-center justify-center text-slate-500 hover:text-emerald-500 transition-all shadow-sm active:scale-90"><Plus size={16} /></button>
                  </div>
                  
                  <div className="text-left min-w-[120px]">
                    <p className="text-[10px] font-black text-slate-400 mb-0.5 uppercase tracking-wider">الإجمالي</p>
                    <p className="font-black text-xl text-primary">{formatCurrency(item.customPrice * item.quantity)}</p>
                  </div>
                  
                  <button onClick={() => removeFromCart(item.product.id)} className="p-4 text-slate-300 hover:text-rose-500 hover:bg-rose-500/10 rounded-2xl transition-all"><Trash2 size={24} /></button>
                </div>
              </motion.div>
            )) : (
              <div className="py-24 bg-white dark:bg-slate-900/40 rounded-[2.5rem] border border-dashed border-slate-200 dark:border-white/10 flex flex-col items-center justify-center text-center">
                <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6 text-slate-300">
                  <ShoppingCart size={48} strokeWidth={1.5} />
                </div>
                <h4 className="text-xl font-black text-slate-400">سلة البيع فارغة</h4>
                <p className="text-sm font-bold text-slate-500/60 mt-2">قم بمسح الباركود أو البحث عن صنف لبدء الفاتورة</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Bottom: Checkout Summary (Full Width) */}
      <div className="w-full">
        <div className="bg-slate-900 dark:bg-slate-950 text-white rounded-[2rem] sm:rounded-[3rem] p-6 sm:p-10 shadow-2xl border border-white/5">
          <div className="flex items-center justify-between mb-8 sm:mb-10">
            <h3 className="text-xl sm:text-2xl font-black flex items-center gap-3">
              الفاتورة <span className="opacity-20 text-xs sm:text-sm font-bold">#TEMP-{new Date().getTime().toString().slice(-6)}</span>
            </h3>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/10 rounded-2xl flex items-center justify-center"><Banknote size={20} className="text-primary" /></div>
          </div>
          
          <div className="space-y-8 mb-12">
            <div className="flex justify-between items-center text-slate-400 font-black uppercase text-xs tracking-widest">
              <span>المجموع الكلي للمنتجات</span>
              <span className="text-white text-lg">{formatCurrency(totals.subtotal)}</span>
            </div>
            
            <div className="space-y-4 pt-8 border-t border-white/10">
              <div className="flex items-center justify-between">
                 <label className="text-xs font-black uppercase text-slate-500 flex items-center gap-2">
                   <TicketPercent size={18} className="text-rose-500" /> خصم إضافي للعميل
                 </label>
                 {discount > 0 && <button onClick={() => setDiscount(0)} className="text-[10px] font-black text-rose-500 uppercase">إلغاء الخصم</button>}
              </div>
              <div className="relative">
                <input 
                  type="number" 
                  value={discount || ''}
                  onChange={(e) => setDiscount(Number(e.target.value))}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 font-black outline-none focus:border-primary transition-all text-2xl text-emerald-500"
                  placeholder="0.00"
                />
                <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600 font-black">ج.م</span>
              </div>
            </div>

            <div className="space-y-4 pt-8 border-t border-white/10">
              <label className="text-xs font-black uppercase text-slate-500 flex items-center gap-2">وسيلة استلام المبلغ</label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: 'cash', label: 'نقدي (الخزينة)', icon: Banknote },
                  { id: 'vodafone', label: 'فودافون كاش', icon: Smartphone },
                  { id: 'bank', label: 'البنك / إنستا باي', icon: CreditCard },
                  { id: 'debt', label: 'الدين / الشكك', icon: HandCoins },
                ].map(method => (
                  <button
                    key={method.id}
                    onClick={() => setPaymentMethod(method.id as PaymentMethod)}
                    className={cn(
                      "flex items-center gap-3 p-4 sm:p-5 rounded-2xl border transition-all font-black text-[10px] sm:text-xs",
                      paymentMethod === method.id 
                        ? "bg-primary border-primary text-white shadow-xl shadow-primary/20 scale-[1.02]" 
                        : "bg-white/5 border-white/10 text-slate-400 hover:border-white/20"
                    )}
                  >
                    <method.icon size={18} />
                    <span className="truncate">{method.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {paymentMethod === 'debt' && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-4 pt-8 border-t border-white/10"
              >
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-black uppercase text-slate-500 flex items-center gap-2">
                    <UserIcon size={18} className="text-amber-500" /> بيانات العميل (المديون)
                  </label>
                  <button 
                    onClick={() => {
                      setIsAddingNewCustomer(!isAddingNewCustomer);
                      setSelectedCustomerId('');
                      setCustomerSearch('');
                    }}
                    className="text-[10px] font-black text-primary uppercase"
                  >
                    {isAddingNewCustomer ? 'اختر من القائمة' : '+ إضافة عميل جديد'}
                  </button>
                </div>

                {isAddingNewCustomer ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <input 
                      type="text" 
                      placeholder="اسم العميل الجديد (أساسي)" 
                      value={newCustomerName}
                      onChange={(e) => setNewCustomerName(e.target.value)}
                      className="bg-white/5 border border-white/10 rounded-2xl px-6 py-4 font-bold outline-none focus:border-primary transition-all text-sm text-white"
                    />
                    <input 
                      type="text" 
                      placeholder="رقم التليفون (اختياري)" 
                      value={newCustomerPhone}
                      onChange={(e) => setNewCustomerPhone(e.target.value)}
                      className="bg-white/5 border border-white/10 rounded-2xl px-6 py-4 font-bold outline-none focus:border-primary transition-all text-sm text-white"
                    />
                  </div>
                ) : (
                  <div className="relative group">
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <input 
                          type="text" 
                          placeholder="ابحث عن عميل مسجل..." 
                          value={customerSearch}
                          onChange={(e) => setCustomerSearch(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 font-bold outline-none focus:border-primary transition-all text-sm text-white"
                        />
                        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                      </div>
                    </div>
                    
                    <AnimatePresence>
                      {customerSearch && filteredInfoCustomers.length > 0 && (
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="absolute bottom-full left-0 right-0 mb-2 bg-slate-800 border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-[110]"
                        >
                          {filteredInfoCustomers.map(c => (
                            <button
                              key={c.id}
                              onClick={() => {
                                setSelectedCustomerId(c.id);
                                setCustomerSearch(c.name);
                              }}
                              className={cn(
                                "w-full p-4 text-right flex items-center justify-between hover:bg-white/5 transition-colors",
                                selectedCustomerId === c.id ? "bg-primary/20 text-primary" : "text-slate-300"
                              )}
                            >
                              <div className="flex flex-col items-start text-left">
                                <p className="font-bold text-sm tracking-tight">{formatCurrency(c.totalDebt)}</p>
                                <span className="text-[10px] uppercase font-bold opacity-40">الدين الحالي</span>
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-sm">{c.name}</p>
                                <p className="text-[10px] opacity-40">{c.phone || 'بدون تليفون'}</p>
                              </div>
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </motion.div>
            )}
          </div>

          {/* Large Total Display */}
          <div className="bg-white/5 p-6 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] border border-primary/20 mb-8 sm:mb-10 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-primary/20 transition-all"></div>
            <div className="relative flex justify-between items-end">
              <div>
                <p className="text-[9px] sm:text-[10px] font-black text-slate-500 mb-2 uppercase tracking-widest">إجمالي المبلغ النهائي</p>
                <h2 className="text-3xl sm:text-5xl font-black text-white leading-none tracking-tighter">
                  {formatCurrency(totals.total).split(' ')[0]} 
                  <span className="text-base sm:text-lg text-primary mr-2">ج.م</span>
                </h2>
              </div>
              <div className="text-left bg-primary/20 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl border border-primary/30">
                <p className="text-[8px] sm:text-[9px] font-black text-primary mb-1 uppercase">قطع</p>
                <p className="font-black text-xl sm:text-2xl text-white">{cart.reduce((a, b) => a + b.quantity, 0)}</p>
              </div>
            </div>
          </div>

          <button 
            onClick={handleCheckout}
            disabled={cart.length === 0}
            className="w-full bg-primary hover:bg-primary/90 text-white font-black py-5 sm:py-7 rounded-[1.5rem] sm:rounded-[2rem] shadow-2xl shadow-primary/30 transition-all transform active:scale-95 disabled:opacity-50 disabled:grayscale text-lg sm:text-xl flex items-center justify-center gap-4 group"
          >
            <span>تأكيد الفاتورة وإتمام البيع</span>
            <ChevronLeft size={24} className="group-hover:-translate-x-2 transition-transform" />
          </button>
          
          <div className="mt-8 flex items-center justify-center gap-2 opacity-30 text-[9px] font-black uppercase tracking-[0.2em]">
             <ShieldCheck size={12} /> نظام حماية المعاملات راضي ستور
          </div>
        </div>
      </div>

      {/* Success Success Popover */}
      <AnimatePresence>
        {success && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8, y: 100 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 100 }}
            className="fixed bottom-28 lg:bottom-12 left-1/2 -translate-x-1/2 bg-emerald-500 text-white px-10 py-8 rounded-[3rem] shadow-[0_30px_60px_-12px_rgba(16,185,129,0.45)] border-4 border-white/20 flex flex-col items-center gap-4 z-[500] min-w-[320px]"
          >
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center border-2 border-white/10">
              <CheckCircle2 size={48} className="text-white" />
            </div>
            <div className="text-center">
              <h4 className="font-black text-2xl">تم البيع بنجاح!</h4>
              <p className="text-sm font-bold opacity-80 mt-1 uppercase tracking-wider">تم تحديث المخزون ومزامنة السحابة</p>
            </div>
            <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden mt-2">
               <motion.div initial={{ width: '100%' }} animate={{ width: 0 }} transition={{ duration: 3 }} className="h-full bg-white" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sales History Log */}
      <div className="w-full mt-12 mb-20">
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-white/5 overflow-hidden shadow-sm">
          <div className="p-8 border-b border-slate-50 dark:border-white/5 flex items-center justify-between">
            <div>
              <h3 className="text-xl font-black">سجل المبيعات الحديثة</h3>
              <p className="text-xs text-slate-400 font-bold uppercase mt-1 tracking-wider">عرض كافة المنتجات التي تم بيعها وتتبع الأقسام</p>
            </div>
            <div className="p-3 bg-indigo-500/10 text-indigo-500 rounded-2xl">
              <ShoppingCart size={20} />
            </div>
          </div>

          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-right">
              <thead>
                <tr className="text-[10px] uppercase font-black text-slate-400 tracking-wider">
                  <th className="px-8 py-6">المنتج</th>
                  <th className="px-8 py-6">القسم</th>
                  <th className="px-8 py-6">الكمية</th>
                  <th className="px-8 py-6">السعر النهائي</th>
                  <th className="px-8 py-6">الدفع</th>
                  <th className="px-8 py-6">التاريخ</th>
                  {isOwner && <th className="px-8 py-6">إجراءات</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-white/5 font-medium">
                {allSales.length > 0 ? (
                  allSales.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 50).map(sale => (
                    <tr key={sale.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group">
                      <td className="px-8 py-6">
                        <p className="font-black text-sm">{sale.productName}</p>
                      </td>
                      <td className="px-8 py-6">
                        <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-[10px] font-black text-slate-500">
                          {CATEGORY_LABELS[sale.category] || sale.category}
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        <p className="font-bold text-sm text-slate-600">{sale.quantity} ق</p>
                      </td>
                      <td className="px-8 py-6">
                        <p className="font-black text-emerald-500 text-sm">{formatCurrency(sale.finalPrice)}</p>
                      </td>
                      <td className="px-8 py-6">
                         <div className="flex items-center gap-2">
                           {sale.method === 'cash' ? <Banknote size={14} className="text-emerald-500" /> : 
                            sale.method === 'vodafone' ? <Smartphone size={14} className="text-rose-500" /> : 
                            sale.method === 'bank' ? <CreditCard size={14} className="text-sky-500" /> :
                            <HandCoins size={14} className="text-amber-500" />}
                           <div className="flex flex-col">
                             <span className="text-[10px] font-bold text-slate-400 lowercase">
                               {sale.method === 'debt' ? 'دين' : sale.method}
                             </span>
                             {sale.method === 'debt' && sale.customerName && (
                               <span className="text-[9px] font-black text-rose-500 truncate max-w-[100px]">
                                 👤 {sale.customerName}
                               </span>
                             )}
                           </div>
                         </div>
                      </td>
                      <td className="px-8 py-6 text-[10px] text-slate-400 font-bold whitespace-nowrap">
                        {new Date(sale.date).toLocaleString('en-US', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', hour12: true })}
                      </td>
                      {isOwner && (
                        <td className="px-8 py-6 text-left">
                          <div className="flex items-center justify-end gap-2">
                            <button 
                              onClick={() => setEditingSale(sale)}
                              className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-primary transition-colors"
                            >
                              <Edit size={14} />
                            </button>
                            <button 
                              onClick={async () => { 
                                if(confirm('هل تريد حذف سجل هذه العملية؟')) {
                                  try {
                                    await deleteSale(sale.id);
                                  } catch (err) {
                                    alert('حدث خطأ أثناء الحذف');
                                  }
                                } 
                              }}
                              className="p-2 rounded-lg bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-all transform active:scale-95"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-24 text-center opacity-30 text-sm font-black uppercase tracking-widest italic">لا توجد مبيعات مسجلة حتى الآن</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      {/* Edit Sale Modal */}
      <AnimatePresence>
        {editingSale && (
          <EditSaleModal 
            sale={editingSale} 
            onClose={() => setEditingSale(null)} 
          />
        )}
      </AnimatePresence>
      </div>
    </div>
  );
}

function EditSaleModal({ sale, onClose }: { sale: Sale, onClose: () => void }) {
  const { updateSale } = useStore();
  const [data, setData] = useState<Sale>({ ...sale });
  const [isSaving, setIsSaving] = useState(false);

  // Link categories to labels
  const CATEGORY_LABELS: Record<string, string> = {
    accessories: 'إكسسوارات',
    hardware: 'قطع غيار / شاشات',
    maintenance: 'صيانة',
    software: 'سوفت وير / برامج',
    finance: 'خدمات مالية'
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Calculate new profit based on updated values
      // Note: This is an approximation since we don't have the wholesale price here easily
      // In a real app we'd fetch the product again or store more info
      await updateSale(data);
      onClose();
    } catch (err) {
      alert('فشل تحديث البيانات');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative bg-white dark:bg-slate-900 w-full max-w-lg rounded-[3rem] shadow-2xl p-10 overflow-hidden text-right"
      >
        <div className="mb-10 flex justify-between items-center">
            <h3 className="text-2xl font-black">تعديل عملية بيع</h3>
            <button onClick={onClose} className="text-slate-400 hover:text-rose-500"><X size={24} /></button>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase">اسم المنتج</label>
            <input 
              type="text" 
              value={data.productName} 
              disabled 
              className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl p-4 font-bold opacity-60"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase">الكمية المباعة</label>
              <input 
                type="number" 
                value={data.quantity}
                onChange={(e) => setData(prev => ({ ...prev, quantity: Number(e.target.value), finalPrice: (prev.unitPrice || 0) * Number(e.target.value) - (prev.discount || 0) }))}
                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl p-4 font-black"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase">سعر الوحدة</label>
              <input 
                type="number" 
                value={data.unitPrice}
                onChange={(e) => setData(prev => ({ ...prev, unitPrice: Number(e.target.value), finalPrice: Number(e.target.value) * (prev.quantity || 0) - (prev.discount || 0) }))}
                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl p-4 font-black"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase">الخصم الإجمالي</label>
            <input 
              type="number" 
              value={data.discount}
              onChange={(e) => setData(prev => ({ ...prev, discount: Number(e.target.value), finalPrice: (prev.unitPrice || 0) * (prev.quantity || 0) - Number(e.target.value) }))}
              className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl p-4 font-black text-rose-500"
            />
          </div>

          <div className="p-6 bg-primary/5 rounded-3xl border border-primary/10">
            <p className="text-[10px] font-black text-primary uppercase mb-1">المبلغ النهائي بعد التعديل</p>
            <p className="text-3xl font-black">{formatCurrency(data.finalPrice)}</p>
          </div>

          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="w-full bg-primary text-white py-5 rounded-2xl font-black shadow-xl flex items-center justify-center gap-3 transition-all transform active:scale-95"
          >
            {isSaving ? <Loader2 className="animate-spin" /> : <CheckCircle2 size={20} />}
            حفظ التعديلات في السجل
          </button>
        </div>
      </motion.div>
    </div>
  );
}
