import React, { useEffect, useState, useRef } from 'react';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { type Product, getProducts, processSale, holdSale, getHeldSales, retrieveHeldSale, type Sale } from '../services/api';
import { Input } from '../components/ui/input';
import { printReceipt } from '../utils/printer';
import { Search, ShoppingCart, CreditCard, Banknote, Pause, Trash2, Plus, Minus, PackageOpen, MonitorPlay, Clock, Trash } from 'lucide-react';

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

interface CartItem {
    product: Product;
    quantity: number;
}

const SalesPage: React.FC = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card'>('cash');

    // State for receipt dialog
    const [isReceiptDialogOpen, setIsReceiptDialogOpen] = useState(false);
    const [lastSaleData, setLastSaleData] = useState<{ sale: any, items: any[] } | null>(null);

    // State for Held Sales
    const [heldSales, setHeldSales] = useState<Sale[]>([]);
    const [isRetrieveDialogOpen, setIsRetrieveDialogOpen] = useState(false);

    // Refs
    const searchInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        fetchProducts();
        fetchHeldSales();
    }, []);

    // Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'F1') {
                e.preventDefault();
                searchInputRef.current?.focus();
            }
            if (e.key === 'F2') {
                e.preventDefault();
                setPaymentMethod(prev => prev === 'cash' ? 'card' : 'cash');
            }
            if (e.key === 'F4') {
                e.preventDefault();
                document.getElementById('btn-hold')?.click();
            }
            if (e.key === 'F12' || e.key === 'Insert') {
                e.preventDefault();
                document.getElementById('btn-checkout')?.click();
            }

            // Auto focus search if a character key is pressed and no input is focused
            if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey && document.activeElement?.tagName !== 'INPUT') {
                searchInputRef.current?.focus();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [cart]);

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

    const fetchHeldSales = async () => {
        try {
            const data = await getHeldSales();
            setHeldSales(data);
        } catch (error) {
            console.error('Failed to fetch held sales');
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
        setSearch(''); // Clear search after adding for fast barcode scanning
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

    const clearCart = () => {
        if (window.confirm('Are you sure you want to clear the entire cart?')) {
            setCart([]);
        }
    };

    const totalAmount = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

    const handleCheckout = async () => {
        if (cart.length === 0) return;

        const saleData = {
            total_amount: totalAmount,
            payment_method: paymentMethod,
            items: cart.map((item) => ({
                product_id: item.product.id!,
                quantity: item.quantity,
                price_at_sale: item.product.price,
            })),
        };

        try {
            const result = await processSale(saleData);

            const receiptItems = cart.map(item => ({
                name: item.product.name,
                quantity: item.quantity,
                price: item.product.price
            }));

            setLastSaleData({ sale: { ...saleData, id: result.id }, items: receiptItems });
            setIsReceiptDialogOpen(true);

            setCart([]);
            setPaymentMethod('cash');
            fetchProducts(); // refresh stock
        } catch (error) {
            alert('Failed to process sale');
            console.error(error);
        }
    };

    const handleHoldSale = async () => {
        if (cart.length === 0) return;

        const saleData = {
            total_amount: totalAmount,
            items: cart.map((item) => ({
                product_id: item.product.id!,
                quantity: item.quantity,
                price_at_sale: item.product.price,
            })),
        };

        try {
            await holdSale(saleData);
            setCart([]);
            fetchProducts();
            fetchHeldSales();
        } catch (error) {
            alert('Failed to hold sale');
        }
    };

    const handleRetrieveSale = async (id: number) => {
        try {
            const response = await retrieveHeldSale(id);
            const restoredCart: CartItem[] = response.items.map((item: any) => ({
                product: {
                    id: item.product_id,
                    name: item.name,
                    barcode: item.barcode,
                    price: item.price,
                    stock_quantity: item.stock_quantity,
                    category_id: item.category_id
                },
                quantity: item.quantity
            }));

            setCart(restoredCart);
            setIsRetrieveDialogOpen(false);
            fetchProducts();
            fetchHeldSales();
        } catch (error) {
            alert('Failed to retrieve sale');
        }
    };

    const handlePrintReceipt = () => {
        if (lastSaleData) {
            printReceipt(lastSaleData.sale, lastSaleData.items);
            setIsReceiptDialogOpen(false);
        }
    };

    const filteredProducts = products.filter((p) =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.barcode && p.barcode.includes(search))
    );

    const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const exactMatch = products.find(p => p.barcode === search || p.name.toLowerCase() === search.toLowerCase());

            if (exactMatch) {
                addToCart(exactMatch);
            } else if (filteredProducts.length === 1) {
                addToCart(filteredProducts[0]);
            }
        }
    };

    return (
        <div className="flex h-[calc(100vh-80px)] bg-slate-50 p-4 gap-6 overflow-hidden">

            {/* Left Side - Product Grid & Search */}
            <div className="flex-1 flex flex-col gap-6 overflow-hidden">
                <div className="flex gap-4 items-center bg-white p-2 rounded-2xl shadow-sm border border-slate-100">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                        <Input
                            ref={searchInputRef}
                            placeholder="Scan barcode or search products... (F1)"
                            value={search}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
                            onKeyDown={handleSearchKeyDown}
                            className="pl-12 h-14 text-lg border-none shadow-none focus-visible:ring-0 bg-transparent"
                            autoFocus
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto pb-4 custom-scrollbar">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-4">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                            <p className="text-lg">Loading inventory...</p>
                        </div>
                    ) : filteredProducts.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-4">
                            <PackageOpen className="w-16 h-16 text-slate-300" />
                            <p className="text-lg">No products found for "{search}"</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                            {filteredProducts.map((product) => (
                                <Card
                                    key={product.id}
                                    className="group cursor-pointer hover:shadow-lg transition-all duration-300 border-transparent hover:border-indigo-100 bg-white overflow-hidden"
                                    onClick={() => addToCart(product)}
                                >
                                    <CardContent className="p-0 flex flex-col h-full">
                                        <div className="p-4 bg-slate-50/50 flex-1 flex flex-col items-center justify-center min-h-[120px] text-center gap-2 group-hover:bg-indigo-50/30 transition-colors">
                                            <span className="font-semibold text-slate-800 line-clamp-2 leading-tight">
                                                {product.name}
                                            </span>
                                            <span className="text-xs font-medium px-2 py-1 bg-white rounded-full text-slate-500 shadow-sm border border-slate-100">
                                                {product.stock_quantity > 0 ? `${product.stock_quantity} in stock` : 'Out of stock'}
                                            </span>
                                        </div>
                                        <div className="p-4 border-t border-slate-50 flex items-center justify-between text-indigo-600">
                                            <span className="font-bold text-lg leading-none">
                                                LKR {product.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </span>
                                            <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300">
                                                <Plus className="w-4 h-4" />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Right Side - Shopping Cart */}
            <div className="w-[420px] bg-white rounded-3xl shadow-xl flex flex-col border border-slate-100 overflow-hidden relative">

                {/* Cart Header */}
                <div className="p-6 border-b border-slate-100 bg-white z-10 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600">
                            <ShoppingCart className="w-6 h-6" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800">Current Order</h2>
                    </div>

                    <div className="flex gap-2">
                        {cart.length > 0 && (
                            <Button variant="ghost" size="icon" className="text-slate-400 hover:text-red-500 hover:bg-red-50" onClick={clearCart}>
                                <Trash2 className="w-5 h-5" />
                            </Button>
                        )}
                        <Dialog open={isRetrieveDialogOpen} onOpenChange={setIsRetrieveDialogOpen}>
                            <DialogTrigger asChild>
                                <Button variant="outline" size="icon" className="relative border-slate-200 text-slate-600">
                                    <Clock className="w-5 h-5" />
                                    {heldSales.length > 0 && (
                                        <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 text-xs font-bold flex items-center justify-center shadow-sm animate-pulse w-fit px-1 min-w-[20px]">
                                            {heldSales.length}
                                        </span>
                                    )}
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[425px]">
                                <DialogHeader>
                                    <DialogTitle className="flex items-center gap-2"><Pause className="w-5 h-5 text-amber-500" /> Held Sales</DialogTitle>
                                    <DialogDescription>Select an order to resume processing.</DialogDescription>
                                </DialogHeader>
                                <div className="space-y-3 max-h-[350px] overflow-y-auto py-4">
                                    {heldSales.map(sale => (
                                        <div key={sale.id} className="flex justify-between items-center p-4 border border-slate-100 rounded-xl hover:bg-slate-50 hover:border-indigo-200 cursor-pointer transition-all shadow-sm" onClick={() => sale.id && handleRetrieveSale(sale.id)}>
                                            <div>
                                                <p className="font-bold text-slate-800">Order #{sale.id}</p>
                                                <p className="text-sm text-slate-500 flex items-center gap-1 mt-1">
                                                    <Clock className="w-3 h-3" />
                                                    {new Date(sale.created_at || '').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-indigo-600 text-lg">LKR {sale.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                                                <p className="text-sm text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full inline-block mt-1">{sale.items.length} items</p>
                                            </div>
                                        </div>
                                    ))}
                                    {heldSales.length === 0 && (
                                        <div className="text-center py-8 text-slate-400 flex flex-col items-center gap-2">
                                            <MonitorPlay className="w-12 h-12 opacity-50" />
                                            <p>No held sales found.</p>
                                        </div>
                                    )}
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>

                {/* Cart Items */}
                <div className="flex-1 overflow-y-auto p-2 bg-slate-50/30 custom-scrollbar">
                    {cart.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-3 opacity-60">
                            <ShoppingCart className="w-16 h-16 mb-2" />
                            <p className="text-lg font-medium">Cart is waiting...</p>
                            <p className="text-sm text-center px-8">Scan an item or click a product to begin a new sale.</p>
                        </div>
                    ) : (
                        <div className="space-y-2 p-2">
                            {cart.map((item) => (
                                <div key={item.product.id} className="flex justify-between items-center bg-white p-3 md:p-4 rounded-2xl shadow-sm border border-slate-100 group animate-in slide-in-from-right-4 duration-300">
                                    <div className="flex-1">
                                        <h4 className="font-semibold text-slate-800 leading-tight">{item.product.name}</h4>
                                        <p className="text-sm text-indigo-600 font-medium mt-1">
                                            LKR {(item.product.price * item.quantity).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-3 bg-slate-50 p-1 rounded-xl">
                                        <button
                                            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white hover:shadow-sm hover:text-red-500 transition-all text-slate-500"
                                            onClick={() => item.quantity > 1 ? updateQuantity(item.product.id!, -1) : removeFromCart(item.product.id!)}
                                        >
                                            {item.quantity === 1 ? <Trash className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
                                        </button>
                                        <span className="w-4 text-center font-bold text-slate-700">{item.quantity}</span>
                                        <button
                                            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white hover:shadow-sm transition-all text-slate-500"
                                            onClick={() => updateQuantity(item.product.id!, 1)}
                                        >
                                            <Plus className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Checkout Footer */}
                <div className="p-6 bg-white border-t border-slate-100 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.05)] shrink-0">
                    <div className="flex justify-between items-end mb-6">
                        <span className="text-slate-500 font-medium">Total Amount</span>
                        <span className="text-4xl font-extrabold text-slate-800 tracking-tight">
                            LKR {totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                    </div>

                    <div className="mb-6 space-y-3">
                        <label className="text-sm font-semibold text-slate-600 flex justify-between">
                            Payment Method
                            <span className="text-xs text-slate-400 font-normal">Shortcut: F2</span>
                        </label>
                        <div className="flex gap-3">
                            <Button
                                variant={paymentMethod === 'cash' ? 'default' : 'outline'}
                                onClick={() => setPaymentMethod('cash')}
                                className={`flex-1 h-12 rounded-xl text-md font-semibold transition-all ${paymentMethod === 'cash' ? 'bg-slate-800 hover:bg-slate-700 text-white shadow-md' : 'border-slate-200 text-slate-600 bg-slate-50 hover:bg-slate-100'}`}
                            >
                                <Banknote className="w-5 h-5 mr-2" />
                                Cash
                            </Button>
                            <Button
                                variant={paymentMethod === 'card' ? 'default' : 'outline'}
                                onClick={() => setPaymentMethod('card')}
                                className={`flex-1 h-12 rounded-xl text-md font-semibold transition-all ${paymentMethod === 'card' ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md' : 'border-slate-200 text-slate-600 bg-slate-50 hover:bg-slate-100'}`}
                            >
                                <CreditCard className="w-5 h-5 mr-2" />
                                Card
                            </Button>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <Button
                            id="btn-hold"
                            variant="secondary"
                            className="flex-1 h-14 rounded-xl font-bold bg-amber-100 text-amber-700 hover:bg-amber-200 hover:text-amber-800 border-none transition-colors"
                            disabled={cart.length === 0}
                            onClick={handleHoldSale}
                        >
                            <Pause className="w-5 h-5 mr-2" />
                            Hold (F4)
                        </Button>
                        <Button
                            id="btn-checkout"
                            className="flex-[2] h-14 rounded-xl text-lg font-bold bg-green-500 hover:bg-green-600 text-white shadow-lg shadow-green-500/30 transition-all active:scale-[0.98]"
                            disabled={cart.length === 0}
                            onClick={handleCheckout}
                        >
                            Checkout (F12)
                        </Button>
                    </div>
                </div>
            </div>

            {/* Receipt Modal */}
            <Dialog open={isReceiptDialogOpen} onOpenChange={setIsReceiptDialogOpen}>
                <DialogContent className="sm:max-w-[400px] text-center p-8">
                    <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6 text-green-500">
                        <MonitorPlay className="w-8 h-8" />
                    </div>
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold text-center text-slate-800">Payment Successful</DialogTitle>
                        <DialogDescription className="text-center text-slate-500 mt-2 text-md">
                            Would you like to print a receipt for this transaction?
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex gap-3 mt-8">
                        <Button variant="outline" className="flex-1 h-12 rounded-xl font-semibold" onClick={() => setIsReceiptDialogOpen(false)}>Done</Button>
                        <Button className="flex-1 h-12 rounded-xl font-semibold bg-indigo-600 hover:bg-indigo-700" onClick={handlePrintReceipt}>Print Receipt</Button>
                    </div>
                </DialogContent>
            </Dialog>

        </div>
    );
};

export default SalesPage;

