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

export const deleteProduct = async (id: number) => {
    const response = await api.delete<{ message: string }>(`/products/${id}`);
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
    status?: 'completed' | 'pending_void' | 'voided';
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

export interface User {
    id: number;
    username: string;
    role: 'admin' | 'cashier';
}

export const loginUser = async (user: { username: string; password: string }) => {
    const response = await api.post<User>('/auth/login', user);
    localStorage.setItem('user', JSON.stringify(response.data));
    return response.data;
};

export const logoutUser = () => {
    localStorage.removeItem('user');
};

export const getCurrentUser = (): User | null => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
        return JSON.parse(userStr);
    }
    return null;
};

export const requestVoid = async (saleId: number, cashierId: number) => {
    const response = await api.post(`/sales/${saleId}/void`, { cashierId });
    return response.data;
};

export const approveVoid = async (saleId: number) => {
    const response = await api.post(`/sales/${saleId}/void/approve`);
    return response.data;
};

export const registerUser = async (user: { username: string; password: string; role: 'admin' | 'cashier' }) => {
    const response = await api.post<User>('/auth/register', user);
    return response.data;
};
export interface Shift {
    id: number;
    cashier_id: number;
    start_time: string;
    end_time?: string;
    start_cash: number;
    end_cash?: number;
    total_sales?: number;
}

export const startShift = async (cashierId: number, startCash: number) => {
    const response = await api.post<{ id: number; message: string }>('/shifts/start', { cashierId, startCash });
    return response.data;
};

export const endShift = async (shiftId: number, endCash: number) => {
    const response = await api.post<{ message: string; summary: any }>('/shifts/end', { shiftId, endCash });
    return response.data;
};

export const getCurrentShift = async (cashierId: number) => {
    const response = await api.get<Shift | null>(`/shifts/current/${cashierId}`);
    return response.data;
};

// Analytics API
export const getDailySales = async () => {
    const response = await api.get<{ date: string; total: number }[]>('/sales/analytics/daily');
    return response.data;
};

export const getTopProducts = async () => {
    const response = await api.get<{ name: string; total_sold: number }[]>('/sales/analytics/top-products');
    return response.data;
};

export const getLowStockItems = async () => {
    const response = await api.get<Product[]>('/sales/analytics/low-stock');
    return response.data;
};

export const getCategorySales = async () => {
    const response = await api.get<{ name: string; value: number }[]>('/sales/analytics/category-sales');
    return response.data;
};

// Hold & Retrieve API
export const holdSale = async (sale: Partial<Sale>) => {
    const response = await api.post<{ id: number; message: string }>('/sales/hold', sale);
    return response.data;
};

export const getHeldSales = async () => {
    const response = await api.get<Sale[]>('/sales/held');
    return response.data;
};

export const retrieveHeldSale = async (id: number) => {
    // Returns list of items with product details
    const response = await api.delete<{ message: string; items: any[] }>(`/sales/held/${id}`);
    return response.data;
};
