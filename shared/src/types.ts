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
    stock_quantity: number;
    category_id?: number;
    created_at?: string;
}

export interface Sale {
    id: number;
    total_amount: number;
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
    product_name?: string; // For convenience in UI
}
