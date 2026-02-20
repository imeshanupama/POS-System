import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { type Product, getStockAdjustments, addStockAdjustment, type StockAdjustment, getCurrentUser } from '../services/api';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { ScrollArea } from './ui/scroll-area';

interface StockAdjustmentDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    product: Product | null;
    onAdjusted: () => void;
}

export function StockAdjustmentDialog({ open, onOpenChange, product, onAdjusted }: StockAdjustmentDialogProps) {
    const user = getCurrentUser();
    const [adjustments, setAdjustments] = useState<StockAdjustment[]>([]);
    const [loading, setLoading] = useState(false);

    // Form states
    const [quantityChange, setQuantityChange] = useState('');
    const [reason, setReason] = useState('Purchase');
    const [notes, setNotes] = useState('');

    useEffect(() => {
        if (open && product) {
            fetchAdjustments();
            // Reset form
            setQuantityChange('');
            setReason('Purchase');
            setNotes('');
        }
    }, [open, product]);

    const fetchAdjustments = async () => {
        if (!product) return;
        setLoading(true);
        try {
            const data = await getStockAdjustments(product.id!);
            setAdjustments(data);
        } catch (error) {
            console.error('Failed to fetch adjustments', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!product || !user) return;

        const change = parseInt(quantityChange);
        if (isNaN(change) || change === 0) {
            alert("Quantity change cannot be 0.");
            return;
        }

        if (product.stock_quantity + change < 0) {
            alert("Stock cannot go below 0.");
            return;
        }

        try {
            await addStockAdjustment(product.id!, {
                user_id: user.id,
                quantity_change: change,
                reason,
                notes: notes.trim() !== '' ? notes : undefined
            });
            onAdjusted(); // Refresh list containing stock numbers
            fetchAdjustments(); // Refresh logs
            setQuantityChange('');
            setNotes('');
        } catch (error) {
            alert('Failed to submit adjustment.');
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-xl">
                <DialogHeader>
                    <DialogTitle>Stock Adjustments: {product?.name}</DialogTitle>
                    <DialogDescription>
                        Current Stock: <strong className="text-black">{product?.stock_quantity}</strong>
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Add Adjustment Form */}
                    <form onSubmit={handleSubmit} className="bg-slate-50 p-4 rounded-xl space-y-4 shadow-sm border border-slate-100">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Select Reason</Label>
                                <select
                                    className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950"
                                    value={reason}
                                    onChange={e => setReason(e.target.value)}
                                >
                                    <option value="Purchase">Purchase (Supplier)</option>
                                    <option value="Return">Customer Return</option>
                                    <option value="Damage">Damage / Spoilage</option>
                                    <option value="Theft">Theft / Loss</option>
                                    <option value="Correction">Inventory Correction</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label>Quantity Change (+ or -)</Label>
                                <Input
                                    type="number"
                                    placeholder="e.g. +50 or -2"
                                    value={quantityChange}
                                    onChange={(e) => setQuantityChange(e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Notes (Optional)</Label>
                            <Input
                                placeholder="Supplier name or more details..."
                                value={notes}
                                onChange={e => setNotes(e.target.value)}
                            />
                        </div>
                        <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white">
                            Submit Adjustment
                        </Button>
                    </form>

                    {/* Adjustment History */}
                    <div>
                        <h4 className="font-semibold text-sm mb-2 text-slate-700">Audit Trail / History</h4>
                        <ScrollArea className="h-48 border rounded-lg bg-white">
                            {loading ? (
                                <p className="text-center p-4 text-slate-500 text-sm">Loading historical data...</p>
                            ) : adjustments.length === 0 ? (
                                <p className="text-center p-4 text-slate-500 text-sm">No adjustments on record.</p>
                            ) : (
                                <Table className="text-sm">
                                    <TableHeader className="bg-slate-50 sticky top-0">
                                        <TableRow>
                                            <TableHead className="py-2">Date</TableHead>
                                            <TableHead className="py-2">Reason</TableHead>
                                            <TableHead className="py-2">Notes</TableHead>
                                            <TableHead className="py-2">User</TableHead>
                                            <TableHead className="py-2 text-right">Qty</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {adjustments.map(adj => (
                                            <TableRow key={adj.id}>
                                                <TableCell className="py-2 text-xs text-slate-500">{new Date(adj.created_at || '').toLocaleDateString()}</TableCell>
                                                <TableCell className="py-2 font-medium">{adj.reason}</TableCell>
                                                <TableCell className="py-2 text-xs text-slate-500">{adj.notes || '-'}</TableCell>
                                                <TableCell className="py-2 text-xs">{(adj as any).user_name || 'System'}</TableCell>
                                                <TableCell className={`py-2 text-right font-bold ${adj.quantity_change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                    {adj.quantity_change > 0 ? '+' : ''}{adj.quantity_change}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </ScrollArea>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
