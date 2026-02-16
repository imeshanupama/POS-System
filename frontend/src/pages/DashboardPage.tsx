import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { type Sale, getSales } from '../services/api';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';

const DashboardPage: React.FC = () => {
    const [sales, setSales] = useState<Sale[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const data = await getSales();
            setSales(data);
        } catch (error) {
            console.error('Failed to fetch dashboard data', error);
        } finally {
            setLoading(false);
        }
    };

    const totalRevenue = sales.reduce((sum, sale) => sum + sale.total_amount, 0);
    const totalTransactions = sales.length;
    // Calculate today's sales
    const today = new Date().toISOString().split('T')[0];
    const todaySales = sales.filter(s => s.created_at && s.created_at.startsWith(today));
    const todayRevenue = todaySales.reduce((sum, sale) => sum + sale.total_amount, 0);

    if (loading) return <div className="p-8">Loading dashboard...</div>;

    return (
        <div className="container mx-auto p-4 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Dashboard</h1>
                <div className="space-x-2">
                    <Link to="/sales">
                        <Button>New Sale</Button>
                    </Link>
                    <Link to="/products">
                        <Button variant="outline">Manage Products</Button>
                    </Link>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">LKR {totalRevenue.toFixed(2)}</div>
                        <p className="text-xs text-muted-foreground">Lifetime</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Sales Count</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalTransactions}</div>
                        <p className="text-xs text-muted-foreground">Total Transactions</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Today's Revenue</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">LKR {todayRevenue.toFixed(2)}</div>
                        <p className="text-xs text-muted-foreground">{todaySales.length} sales today</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Recent Sales</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {sales.slice(0, 5).map(sale => (
                                <div key={sale.id} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium leading-none">
                                            Order #{sale.id}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            {sale.created_at ? new Date(sale.created_at).toLocaleTimeString() : ''} via {sale.payment_method}
                                        </p>
                                    </div>
                                    <div className="font-medium">
                                        +LKR {sale.total_amount.toFixed(2)}
                                    </div>
                                </div>
                            ))}
                            {sales.length === 0 && <p className="text-muted-foreground text-sm">No recent sales.</p>}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default DashboardPage;
