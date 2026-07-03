export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'user' | 'admin';
}

export interface Product {
  id: string;
  name: string;
  atiko_name?: string;
  description: string;
  price: number;
  old_price?: number;
  category: 'shoes' | 'clothing';
  brand: string;
  images: string[];
  sizes: string[];
  size_stock?: Record<string, number>;
  color_stock?: Record<string, Record<string, number>>;
  colors: string[];
  stock: number;
  is_active: boolean;
}

export interface CartItem {
  product_id: string;
  name: string;
  price: number;
  size: string;
  color: string;
  quantity: number;
  max_qty?: number;
  subtotal: number;
}

export interface Cart {
  id: string;
  items: CartItem[];
  total: number;
}

export interface Order {
  id: string;
  items: CartItem[];
  total: number;
  status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled';
  shipping_address: {
    city: string;
    street: string;
    house: string;
    flat: string;
    comment: string;
  };
  payment_method: string;
  created_at: string;
}
