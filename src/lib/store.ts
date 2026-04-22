import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { supabase, supabaseUrl } from './supabase';

// Helper for mapping field names between JS (camelCase) and Postgres (snake_case)
const camelToSnake = (obj: any) => {
  const newObj: any = {};
  for (const key in obj) {
    const snakeKey = key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
    newObj[snakeKey] = obj[key];
  }
  return newObj;
};

const snakeToCamel = (obj: any) => {
  if (!obj) return obj;
  const newObj: any = {};
  for (const key in obj) {
    const camelKey = key.replace(/(_\w)/g, (m) => m[1].toUpperCase());
    newObj[camelKey] = obj[key];
  }
  return newObj;
};

export type UserRole = 'owner' | 'employee';

export interface User {
  id: string;
  name: string;
  role: UserRole;
}

export type Category = 'accessories' | 'hardware' | 'maintenance' | 'software' | 'finance' | 'spare_parts';

export interface Product {
  id: string;
  name: string;
  code: string;
  wholesalePrice: number;
  sellingPrice: number;
  quantity: number; // On display / Ready for sale
  backroomQuantity: number; // In stock / Backroom
  notes: string;
  imageUrl: string;
  category: Category;
  type: 'product' | 'service';
  createdAt: string;
  expirationDate?: string;
}

export type PaymentMethod = 'cash' | 'vodafone' | 'bank' | 'debt';

export interface Sale {
  id: string;
  productId: string;
  productName: string;
  category: Category;
  type: 'product' | 'service';
  quantity: number;
  unitPrice: number;
  totalBasePrice: number;
  wholesaleTotalCost: number;
  discount: number;
  finalPrice: number;
  profit: number; // Commission only
  method: PaymentMethod;
  date: string;
  notes?: string;
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone?: string;
  imageUrl?: string;
  totalDebt: number;
  createdAt: string;
}

export interface BankTransaction {
  id: string;
  type: 'withdraw' | 'deposit' | 'transfer' | 'adjustment';
  sourceAccount: PaymentMethod | 'external';
  destinationAccount?: PaymentMethod | 'external';
  profitAccount?: PaymentMethod; // Where the commission/profit is added
  amount: number;
  commission: number;
  notes: string;
  date: string;
  customerId?: string;
  proofImageUrl?: string;
}

export interface StoreState {
  currentUser: User | null;
  products: Product[];
  sales: Sale[];
  transactions: BankTransaction[];
  customers: Customer[];
  isDarkMode: boolean;
  ownerPin: string;
  employeePin: string;
  isInitialized: boolean;
  syncError: string | null;
  syncStatus: {
    products: boolean;
    sales: boolean;
    transactions: boolean;
    customers: boolean;
  };
  
  // Auth
  setCurrentUser: (user: User | null) => void;
  updatePin: (role: UserRole, newPin: string) => void;
  
  // Data Lifecycle
  initializeStore: () => () => void;
  
  // Products
  addProduct: (product: Product) => Promise<void>;
  updateProduct: (product: Product) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  
  // Sales
  addSale: (sale: Sale) => Promise<void>;
  updateSale: (sale: Sale) => Promise<void>;
  deleteSale: (id: string) => Promise<void>;
  
  // Transactions
  addTransaction: (tx: BankTransaction) => Promise<void>;
  updateTransaction: (tx: BankTransaction) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  
  // Customers
  addCustomer: (customer: Customer) => Promise<void>;
  updateCustomer: (customer: Customer) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;
  
  // Bulk Actions
  bulkDeleteProducts: (ids: string[]) => Promise<void>;
  migrateExistingProductsToService: () => Promise<void>;
  
  // Data Import
  importBulkData: (data: { products?: any[], sales?: any[], transactions?: any[], customers?: any[] }) => Promise<void>;
  
  // Data Reset
  resetData: () => Promise<void>;
  
  // UI
  toggleDarkMode: () => void;
}

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      currentUser: null,
      products: [],
      sales: [],
      transactions: [],
      customers: [],
      isDarkMode: true,
      ownerPin: '2002',
      employeePin: '0000',
      isInitialized: false,
      syncError: null,
      syncStatus: {
        products: false,
        sales: false,
        transactions: false,
        customers: false,
      },

      setCurrentUser: (user) => set({ currentUser: user }),
      
      updatePin: async (role, newPin) => {
        const pinField = role === 'owner' ? 'owner_pin' : 'employee_pin';
        try {
          const { error } = await supabase
            .from('app_settings')
            .update({ [pinField]: newPin })
            .eq('id', 'auth_settings');
          
          if (error) throw error;
          
          set({ [role === 'owner' ? 'ownerPin' : 'employeePin']: newPin, syncError: null });
        } catch (err: any) {
          console.error('Update PIN Supabase Error:', err);
          set({ syncError: 'فشل مزامنة الرمز السري مع السحابة' });
          throw err;
        }
      },
      
      resetData: async () => {
        try {
          await Promise.all([
            supabase.from('sales').delete().neq('id', ''),
            supabase.from('transactions').delete().neq('id', ''),
            supabase.from('customers').delete().neq('id', '')
          ]);
          set({ sales: [], transactions: [], customers: [] });
        } catch (err) {
          console.error('Reset Data Error:', err);
          throw err;
        }
      },
      
      initializeStore: () => {
        console.log('🔄 Initializing Store and Supabase Listeners...');
        
        let initialized = false;
        
        const fetchInitialData = async () => {
          try {
            console.log('📡 Attempting to reach Supabase at:', supabaseUrl);
            
            if (!supabaseUrl || supabaseUrl.includes('placeholder')) {
              throw new Error('رابط Supabase غير مضبوط بشكل صحيح في الـ Secrets');
            }

            // Check session
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();
            if (sessionError) {
              console.error('Session Error Details:', sessionError);
              throw new Error(`خطأ في الجلسة: ${sessionError.message}`);
            }

            if (!session) {
              console.log('🔑 Signing in anonymously...');
              const { error: authError } = await supabase.auth.signInAnonymously();
              if (authError) {
                console.error('Auth Error Details:', authError);
                throw new Error(`خطأ في المصادقة: ${authError.message}`);
              }
            }

            console.log('📦 Fetching database tables...');
            const fetchPromises = [
              supabase.from('products').select('*'),
              supabase.from('sales').select('*'),
              supabase.from('transactions').select('*'),
              supabase.from('customers').select('*'),
              supabase.from('app_settings').select('*').eq('id', 'auth_settings').maybeSingle()
            ];

            const results = await Promise.all(fetchPromises);
            
            // Check for individual table errors
            results.forEach((res, index) => {
              if (res.error) {
                console.error(`Error fetching table index ${index}:`, res.error);
              }
            });

            const [pRes, sRes, tRes, cRes, stRes] = results;

            if (pRes.error || sRes.error || tRes.error || cRes.error) {
              console.warn('Some tables failed to sync, using partial cloud data');
            }

            if (stRes.data) {
              set({ 
                ownerPin: stRes.data.owner_pin || '2002', 
                employeePin: stRes.data.employee_pin || '0000' 
              });
            }

            set({
              products: (pRes.data || []).map(snakeToCamel),
              sales: (sRes.data || []).map(snakeToCamel),
              transactions: (tRes.data || []).map(snakeToCamel),
              customers: (cRes.data || []).map(snakeToCamel),
              syncStatus: { products: true, sales: true, transactions: true, customers: true },
              syncError: null,
              isInitialized: true
            });
            initialized = true;
            console.log('✅ Supabase connected and synced successfully');
          } catch (err: any) {
            console.error('🔴 Connection Debug:', err);
            const msg = err.message === 'Failed to fetch' 
              ? 'فشل الاتصال: يرجى التأكد من رابط السرفر أو تفعيل Anonymous Auth في Supabase' 
              : err.message;
            set({ 
              syncError: msg, 
              isInitialized: true,
              syncStatus: { products: true, sales: true, transactions: true, customers: true } 
            });
            initialized = true;
          }
        };

        fetchInitialData();

        // Safety timeout to ensure isInitialized is eventually true
        setTimeout(() => {
          if (!initialized) {
            console.warn('⚠️ Initialization timed out, proceeding with local data');
            set({ 
              isInitialized: true,
              syncStatus: { products: true, sales: true, transactions: true, customers: true }
            });
          }
        }, 8000); // Increased to 8s for slower mobile connections

        // Realtime Subscriptions
        const productsChannel = supabase.channel('products-all')
          .on('postgres_changes', { event: '*', table: 'products', schema: 'public' }, () => {
            supabase.from('products').select('*').then(({ data }) => {
              if (data) set({ products: data.map(snakeToCamel) });
            });
          }).subscribe();

        const salesChannel = supabase.channel('sales-all')
          .on('postgres_changes', { event: '*', table: 'sales', schema: 'public' }, () => {
            supabase.from('sales').select('*').then(({ data }) => {
              if (data) set({ sales: data.map(snakeToCamel) });
            });
          }).subscribe();

        const txChannel = supabase.channel('transactions-all')
          .on('postgres_changes', { event: '*', table: 'transactions', schema: 'public' }, () => {
            supabase.from('transactions').select('*').then(({ data }) => {
              if (data) set({ transactions: data.map(snakeToCamel) });
            });
          }).subscribe();

        const customersChannel = supabase.channel('customers-all')
          .on('postgres_changes', { event: '*', table: 'customers', schema: 'public' }, () => {
            supabase.from('customers').select('*').then(({ data }) => {
              if (data) set({ customers: data.map(snakeToCamel) });
            });
          }).subscribe();

        return () => {
          productsChannel.unsubscribe();
          salesChannel.unsubscribe();
          txChannel.unsubscribe();
          customersChannel.unsubscribe();
        };
      },
      
      addProduct: async (product) => {
        const { error } = await supabase.from('products').insert(camelToSnake(product));
        if (error) throw error;
      },
      
      updateProduct: async (product) => {
        const { error } = await supabase.from('products').update(camelToSnake(product)).eq('id', product.id);
        if (error) throw error;
      },
      
      deleteProduct: async (id) => {
        // Optimistic update
        const previousProducts = get().products;
        set({ products: previousProducts.filter(p => p.id !== id) });
        
        try {
          const { error } = await supabase.from('products').delete().eq('id', id);
          if (error) throw error;
        } catch (err) {
          set({ products: previousProducts });
          throw err;
        }
      },
      
      addSale: async (sale) => {
        const { error } = await supabase.from('sales').insert(camelToSnake(sale));
        if (error) throw error;
      },
      
      updateSale: async (sale) => {
        const { error } = await supabase.from('sales').update(camelToSnake(sale)).eq('id', sale.id);
        if (error) throw error;
      },
      
      deleteSale: async (id) => {
        const { error } = await supabase.from('sales').delete().eq('id', id);
        if (error) throw error;
      },
      
      addTransaction: async (tx) => {
        const { error } = await supabase.from('transactions').insert(camelToSnake(tx));
        if (error) throw error;
      },
      
      updateTransaction: async (tx) => {
        const { error } = await supabase.from('transactions').update(camelToSnake(tx)).eq('id', tx.id);
        if (error) throw error;
      },
      
      deleteTransaction: async (id) => {
        const { error } = await supabase.from('transactions').delete().eq('id', id);
        if (error) throw error;
      },
      
      addCustomer: async (customer) => {
        const { error } = await supabase.from('customers').insert(camelToSnake(customer));
        if (error) throw error;
      },
      
      updateCustomer: async (customer) => {
        const { error } = await supabase.from('customers').update(camelToSnake(customer)).eq('id', customer.id);
        if (error) throw error;
      },
      
      deleteCustomer: async (id) => {
        const { error } = await supabase.from('customers').delete().eq('id', id);
        if (error) throw error;
      },

      bulkDeleteProducts: async (ids) => {
        // Optimistic update
        const previousProducts = get().products;
        set({ products: previousProducts.filter(p => !ids.includes(p.id)) });
        
        try {
          const { error } = await supabase.from('products').delete().in('id', ids);
          if (error) throw error;
        } catch (err) {
          set({ products: previousProducts });
          throw err;
        }
      },

      migrateExistingProductsToService: async () => {
        try {
          // SQL representation for user: UPDATE products SET type = 'service';
          const { error } = await supabase
            .from('products')
            .update({ type: 'service' })
            .filter('id', 'neq', '00000000-0000-0000-0000-000000000000'); // Dummy filter to allow update all if needed by policy
          
          if (error) {
             // Fallback attempt if filter was rejected by certain RLS
             const { error: error2 } = await supabase.from('products').update({ type: 'service' }).not('id', 'eq', 'null');
             if (error2) throw error2;
          }
          
          // Refresh local state
          const { data: products } = await supabase.from('products').select('*');
          if (products) {
            set({ products: products.map(snakeToCamel) });
          }
        } catch (err) {
          console.error('Migration failed:', err);
          throw err;
        }
      },

      importBulkData: async (data) => {
        console.log('🚀 Starting bulk import...', data);
        const results = [];

        try {
          if (data.products && data.products.length > 0) {
            console.log(`📦 Importing ${data.products.length} products...`);
            const pData = data.products.map(camelToSnake);
            const { error } = await supabase.from('products').upsert(pData);
            if (error) throw error;
          }

          if (data.customers && data.customers.length > 0) {
            console.log(`👥 Importing ${data.customers.length} customers...`);
            const cData = data.customers.map(camelToSnake);
            const { error } = await supabase.from('customers').upsert(cData);
            if (error) throw error;
          }

          if (data.sales && data.sales.length > 0) {
            console.log(`💰 Importing ${data.sales.length} sales...`);
            const sData = data.sales.map(camelToSnake);
            const { error } = await supabase.from('sales').upsert(sData);
            if (error) throw error;
          }

          if (data.transactions && data.transactions.length > 0) {
            console.log(`💳 Importing ${data.transactions.length} transactions...`);
            const tData = data.transactions.map(camelToSnake);
            const { error } = await supabase.from('transactions').upsert(tData);
            if (error) throw error;
          }

          console.log('✅ Bulk import completed successfully');
        } catch (err) {
          console.error('🔴 Bulk Import Error:', err);
          throw err;
        }
      },
      
      toggleDarkMode: () => set((state) => ({ isDarkMode: !state.isDarkMode })),
    }),
    {
      name: 'rady-store-supabase-v1',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ 
        currentUser: state.currentUser, 
        isDarkMode: state.isDarkMode 
      }),
    }
  )
);
