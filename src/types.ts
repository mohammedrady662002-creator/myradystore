export type Category = 'accessories' | 'hardware' | 'maintenance' | 'software' | 'finance';

export interface Product {
  id: string;
  name: string;
  code: string;
  wholesalePrice: number;
  sellingPrice: number;
  quantity: number;
  notes: string;
  imageUrl: string;
  category: Category;
  createdAt?: string;
}

export interface Sale {
  id: string;
  productId: string;
  productName: string;
  category: Category;
  quantity: number;
  unitPrice: number;
  totalBasePrice: number;
  wholesaleTotalCost: number;
  discount: number;
  finalPrice: number;
  profit: number;
  method: string;
  date: string;
}

export interface Transaction {
  id: string;
  type: 'sale' | 'receive' | 'send';
  relatedSaleId?: string;
  category: Category;
  method: string;
  amount: number;
  commission: number;
  notes: string;
  date: string;
}

export interface Balances {
  cash: number;
  digital: number;
  commission: number;
}

export interface User {
  role: 'owner' | 'employee';
  name: string;
}
