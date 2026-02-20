import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { type Customer, getCustomers, addCustomer, recordCreditPayment, getCustomerHistory } from '../services/api';
import { Search, Users, Plus, CreditCard, Clock } from 'lucide-react';

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

const CustomersPage: React.FC = () => {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);

    // Add Customer Form
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [newCustomer, setNewCustomer] = useState({ name: '', phone: '', email: '' });

    // Payment Dialog
    const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [paymentAmount, setPaymentAmount] = useState('');

    // History Dialog
    const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
    const [customerHistory, setCustomerHistory] = useState<any[]>([]);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const data = await getCustomers();
            setCustomers(data);
            setFilteredCustomers(data);
        } catch (error) {
            console.error('Failed to fetch customers', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!searchQuery.trim()) {
            setFilteredCustomers(customers);
        } else {
            const lower = searchQuery.toLowerCase();
            setFilteredCustomers(customers.filter(c =>
                c.name.toLowerCase().includes(lower) ||
                (c.phone && c.phone.includes(lower))
            ));
        }
    }, [searchQuery, customers]);

    const handleAddCustomer = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await addCustomer(newCustomer);
            setIsAddDialogOpen(false);
            setNewCustomer({ name: '', phone: '', email: '' });
            fetchData();
        } catch (error: any) {
            alert(error.response?.data?.error || 'Failed to add customer');
        }
    };

    const handlePayment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedCustomer || !paymentAmount) return;

        try {
            const cashierId = JSON.parse(localStorage.getItem('user') || '{}').id;
            await recordCreditPayment(selectedCustomer.id, {
                amount: parseFloat(paymentAmount),
                payment_method: 'cash',
                cashierId
            });
            setPaymentDialogOpen(false);
            setPaymentAmount('');
            fetchData();
        } catch (error) {
            alert('Failed to record payment');
        }
    };

    const viewHistory = async (customer: Customer) => {
        try {
            setSelectedCustomer(customer);
            const history = await getCustomerHistory(customer.id);
            setCustomerHistory(history);
            setHistoryDialogOpen(true);
        } catch (error) {
            alert('Failed to load history');
        }
    };

    if (loading) return <div className="p-8 text-center text-slate-500">Loading customers...</div>;

    return (
        <div className="container mx-auto p-4 max-w-6xl animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-3">
                        <Users className="w-8 h-8 text-indigo-500" />
                        Customer Directory
                    </h1>
                    <p className="text-slate-500 mt-1">Manage store credit and customer relationships</p>
                </div>

                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="h-10 bg-indigo-600 hover:bg-indigo-700 shadow-md transition-all">
                            <Plus className="w-4 h-4 mr-2" />
                            Add Customer
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Register New Customer</DialogTitle>
                            <DialogDescription>Create a new customer profile to track credit sales.</DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleAddCustomer} className="space-y-4 py-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Full Name</label>
                                <Input required value={newCustomer.name} onChange={e => setNewCustomer({ ...newCustomer, name: e.target.value })} placeholder="John Doe" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Phone Number</label>
                                <Input value={newCustomer.phone} onChange={e => setNewCustomer({ ...newCustomer, phone: e.target.value })} placeholder="+94 77 XXXXXXX" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Email Address (Optional)</label>
                                <Input type="email" value={newCustomer.email} onChange={e => setNewCustomer({ ...newCustomer, email: e.target.value })} placeholder="john@example.com" />
                            </div>
                            <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 mt-4">Save Customer</Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <Card className="shadow-md border-none pb-4">
                <CardHeader className="bg-white border-b border-slate-100 pb-4 flex flex-row justify-between items-center rounded-t-xl">
                    <CardTitle className="text-xl text-slate-800">Customers</CardTitle>
                    <div className="relative w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                            placeholder="Search name or phone..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 h-10 bg-slate-50 border-slate-200"
                        />
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-slate-50">
                            <TableRow>
                                <TableHead className="font-semibold text-slate-600">Name</TableHead>
                                <TableHead className="font-semibold text-slate-600">Contact</TableHead>
                                <TableHead className="font-semibold text-slate-600 text-right">Credit Balance</TableHead>
                                <TableHead className="font-semibold text-slate-600 text-center">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredCustomers.map(customer => (
                                <TableRow key={customer.id}>
                                    <TableCell className="font-medium text-slate-800">{customer.name}</TableCell>
                                    <TableCell className="text-slate-500">
                                        <div className="text-sm">{customer.phone || '—'}</div>
                                        <div className="text-xs text-slate-400">{customer.email}</div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <span className={`font-bold ${customer.credit_balance > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                                            LKR {customer.credit_balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="border-indigo-200 text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700"
                                                onClick={() => { setSelectedCustomer(customer); setPaymentDialogOpen(true); }}
                                                disabled={customer.credit_balance <= 0}
                                            >
                                                <CreditCard className="w-4 h-4 mr-1" />
                                                Pay Credit
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-slate-500 hover:text-slate-700"
                                                onClick={() => viewHistory(customer)}
                                            >
                                                <Clock className="w-4 h-4 mr-1" />
                                                History
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {filteredCustomers.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-8 text-slate-400">No customers found.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Payment Dialog */}
            <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Receive Credit Payment</DialogTitle>
                        <DialogDescription>Record a cash payment to settle outstanding credit.</DialogDescription>
                    </DialogHeader>
                    {selectedCustomer && (
                        <form onSubmit={handlePayment} className="space-y-4 py-4">
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex justify-between items-center mb-4">
                                <div>
                                    <p className="text-sm font-semibold text-slate-600">{selectedCustomer.name}</p>
                                    <p className="text-xs text-slate-400">Outstanding Balance</p>
                                </div>
                                <div className="text-xl font-bold text-amber-600">
                                    LKR {selectedCustomer.credit_balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Payment Amount (LKR)</label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    required
                                    max={selectedCustomer.credit_balance}
                                    value={paymentAmount}
                                    onChange={e => setPaymentAmount(e.target.value)}
                                    placeholder="0.00"
                                />
                            </div>
                            <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 mt-4">Confirm Payment Received</Button>
                        </form>
                    )}
                </DialogContent>
            </Dialog>

            {/* History Dialog */}
            <Dialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>
                <DialogContent className="max-w-xl">
                    <DialogHeader>
                        <DialogTitle>Account History - {selectedCustomer?.name}</DialogTitle>
                        <DialogDescription>Recent credit purchases and payments.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3 max-h-[400px] overflow-y-auto py-2">
                        {customerHistory.map(record => (
                            <div key={`${record.type}-${record.id}`} className={`p-4 rounded-xl border flex justify-between items-center ${record.type === 'payment' ? 'bg-emerald-50 border-emerald-100' : 'bg-amber-50 border-amber-100'}`}>
                                <div>
                                    <p className={`font-semibold text-sm ${record.type === 'payment' ? 'text-emerald-700' : 'text-amber-700'}`}>
                                        {record.type === 'payment' ? 'Payment Received' : 'Credit Purchase'}
                                    </p>
                                    <p className="text-xs text-slate-500 mt-1">
                                        {new Date(record.created_at).toLocaleString()}
                                        {record.type === 'purchase' && ` • Order #${record.id}`}
                                    </p>
                                </div>
                                <div className={`font-bold ${record.type === 'payment' ? 'text-emerald-600' : 'text-amber-600'}`}>
                                    {record.type === 'payment' ? '-' : '+'} LKR {record.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </div>
                            </div>
                        ))}
                        {customerHistory.length === 0 && (
                            <div className="text-center text-slate-400 py-8">No transaction history found.</div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

        </div>
    );
};

export default CustomersPage;
