import axios from 'axios';

// Change to your backend URL (local or deployed)
const API_URL = 'http://localhost:3000/api';

export const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export interface Product {
    id?: number;
    name: string;
    barcode: string;
    price: number;
    stock_quantity: number;
    category_id?: number;
}

export const getProducts = async () => {
    const response = await api.get<Product[]>('/products');
    return response.data;
};

export const addProduct = async (product: Omit<Product, 'id'>) => {
    const response = await api.post<Product>('/products', product);
    return response.data;
};

export const updateProduct = async (id: number, product: Partial<Product>) => {
    const response = await api.put<Product>(`/products/${id}`, product);

    return response.data;
};

export interface SaleItem {
    product_id: number;
    quantity: number;
    price_at_sale: number;
    name?: string;
}

export interface Sale {
    id?: number;
    total_amount: number;
    payment_method: 'cash' | 'card';
    items: SaleItem[];
    created_at?: string;
}

export const processSale = async (sale: Sale) => {
    const response = await api.post<{ id: number; message: string }>('/sales', sale);
    return response.data;
};

export const getSales = async () => {
    const response = await api.get<Sale[]>('/sales');
    return response.data;
};
