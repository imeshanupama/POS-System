import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { type Product, getProducts, processSale } from '../services/api';
import { Input } from '../components/ui/input';
import { printReceipt } from '../utils/printer';

interface CartItem {
    product: Product;
    quantity: number;
}

const SalesPage: React.FC = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card'>('cash'); // Default payment method

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const data = await getProducts();
            setProducts(data);
        } catch (error) {
            console.error('Error fetching products:', error);
        } finally {
            setLoading(false);
        }
    };

    const addToCart = (product: Product) => {
        setCart((prevCart) => {
            const existingItem = prevCart.find((item) => item.product.id === product.id);
            if (existingItem) {
                return prevCart.map((item) =>
                    item.product.id === product.id
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            }
            return [...prevCart, { product, quantity: 1 }];
        });
    };

    const removeFromCart = (productId: number) => {
        setCart((prevCart) => prevCart.filter((item) => item.product.id !== productId));
    };

    const updateQuantity = (productId: number, delta: number) => {
        setCart((prevCart) =>
            prevCart.map((item) => {
                if (item.product.id === productId) {
                    const newQuantity = Math.max(1, item.quantity + delta);
                    return { ...item, quantity: newQuantity };
                }
                return item;
            })
        );
    };

    const totalAmount = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

    const handleCheckout = async () => {
        if (cart.length === 0) return;

        const saleData = {
            total_amount: totalAmount,
            payment_method: paymentMethod, // Assuming simple cash for now
            items: cart.map((item) => ({
                product_id: item.product.id!,
                quantity: item.quantity,
                price_at_sale: item.product.price,
            })),
        };

        try {
            const result = await processSale(saleData);
            alert('Sale processed successfully!');

            // Prepare data for receipt printing
            const receiptItems = cart.map(item => ({
                name: item.product.name,
                quantity: item.quantity,
                price: item.product.price
            }));

            // Print Receipt
            printReceipt({ ...saleData, id: result.id }, receiptItems);

            setCart([]);
            fetchProducts(); // Update stock
        } catch (error) {
            alert('Failed to process sale');
            console.error(error);
        }
    };

    const filteredProducts = products.filter((p) =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.barcode && p.barcode.includes(search))
    );

    return (
        <div className="container mx-auto p-4 flex gap-4 h-[calc(100vh-100px)]">
            {/* Product Grid */}
            <div className="w-2/3 flex flex-col gap-4">
                <Input
                    placeholder="Search products..."
                    value={search}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
                    className="w-full"
                />
                <div className="grid grid-cols-3 gap-4 overflow-y-auto">
                    {loading ? (
                        <p>Loading products...</p>
                    ) : (
                        filteredProducts.map((product) => (
                            <Card
                                key={product.id}
                                className="cursor-pointer hover:bg-gray-50 transition-colors"
                                onClick={() => addToCart(product)}
                            >
                                <CardContent className="p-4 flex flex-col justify-between h-full">
                                    <div>
                                        <h3 className="font-bold text-lg">{product.name}</h3>
                                        <p className="text-gray-500">Stock: {product.stock_quantity}</p>
                                    </div>
                                    <div className="mt-2 text-right">
                                        <span className="text-xl font-bold text-blue-600">
                                            LKR {product.price.toFixed(2)}
                                        </span>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>
            </div>

            {/* Cart */}
            <Card className="w-1/3 flex flex-col h-full">
                <div className="p-4 border-b">
                    <h2 className="text-2xl font-bold">Current Sale</h2>
                </div>
                <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
                    {cart.length === 0 ? (
                        <p className="text-gray-500 text-center mt-10">Cart is empty</p>
                    ) : (
                        cart.map((item) => (
                            <div key={item.product.id} className="flex justify-between items-center border-b pb-2">
                                <div>
                                    <h4 className="font-medium">{item.product.name}</h4>
                                    <p className="text-sm text-gray-500">
                                        LKR {item.product.price.toFixed(2)} x {item.quantity}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        size="icon"
                                        variant="outline"
                                        className="h-6 w-6"
                                        onClick={() => updateQuantity(item.product.id!, -1)}
                                    >
                                        -
                                    </Button>
                                    <span>{item.quantity}</span>
                                    <Button
                                        size="icon"
                                        variant="outline"
                                        className="h-6 w-6"
                                        onClick={() => updateQuantity(item.product.id!, 1)}
                                    >
                                        +
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        size="icon"
                                        className="h-6 w-6 ml-2"
                                        onClick={() => removeFromCart(item.product.id!)}
                                    >
                                        x
                                    </Button>
                                </div>
                            </div>
                        ))
                    )}
                </CardContent>
                <div className="p-4 bg-gray-50 border-t">
                    <div className="flex justify-between mb-4">
                        <span className="text-lg">Total</span>
                        <span className="text-2xl font-bold">LKR {totalAmount.toFixed(2)}</span>
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-1">Payment Method</label>
                        <div className="flex gap-2">
                            <Button
                                variant={paymentMethod === 'cash' ? 'default' : 'outline'}
                                onClick={() => setPaymentMethod('cash')}
                                className="flex-1"
                            >
                                Cash
                            </Button>
                            <Button
                                variant={paymentMethod === 'card' ? 'default' : 'outline'}
                                onClick={() => setPaymentMethod('card')}
                                className="flex-1"
                            >
                                Card
                            </Button>
                        </div>
                    </div>

                    <Button className="w-full h-12 text-lg" disabled={cart.length === 0} onClick={handleCheckout}>
                        Checkout
                    </Button>
                </div>
            </Card>
        </div>
    );
};

export default SalesPage;
