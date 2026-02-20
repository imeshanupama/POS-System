import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { type Sale, getSales, getDailySales, getTopProducts, getLowStockItems, getCategorySales, type Product } from '../services/api';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { ArrowUpRight, ArrowDownRight, TrendingUp, Package, DollarSign, Activity, AlertCircle } from 'lucide-react';

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#14b8a6', '#f59e0b', '#3b82f6'];

const DashboardPage: React.FC = () => {
    const [sales, setSales] = useState<Sale[]>([]);
    const [dailySales, setDailySales] = useState<{ date: string; total: number; profit: number }[]>([]);
    const [topProducts, setTopProducts] = useState<{ name: string; total_sold: number }[]>([]);
    const [lowStock, setLowStock] = useState<Product[]>([]);
    const [categorySales, setCategorySales] = useState<{ name: string; value: number }[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [salesData, dailyData, topData, stockData, catData] = await Promise.all([
                getSales(),
                getDailySales(),
                getTopProducts(),
                getLowStockItems(),
                getCategorySales()
            ]);

            setSales(salesData);
            setDailySales(dailyData);
            setTopProducts(topData);
            setLowStock(stockData);
            setCategorySales(catData);
        } catch (error) {
            console.error('Failed to fetch dashboard data', error);
        } finally {
            setLoading(false);
        }
    };

    const totalRevenue = sales.reduce((sum, sale) => sum + sale.total_amount, 0);
    const totalTransactions = sales.length;

    // Calculate growth
    const today = new Date().toISOString().split('T')[0];
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterday = yesterdayDate.toISOString().split('T')[0];

    const todaySalesData = dailySales.find(d => d.date === today)?.total || 0;
    const yesterdaySalesData = dailySales.find(d => d.date === yesterday)?.total || 0;

    const todayProfitData = dailySales.find(d => d.date === today)?.profit || 0;

    const growth = yesterdaySalesData === 0
        ? (todaySalesData > 0 ? 100 : 0)
        : ((todaySalesData - yesterdaySalesData) / yesterdaySalesData) * 100;

    const isPositive = growth >= 0;

    // Format daily sales for chart
    const chartData = dailySales.map(d => ({
        ...d,
        displayDate: new Date(d.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
    }));

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[calc(100vh-100px)] text-slate-400 gap-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                <p className="text-lg font-medium">Loading your dashboard...</p>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4 space-y-6 max-w-7xl animate-in fade-in duration-500 pb-12">

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Dashboard Overview</h1>
                    <p className="text-slate-500 mt-1">Monitor your store's performance and inventory</p>
                </div>
                <div className="flex space-x-3">
                    <Link to="/products">
                        <Button variant="outline" className="h-10 border-slate-200 text-slate-600">Manage Products</Button>
                    </Link>
                    <Link to="/sales">
                        <Button className="h-10 bg-indigo-600 hover:bg-indigo-700 shadow-md transition-all">Start New Sale</Button>
                    </Link>
                </div>
            </div>

            {/* Key Metrics Cards */}
            <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
                <Card className="border-none shadow-md bg-white">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-semibold text-slate-500">Today's Revenue</CardTitle>
                        <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600">
                            <DollarSign className="w-4 h-4" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-slate-800">LKR {todaySalesData.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                        <div className="flex items-center mt-1 space-x-1">
                            {isPositive ? (
                                <ArrowUpRight className="w-4 h-4 text-emerald-500" />
                            ) : (
                                <ArrowDownRight className="w-4 h-4 text-red-500" />
                            )}
                            <p className={`text-sm font-medium ${isPositive ? 'text-emerald-500' : 'text-red-500'}`}>
                                {Math.abs(growth).toFixed(1)}%
                            </p>
                            <p className="text-sm text-slate-400 ml-1">vs yesterday</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-md bg-white">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-semibold text-slate-500">Today's Profit</CardTitle>
                        <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center text-green-600">
                            <TrendingUp className="w-4 h-4" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-slate-800">LKR {todayProfitData.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                        <p className="text-sm text-slate-400 mt-1">Based on cost price</p>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-md bg-white">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-semibold text-slate-500">Total Lifetime Revenue</CardTitle>
                        <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600">
                            <TrendingUp className="w-4 h-4" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-slate-800">LKR {totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                        <p className="text-sm text-slate-400 mt-1">Across all completed sales</p>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-md bg-white">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-semibold text-slate-500">Total Transactions</CardTitle>
                        <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600">
                            <Activity className="w-4 h-4" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-slate-800">{totalTransactions}</div>
                        <p className="text-sm text-slate-400 mt-1">Lifetime orders processed</p>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-md bg-white">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-semibold text-slate-500">Low Stock Alerts</CardTitle>
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${lowStock.length > 0 ? 'bg-red-50 text-red-600' : 'bg-slate-50 text-slate-400'}`}>
                            {lowStock.length > 0 ? <AlertCircle className="w-4 h-4" /> : <Package className="w-4 h-4" />}
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className={`text-3xl font-bold ${lowStock.length > 0 ? 'text-red-600' : 'text-slate-800'}`}>{lowStock.length}</div>
                        <p className="text-sm text-slate-400 mt-1">Items below 10 quantity</p>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Section */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">

                {/* Area Chart: Revenue Trend */}
                <Card className="lg:col-span-2 border-none shadow-md bg-white">
                    <CardHeader>
                        <CardTitle className="text-xl font-bold text-slate-800">Revenue Trend</CardTitle>
                        <CardDescription className="text-slate-500">Daily sales performance over the last 7 days</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[350px] w-full mt-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis
                                        dataKey="displayDate"
                                        stroke="#94a3b8"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                        dy={10}
                                    />
                                    <YAxis
                                        stroke="#94a3b8"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={(value) => `LKR ${value.toLocaleString()}`}
                                        dx={-10}
                                    />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: 'none', fontStyle: 'normal', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                                        itemStyle={{ color: '#0f172a', fontWeight: 'bold' }}
                                        formatter={(value: any, name: any) => [`LKR ${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2 })}`, name === 'total' ? 'Revenue' : 'Profit']}
                                        labelStyle={{ color: '#64748b', marginBottom: '4px' }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="total"
                                        stroke="#6366f1"
                                        strokeWidth={3}
                                        fillOpacity={1}
                                        fill="url(#colorTotal)"
                                        activeDot={{ r: 6, fill: "#6366f1", stroke: "#ffffff", strokeWidth: 2 }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="profit"
                                        stroke="#10b981"
                                        strokeWidth={3}
                                        fillOpacity={1}
                                        fill="url(#colorProfit)"
                                        activeDot={{ r: 6, fill: "#10b981", stroke: "#ffffff", strokeWidth: 2 }}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Donut Chart: Sales by Category */}
                <Card className="border-none shadow-md bg-white">
                    <CardHeader>
                        <CardTitle className="text-xl font-bold text-slate-800">Sales by Category</CardTitle>
                        <CardDescription className="text-slate-500">Revenue distribution</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center justify-center">
                        <div className="h-[280px] w-full mt-4">
                            {categorySales.length === 0 ? (
                                <div className="h-full flex items-center justify-center text-slate-400">No category data yet</div>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={categorySales}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={65}
                                            outerRadius={90}
                                            paddingAngle={5}
                                            dataKey="value"
                                            stroke="none"
                                        >
                                            {categorySales.map((_, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            formatter={(value: any) => `LKR ${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
                                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                        />
                                        <Legend
                                            verticalAlign="bottom"
                                            height={36}
                                            iconType="circle"
                                            wrapperStyle={{ fontSize: '13px', paddingTop: '20px' }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Bottom 3 Columns: Low Stock, Top Products, Recent Sales */}
            <div className="grid gap-6 md:grid-cols-3">

                {/* Top Products */}
                <Card className="border-none shadow-md bg-white">
                    <CardHeader>
                        <CardTitle className="text-lg font-bold text-slate-800">Top Selling Products</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-5">
                            {topProducts.map((product, i) => (
                                <div key={i} className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                        <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs ${i === 0 ? 'bg-amber-100 text-amber-600' : i === 1 ? 'bg-slate-100 text-slate-600' : i === 2 ? 'bg-orange-100 text-orange-600' : 'bg-indigo-50 text-indigo-600'}`}>
                                            {i + 1}
                                        </div>
                                        <p className="text-sm font-semibold text-slate-700">{product.name}</p>
                                    </div>
                                    <div className="font-medium text-sm text-slate-500 bg-slate-50 px-2 py-1 rounded-md">
                                        {product.total_sold} <span className="text-xs">sold</span>
                                    </div>
                                </div>
                            ))}
                            {topProducts.length === 0 && <p className="text-sm text-slate-400 text-center py-4">No sales data yet.</p>}
                        </div>
                    </CardContent>
                </Card>

                {/* Recent Sales */}
                <Card className="border-none shadow-md bg-white">
                    <CardHeader>
                        <CardTitle className="text-lg font-bold text-slate-800">Recent Transactions</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {sales.slice(0, 5).map(sale => (
                                <div key={sale.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                                    <div className="space-y-1">
                                        <p className="text-sm font-semibold text-slate-700">
                                            Order #{sale.id}
                                        </p>
                                        <p className="text-xs text-slate-400 flex items-center gap-1">
                                            {sale.created_at ? new Date(sale.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                            <span className="w-1 h-1 bg-slate-300 rounded-full mx-1"></span>
                                            {sale.payment_method}
                                        </p>
                                    </div>
                                    <div className="font-bold text-sm text-indigo-600">
                                        LKR {sale.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </div>
                                </div>
                            ))}
                            {sales.length === 0 && <p className="text-sm text-slate-400 text-center py-4">No recent sales.</p>}
                        </div>
                    </CardContent>
                </Card>

                {/* Low Stock Alerts */}
                <Card className={`border-none shadow-md ${lowStock.length > 0 ? 'bg-red-50/50' : 'bg-white'}`}>
                    <CardHeader>
                        <CardTitle className={`text-lg font-bold ${lowStock.length > 0 ? 'text-red-700' : 'text-slate-800'}`}>Inventory Alerts</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {lowStock.length > 0 ? (
                            <div className="space-y-3">
                                {lowStock.slice(0, 5).map(product => (
                                    <div key={product.id} className="bg-white p-3 rounded-xl border border-red-100 flex justify-between items-center shadow-sm">
                                        <span className="font-semibold text-sm text-slate-700 truncate pr-2 flex-1" title={product.name}>{product.name}</span>
                                        <span className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded-md font-bold shrink-0">
                                            {product.stock_quantity} left
                                        </span>
                                    </div>
                                ))}
                                {lowStock.length > 5 && (
                                    <p className="text-center text-xs text-slate-500 font-medium pt-2">
                                        + {lowStock.length - 5} more items low on stock
                                    </p>
                                )}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-8 text-emerald-500 gap-2">
                                <Package className="w-12 h-12 opacity-80" />
                                <p className="text-sm font-medium">All items well stocked!</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

            </div>
        </div>
    );
};

export default DashboardPage;
