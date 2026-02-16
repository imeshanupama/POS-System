import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { type Product, addProduct } from '../services/api';

interface ProductFormProps {
    onProductAdded?: () => void;
}

const ProductForm: React.FC<ProductFormProps> = ({ onProductAdded }) => {
    const [formData, setFormData] = useState<Omit<Product, 'id'>>({
        name: '',
        barcode: '',
        price: 0,
        stock_quantity: 0,
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            await addProduct(formData);
            setFormData({ name: '', barcode: '', price: 0, stock_quantity: 0 }); // Reset form
            if (onProductAdded) {
                onProductAdded();
            }
        } catch (err: any) {
            setError(err.message || 'Failed to add product');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: name === 'price' || name === 'stock_quantity' ? Number(value) : value,
        }));
    };

    return (
        <Card className="w-full max-w-md mx-auto">
            <CardHeader>
                <CardTitle>Add New Product</CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Product Name</Label>
                        <Input
                            id="name"
                            name="name"
                            placeholder="e.g. Rice 1kg"
                            value={formData.name}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="barcode">Barcode</Label>
                        <Input
                            id="barcode"
                            name="barcode"
                            placeholder="Scan or enter barcode"
                            value={formData.barcode}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="price">Price (LKR)</Label>
                            <Input
                                id="price"
                                name="price"
                                type="number"
                                min="0"
                                step="0.01"
                                placeholder="0.00"
                                value={formData.price}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="stock_quantity">Stock</Label>
                            <Input
                                id="stock_quantity"
                                name="stock_quantity"
                                type="number"
                                min="0"
                                placeholder="0"
                                value={formData.stock_quantity}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    {error && <p className="text-red-500 text-sm">{error}</p>}

                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? 'Adding...' : 'Add Product'}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
};

export default ProductForm;
