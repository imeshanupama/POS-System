export interface Category {
    id: number;
    name: string;
    created_at?: string;
}

export interface Product {
    id: number;
    name: string;
    barcode?: string;
    price: number;
    cost_price: number;
    stock_quantity: number;
    category_id?: number;
    created_at?: string;
}

export interface Sale {
    id: number;
    total_amount: number;
    discount?: number;
    payment_method: 'cash' | 'card';
    created_at?: string;
    items?: SaleItem[];
}

export interface SaleItem {
    id: number;
    sale_id: number;
    product_id: number;
    quantity: number;
    price_at_sale: number;
    cost_price_at_sale: number;
    discount?: number;
    product_name?: string; // For convenience in UI
}
export interface Customer {
    id: number;
    name: string;
    phone?: string;
    email?: string;
    credit_balance: number;
    created_at?: string;
}

export interface CreditPayment {
    id: number;
    customer_id: number;
    amount: number;
    payment_method: string;
    cashier_id?: number;
    created_at?: string;
}

export interface StockAdjustment {
    id: number;
    product_id: number;
    user_id: number;
    quantity_change: number;
    reason: string;
    notes?: string;
    created_at?: string;
}
