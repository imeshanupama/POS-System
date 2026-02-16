import React, { useState } from 'react';
import ProductForm from '../components/ProductForm';
import ProductList from '../components/ProductList';


const ProductsPage: React.FC = () => {
    const [refreshKey, setRefreshKey] = useState(0);

    const handleProductAdded = () => {
        // Force list refresh by updating key
        setRefreshKey((prev) => prev + 1);
    };

    return (
        <div className="container mx-auto p-4 flex flex-col gap-6">
            <h1 className="text-3xl font-bold">Inventory Management</h1>
            <div className="flex flex-col md:flex-row gap-6">
                <div className="w-full md:w-1/3">
                    <ProductForm onProductAdded={handleProductAdded} />
                </div>
                <div className="w-full md:w-2/3">
                    <ProductList key={refreshKey} />
                </div>
            </div>
        </div>
    );
};

export default ProductsPage;
