import React, { useState } from 'react';
import ProductForm from '../components/ProductForm';
import ProductList from '../components/ProductList';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog';
import { Button } from '../components/ui/button';
import { Plus } from 'lucide-react';
import { type Product } from '../services/api';

const ProductsPage: React.FC = () => {
    const [refreshKey, setRefreshKey] = useState(0);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [productToEdit, setProductToEdit] = useState<Product | null>(null);

    const handleProductAdded = () => {
        // Force list refresh by updating key
        setRefreshKey((prev) => prev + 1);
        // Close modal after successful add
        setIsAddModalOpen(false);
        setProductToEdit(null);
    };

    const handleEditProduct = (product: Product) => {
        setProductToEdit(product);
        setIsAddModalOpen(true);
    };

    const handleOpenCreateModal = () => {
        setProductToEdit(null);
        setIsAddModalOpen(true);
    };

    return (
        <div className="container mx-auto p-4 flex flex-col gap-6 max-w-7xl pb-16">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Products & Inventory</h1>
                    <p className="text-slate-500 mt-1">Add, update, and manage your store's entire catalog</p>
                </div>

                <Button className="bg-indigo-600 hover:bg-indigo-700 h-10 shadow-md" onClick={handleOpenCreateModal}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add New Product
                </Button>

                <Dialog open={isAddModalOpen} onOpenChange={(open) => {
                    setIsAddModalOpen(open);
                    if (!open) setProductToEdit(null);
                }}>
                    <DialogContent className="sm:max-w-[500px] border-none shadow-2xl rounded-2xl p-0 overflow-hidden">
                        <div className="bg-gradient-to-r from-indigo-500 to-violet-600 p-6">
                            <DialogHeader>
                                <DialogTitle className="text-2xl font-bold text-white">
                                    {productToEdit ? 'Update Product' : 'Create Product'}
                                </DialogTitle>
                                <DialogDescription className="text-indigo-100">
                                    {productToEdit ? 'Update the details for this inventory item.' : 'Fill in the details below to add a new item to your POS inventory.'}
                                </DialogDescription>
                            </DialogHeader>
                        </div>
                        <div className="p-6">
                            <ProductForm onProductAdded={handleProductAdded} productToEdit={productToEdit} />
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="w-full">
                <ProductList key={refreshKey} onEdit={handleEditProduct} />
            </div>
        </div>
    );
};

export default ProductsPage;
