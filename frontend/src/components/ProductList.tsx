import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Input } from './ui/input';
import { type Product, getProducts, deleteProduct } from '../services/api';
import { Search, Package, AlertCircle, Pencil, Trash2, ClipboardList } from 'lucide-react';
import { Button } from './ui/button';
import { StockAdjustmentDialog } from './StockAdjustmentDialog';

interface ProductListProps {
    onEdit?: (product: Product) => void;
}

const ProductList: React.FC<ProductListProps> = ({ onEdit }) => {
    const [products, setProducts] = useState<Product[]>([]);
    const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);

    const [isAdjustOpen, setIsAdjustOpen] = useState(false);
    const [productToAdjust, setProductToAdjust] = useState<Product | null>(null);

    useEffect(() => {
        fetchProducts();
    }, []);

    useEffect(() => {
        if (!searchQuery.trim()) {
            setFilteredProducts(products);
        } else {
            const lowerQuery = searchQuery.toLowerCase();
            const filtered = products.filter(p =>
                p.name.toLowerCase().includes(lowerQuery) ||
                (p.barcode && p.barcode.toLowerCase().includes(lowerQuery))
            );
            setFilteredProducts(filtered);
        }
    }, [searchQuery, products]);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const data = await getProducts();
            setProducts(data);
            setFilteredProducts(data);
        } catch (error) {
            console.error('Failed to fetch products', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number, name: string) => {
        if (window.confirm(`Are you sure you want to delete ${name}? This action cannot be undone.`)) {
            try {
                await deleteProduct(id);
                // Refresh list
                fetchProducts();
            } catch (error) {
                console.error('Failed to delete product', error);
                alert('Failed to delete product. It might be used in existing sales.');
            }
        }
    };

    const handleOpenAdjust = (product: Product) => {
        setProductToAdjust(product);
        setIsAdjustOpen(true);
    };

    const getStockBadge = (quantity: number) => {
        if (quantity === 0) {
            return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-200"><AlertCircle className="w-3 h-3 mr-1" />Out of Stock</span>;
        }
        if (quantity < 10) {
            return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">Low Stock ({quantity})</span>;
        }
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">In Stock ({quantity})</span>;
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-slate-400 gap-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                <p>Loading inventory...</p>
            </div>
        );
    }

    return (
        <Card className="w-full shadow-md border-none overflow-hidden animate-in fade-in duration-300">
            <CardHeader className="bg-white border-b border-slate-100 pb-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <CardTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            <Package className="w-5 h-5 text-indigo-500" />
                            Inventory Database
                        </CardTitle>
                        <CardDescription>Manage your store's products and stock levels.</CardDescription>
                    </div>

                    <div className="relative w-full md:w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                            placeholder="Search by name or barcode..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 h-10 bg-slate-50 border-slate-200 focus-visible:ring-indigo-500 rounded-lg"
                        />
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                {products.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 flex flex-col items-center gap-2">
                        <Package className="w-12 h-12 text-slate-300" />
                        <p>No products found in the database. Add your first product!</p>
                    </div>
                ) : filteredProducts.length === 0 ? (
                    <div className="p-8 text-center text-slate-500">
                        <p>No products match your search "<b>{searchQuery}</b>"</p>
                        <button onClick={() => setSearchQuery('')} className="mt-2 text-indigo-600 hover:underline text-sm font-medium">Clear search</button>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-slate-50">
                                <TableRow className="hover:bg-transparent">
                                    <TableHead className="w-[300px] font-semibold text-slate-600">Product Name</TableHead>
                                    <TableHead className="font-semibold text-slate-600">Barcode</TableHead>
                                    <TableHead className="font-semibold text-slate-600 text-right">Selling Price</TableHead>
                                    <TableHead className="font-semibold text-slate-600 text-right">Cost Price</TableHead>
                                    <TableHead className="font-semibold text-slate-600 text-center">Stock Status</TableHead>
                                    <TableHead className="font-semibold text-slate-600 text-center w-[120px]">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredProducts.map((product) => (
                                    <TableRow key={product.id} className="hover:bg-slate-50 transition-colors">
                                        <TableCell className="font-medium text-slate-800">{product.name}</TableCell>
                                        <TableCell className="text-slate-500 font-mono text-sm">{product.barcode || <span className="text-slate-300 italic">No barcode</span>}</TableCell>
                                        <TableCell className="text-right font-bold text-slate-700">LKR {product.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                                        <TableCell className="text-right font-medium text-slate-500">LKR {(product.cost_price || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                                        <TableCell className="text-center">{getStockBadge(product.stock_quantity)}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center justify-center gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                                                    onClick={() => onEdit && onEdit(product)}
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                                                    onClick={() => handleOpenAdjust(product)}
                                                    title="Adjust Stock"
                                                >
                                                    <ClipboardList className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                                                    onClick={() => product.id && handleDelete(product.id, product.name)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </CardContent>

            <StockAdjustmentDialog
                open={isAdjustOpen}
                onOpenChange={setIsAdjustOpen}
                product={productToAdjust}
                onAdjusted={fetchProducts}
            />
        </Card>
    );
};

export default ProductList;
