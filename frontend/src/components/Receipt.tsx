import React from 'react';
import { type Sale } from '../services/api';

interface ReceiptProps {
    sale: Sale;
    shopName?: string;
    shopAddress?: string;
    shopPhone?: string;
}

export const Receipt = React.forwardRef<HTMLDivElement, ReceiptProps>(({ sale, shopName = "My Shop", shopAddress = "123 Main St, Colombo", shopPhone = "011-1234567" }, ref) => {
    return (
        <div ref={ref} className="p-4 w-[80mm] text-sm font-mono bg-white text-black">
            <div className="text-center mb-4">
                <h1 className="text-xl font-bold uppercase">{shopName}</h1>
                <p>{shopAddress}</p>
                <p>Tel: {shopPhone}</p>
            </div>

            <div className="border-b border-black mb-2 pb-2">
                <p>Date: {new Date().toLocaleString()}</p>
                <p>Receipt #: {sale.id}</p>
            </div>

            <table className="w-full text-left mb-4">
                <thead>
                    <tr className="border-b border-black">
                        <th className="py-1">Item</th>
                        <th className="py-1 text-right">Qty</th>
                        <th className="py-1 text-right">Price</th>
                    </tr>
                </thead>
                <tbody>
                    {sale.items.map((item, index) => (
                        <tr key={index}>
                            <td className="py-1">{item.product_id}</td> {/* In a real app, populate product name */}
                            <td className="py-1 text-right">{item.quantity}</td>
                            <td className="py-1 text-right">{(item.price_at_sale * item.quantity).toFixed(2)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div className="border-t border-black pt-2 mb-4">
                <div className="flex justify-between font-bold text-lg">
                    <span>TOTAL</span>
                    <span>{sale.total_amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs mt-1">
                    <span>Payment: {sale.payment_method.toUpperCase()}</span>
                </div>
            </div>

            <div className="text-center text-xs mt-6">
                <p>Thank you for your purchase!</p>
                <p>Please come again.</p>
            </div>
        </div>
    );
});

export default Receipt;
