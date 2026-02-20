import React, { useState, useEffect } from 'react';

import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { type Product, addProduct, updateProduct } from '../services/api';

interface ProductFormProps {
    onProductAdded?: () => void;
    productToEdit?: Product | null;
}

const ProductForm: React.FC<ProductFormProps> = ({ onProductAdded, productToEdit }) => {
    const [formData, setFormData] = useState<Omit<Product, 'id'>>({
        name: '',
        barcode: '',
        price: 0,
        cost_price: 0,
        stock_quantity: 0,
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (productToEdit) {
            setFormData({
                name: productToEdit.name,
                barcode: productToEdit.barcode || '',
                price: productToEdit.price,
                cost_price: productToEdit.cost_price || 0,
                stock_quantity: productToEdit.stock_quantity,
            });
        } else {
            setFormData({ name: '', barcode: '', price: 0, cost_price: 0, stock_quantity: 0 });
        }
    }, [productToEdit]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (productToEdit && productToEdit.id) {
                await updateProduct(productToEdit.id, formData);
            } else {
                await addProduct(formData);
                setFormData({ name: '', barcode: '', price: 0, cost_price: 0, stock_quantity: 0 }); // Reset form
            }
            if (onProductAdded) {
                onProductAdded();
            }
        } catch (err: any) {
            setError(err.message || 'Failed to save product');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: name === 'price' || name === 'cost_price' || name === 'stock_quantity' ? Number(value) : value,
        }));
    };

    return (
        <div className="w-full">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="name" className="text-slate-700 font-semibold">Product Name</Label>
                    <Input
                        id="name"
                        name="name"
                        placeholder="e.g. Rice 1kg"
                        value={formData.name}
                        onChange={handleChange}
                        className="h-10 border-slate-200 focus-visible:ring-indigo-500 rounded-lg"
                        required
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="barcode" className="text-slate-700 font-semibold">Barcode</Label>
                    <Input
                        id="barcode"
                        name="barcode"
                        placeholder="Scan or enter barcode"
                        value={formData.barcode}
                        onChange={handleChange}
                        className="h-10 border-slate-200 focus-visible:ring-indigo-500 rounded-lg font-mono"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="price" className="text-slate-700 font-semibold">Selling Price (LKR)</Label>
                        <Input
                            id="price"
                            name="price"
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="0.00"
                            value={formData.price}
                            onChange={handleChange}
                            className="h-10 border-slate-200 focus-visible:ring-indigo-500 rounded-lg"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="cost_price" className="text-slate-700 font-semibold">Cost Price (LKR)</Label>
                        <Input
                            id="cost_price"
                            name="cost_price"
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="0.00"
                            value={formData.cost_price}
                            onChange={handleChange}
                            className="h-10 border-slate-200 focus-visible:ring-indigo-500 rounded-lg"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="stock_quantity" className="text-slate-700 font-semibold">Stock Quantity</Label>
                        <Input
                            id="stock_quantity"
                            name="stock_quantity"
                            type="number"
                            min="0"
                            placeholder="0"
                            value={formData.stock_quantity}
                            onChange={handleChange}
                            className="h-10 border-slate-200 focus-visible:ring-indigo-500 rounded-lg"
                        />
                    </div>
                </div>

                {error && <p className="text-red-500 text-sm font-medium mt-2 p-2 bg-red-50 rounded-lg">{error}</p>}

                <Button type="submit" className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl mt-6 shadow-md transition-all active:scale-[0.98]" disabled={loading}>
                    {loading ? 'Saving Product...' : (productToEdit ? 'Save Changes' : 'Add Product')}
                </Button>
            </form>
        </div>
    );
};

export default ProductForm;
