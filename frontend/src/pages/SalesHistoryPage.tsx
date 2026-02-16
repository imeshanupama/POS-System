import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { type Sale, getSales } from '../services/api';
import { Button } from '../components/ui/button';
import { printReceipt } from '../utils/printer';

const SalesHistoryPage: React.FC = () => {
    const [sales, setSales] = useState<Sale[]>([]);
    const [loading, setLoading] = useState(true);

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
                                        <TableCell>{sale.items.length}</TableCell>
                                        <TableCell className="text-right font-medium">
                                            LKR {sale.total_amount.toFixed(2)}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => {
                                                    const receiptItems = sale.items.map(item => ({
                                                        name: item.name || `Item ${item.product_id}`,
                                                        quantity: item.quantity,
                                                        price: item.price_at_sale
                                                    }));
                                                    printReceipt(sale, receiptItems);
                                                }}
                                            >
                                                View Receipt
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default SalesHistoryPage;
