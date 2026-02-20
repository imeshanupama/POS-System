import React from 'react';
import { type Sale } from '../services/api';

interface ReceiptItem {
    name: string;
    quantity: number;
    price: number;
}

interface ReceiptProps {
    sale: Sale;
    items?: ReceiptItem[];
    shopName?: string;
    shopAddress?: string;
    shopPhone?: string;
}

export const Receipt = React.forwardRef<HTMLDivElement, ReceiptProps>(({ sale, items, shopName = "My Shop", shopAddress = "123 Main St, Colombo", shopPhone = "011-1234567" }, ref) => {
    return (
        <div ref={ref} className="p-4 w-[80mm] text-sm font-mono bg-white text-black print:m-0 print:p-0 print:shadow-none" style={{ margin: 0, padding: '15px' }}>
            <div className="text-center mb-4">
                <h1 className="text-xl font-bold uppercase">{shopName}</h1>
                <p>{shopAddress}</p>
                <p>Tel: {shopPhone}</p>
            </div>

            <div className="border-b border-black border-dashed mb-2 pb-2">
                <p>Date: {sale.created_at ? new Date(sale.created_at).toLocaleString() : new Date().toLocaleString()}</p>
                <p>Receipt #: {sale.id || 'N/A'}</p>
            </div>

            <table className="w-full text-left mb-4">
                <thead>
                    <tr className="border-b border-black">
                        <th className="py-1">Item</th>
                        <th className="py-1 text-right">Qty</th>
                        <th className="py-1 text-right">Amount</th>
                    </tr>
                </thead>
                <tbody>
                    {items ? items.map((item, index) => (
                        <tr key={index}>
                            <td className="py-1">{item.name}</td>
                            <td className="py-1 text-right">{item.quantity}</td>
                            <td className="py-1 text-right">{(item.price * item.quantity).toFixed(2)}</td>
                        </tr>
                    )) : sale.items.map((item, index) => (
                        <tr key={index}>
                            <td className="py-1">{item.product_id}</td>
                            <td className="py-1 text-right">{item.quantity}</td>
                            <td className="py-1 text-right">{(item.price_at_sale * item.quantity).toFixed(2)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div className="border-t border-black border-dashed pt-2 mb-4">
                {sale.discount && sale.discount > 0 ? (
                    <>
                        <div className="flex justify-between">
                            <span>Subtotal</span>
                            <span>LKR {(sale.total_amount + sale.discount).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-red-600">
                            <span>Discount</span>
                            <span>- LKR {sale.discount.toFixed(2)}</span>
                        </div>
                    </>
                ) : null}
                <div className="flex justify-between font-bold text-lg mt-1">
                    <span>TOTAL</span>
                    <span>LKR {sale.total_amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs mt-1">
                    <span>Payment: {sale.payment_method.toUpperCase()}</span>
                </div>
            </div>

            <div className="text-center text-xs mt-6 mb-4">
                <p>Thank you for your purchase!</p>
                <p>Please come again.</p>
            </div>
        </div>
    );
});

Receipt.displayName = 'Receipt';

export default Receipt;
