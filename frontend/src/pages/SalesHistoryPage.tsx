import React, { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { type Sale, getSales, requestVoid, approveVoid, getCurrentUser } from '@/services/api';
import { Button } from '@/components/ui/button';
import { useReactToPrint } from 'react-to-print';
import Receipt from '@/components/Receipt';

// ... existing code ...

const SalesHistoryPage: React.FC = () => {
    const [sales, setSales] = useState<Sale[]>([]);
    const [loading, setLoading] = useState(true);
    const user = getCurrentUser();

    // Print state
    const [printData, setPrintData] = useState<{ sale: Sale; items: any[] } | null>(null);
    const receiptRef = useRef<HTMLDivElement>(null);

    const handlePrintReceipt = useReactToPrint({
        contentRef: receiptRef,
        onAfterPrint: () => setPrintData(null),
    });

    useEffect(() => {
        if (printData && receiptRef.current) {
            // Slight delay to ensure DOM is updated with printData before printing
            setTimeout(() => {
                handlePrintReceipt();
            }, 100);
        }
    }, [printData, handlePrintReceipt]);

    useEffect(() => {
        fetchSales();
    }, []);

    const fetchSales = async () => {
        try {
            setLoading(true);
            const data = await getSales();
            setSales(data);
        } catch (error) {
            console.error('Failed to fetch sales history', error);
        } finally {
            setLoading(false);
        }
    };

    const handleVoidRequest = async (saleId: number) => {
        if (!user || user.role !== 'cashier') return;
        if (!confirm('Are you sure you want to request a void for this sale?')) return;
        try {
            await requestVoid(saleId, user.id);
            alert('Void request sent to admin.');
            fetchSales();
        } catch (error) {
            alert('Failed to request void.');
        }
    };

    const handleApproveVoid = async (saleId: number) => {
        if (!user || user.role !== 'admin') return;
        if (!confirm('Approve void request? This will restore stock.')) return;
        try {
            await approveVoid(saleId);
            alert('Sale voided successfully.');
            fetchSales();
        } catch (error) {
            alert('Failed to approve void.');
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-3xl font-bold mb-6">Sales History</h1>
            <Card>
                <CardHeader>
                    <CardTitle>Recent Transactions</CardTitle>
                </CardHeader>
                <CardContent>
                    {sales.length === 0 ? (
                        <p>No sales found.</p>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>ID</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Payment</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Items</TableHead>
                                    <TableHead className="text-right">Total Amount</TableHead>
                                    <TableHead className="text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sales.map((sale) => (
                                    <TableRow key={sale.id}>
                                        <TableCell>{sale.id}</TableCell>
                                        <TableCell>
                                            {sale.created_at ? new Date(sale.created_at).toLocaleString() : '-'}
                                        </TableCell>
                                        <TableCell className="capitalize">{sale.payment_method}</TableCell>
                                        <TableCell className="capitalize">
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${sale.status === 'voided' ? 'bg-red-100 text-red-800' :
                                                sale.status === 'pending_void' ? 'bg-yellow-100 text-yellow-800' :
                                                    'bg-green-100 text-green-800'
                                                }`}>
                                                {sale.status || 'Completed'}
                                            </span>
                                        </TableCell>
                                        <TableCell>{sale.items.length}</TableCell>
                                        <TableCell className="text-right font-medium">
                                            LKR {sale.total_amount.toFixed(2)}
                                        </TableCell>
                                        <TableCell className="text-right space-x-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => {
                                                    const receiptItems = sale.items.map(item => ({
                                                        name: item.name || `Item ${item.product_id}`,
                                                        quantity: item.quantity,
                                                        price: item.price_at_sale
                                                    }));
                                                    setPrintData({ sale, items: receiptItems });
                                                }}
                                            >
                                                Receipt
                                            </Button>

                                            {/* Cashier Request Void */}
                                            {user?.role === 'cashier' && sale.status !== 'voided' && sale.status !== 'pending_void' && (
                                                <Button
                                                    variant="destructive"
                                                    size="sm"
                                                    onClick={() => sale.id && handleVoidRequest(sale.id)}
                                                >
                                                    Request Void
                                                </Button>
                                            )}

                                            {/* Admin Approve Void */}
                                            {user?.role === 'admin' && sale.status === 'pending_void' && (
                                                <Button
                                                    variant="default" // or a create a success variant
                                                    className="bg-green-600 hover:bg-green-700"
                                                    size="sm"
                                                    onClick={() => sale.id && handleApproveVoid(sale.id)}
                                                >
                                                    Approve Void
                                                </Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* Hidden Receipt Component for Printing */}
            <div className="hidden">
                {printData && (
                    <Receipt
                        ref={receiptRef}
                        sale={printData.sale}
                        items={printData.items}
                    />
                )}
            </div>
        </div>
    );
};

export default SalesHistoryPage;
