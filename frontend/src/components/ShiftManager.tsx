import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getCurrentUser, startShift, endShift, getCurrentShift, type Shift } from '@/services/api';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { Printer } from 'lucide-react';

export function ShiftManager() {
    const user = getCurrentUser();
    const [currentShift, setCurrentShift] = useState<Shift | null>(null);
    const [loading, setLoading] = useState(true);
    const [amount, setAmount] = useState('');
    const [summary, setSummary] = useState<any>(null);
    const [isEndShiftOpen, setIsEndShiftOpen] = useState(false);

    const printRef = useRef<HTMLDivElement>(null);
    const handlePrint = useReactToPrint({
        contentRef: printRef,
    });

    useEffect(() => {
        if (user && user.role === 'cashier') {
            checkShift();
        } else {
            setLoading(false);
        }
    }, []);

    const checkShift = async () => {
        try {
            if (user) {
                const shift = await getCurrentShift(user.id);
                setCurrentShift(shift);
            }
        } catch (error) {
            console.error('Failed to check shift', error);
        } finally {
            setLoading(false);
        }
    };

    const handleStartShift = async () => {
        if (!user) return;
        try {
            await startShift(user.id, parseFloat(amount));
            setAmount('');
            checkShift();
        } catch (error) {
            alert('Failed to start shift');
        }
    };

    const handleEndShift = async () => {
        if (!currentShift) return;
        try {
            const data = await endShift(currentShift.id, parseFloat(amount));
            setSummary(data.summary);
            setCurrentShift(null);
            setAmount('');
            setIsEndShiftOpen(false); // Close input dialog
        } catch (error) {
            alert('Failed to end shift');
        }
    };

    if (loading || !user || user.role !== 'cashier') return null;

    // View: Shift Summary (After ending shift)
    if (summary) {
        return (
            <Dialog open={true} onOpenChange={() => setSummary(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Shift Ended - Summary</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="bg-slate-50 p-4 rounded-xl space-y-2 text-sm text-slate-700">
                            <div className="flex justify-between font-medium"><span>Start Cash:</span> <span>LKR {summary.startCash.toFixed(2)}</span></div>
                            <div className="flex justify-between"><span>Cash Sales:</span> <span>+ LKR {summary.cashSales?.toFixed(2) || '0.00'}</span></div>
                            <div className="flex justify-between text-slate-500"><span>Card Sales:</span> <span>LKR {summary.cardSales?.toFixed(2) || '0.00'}</span></div>
                            <div className="flex justify-between text-slate-500"><span>Credit Sales:</span> <span>LKR {summary.creditSales?.toFixed(2) || '0.00'}</span></div>
                            <div className="border-t border-slate-200 my-2"></div>
                            <div className="flex justify-between font-bold text-slate-800"><span>Expected Cash in Drawer:</span> <span>LKR {summary.expectedCash.toFixed(2)}</span></div>
                            <div className="flex justify-between font-bold text-blue-600"><span>Actual Cash Counted:</span> <span>LKR {summary.endCash.toFixed(2)}</span></div>

                            <div className="mt-4 pt-3 border-t border-slate-200 flex justify-between font-bold">
                                <span>Difference (Over/Short):</span>
                                <span className={summary.endCash - summary.expectedCash >= 0 ? "text-green-600" : "text-red-600"}>
                                    {summary.endCash - summary.expectedCash > 0 ? '+' : ''}LKR {(summary.endCash - summary.expectedCash).toFixed(2)}
                                </span>
                            </div>
                        </div>

                        {/* Hidden Printable Z-Report */}
                        <div className="hidden">
                            <div ref={printRef} className="p-4 w-[80mm] text-sm font-mono bg-white text-black print:m-0 print:p-0 print:shadow-none" style={{ margin: 0, padding: '15px' }}>
                                <div className="text-center mb-6">
                                    <h1 className="text-xl font-bold uppercase">END OF SHIFT</h1>
                                    <h2 className="text-lg font-bold">Z-REPORT</h2>
                                    <p className="mt-2 text-xs">Cashier: {user.username}</p>
                                    <p className="text-xs">Date: {new Date().toLocaleString()}</p>
                                </div>

                                <div className="space-y-2 border-b border-black border-dashed pb-4 mb-4">
                                    <div className="flex justify-between"><span>Opening Cash:</span> <span>{summary.startCash.toFixed(2)}</span></div>
                                    <div className="flex justify-between"><span>Cash Sales:</span> <span>{summary.cashSales?.toFixed(2) || '0.00'}</span></div>
                                    <div className="flex justify-between text-xs text-gray-500"><span>Card Sales:</span> <span>{summary.cardSales?.toFixed(2) || '0.00'}</span></div>
                                    <div className="flex justify-between text-xs text-gray-500"><span>Credit Sales:</span> <span>{summary.creditSales?.toFixed(2) || '0.00'}</span></div>
                                    <div className="flex justify-between font-bold pt-2"><span>Total Sales:</span> <span>{summary.totalSales?.toFixed(2) || '0.00'}</span></div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between font-bold"><span>Expected Drawer:</span> <span>{summary.expectedCash.toFixed(2)}</span></div>
                                    <div className="flex justify-between font-bold"><span>Actual Drawer:</span> <span>{summary.endCash.toFixed(2)}</span></div>
                                    <div className="flex justify-between pt-2 border-t border-black border-dashed mt-2">
                                        <span>DIFFERENCE:</span>
                                        <span>{summary.endCash - summary.expectedCash > 0 ? '+' : ''}{(summary.endCash - summary.expectedCash).toFixed(2)}</span>
                                    </div>
                                </div>
                                <div className="text-center mt-8 text-xs pb-4">
                                    <p>*** END OF REPORT ***</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setSummary(null)}>Close Window</Button>
                        <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={handlePrint}><Printer className="w-4 h-4 mr-2" /> Print Z-Report</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        );
    }

    // View: No active shift -> Start Shift Prompt
    if (!currentShift) {
        return (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <Card className="w-[400px]">
                    <CardHeader>
                        <CardTitle>Start Shift</CardTitle>
                        <CardDescription>Enter initial cash in drawer to begin.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Initial Cash (LKR)</Label>
                            <Input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="0.00"
                            />
                        </div>
                        <Button onClick={handleStartShift} className="w-full">Start Shift</Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // View: Active Shift -> End Shift Button
    return (
        <>
            <Button variant="destructive" onClick={() => setIsEndShiftOpen(true)}>End Shift</Button>

            <Dialog open={isEndShiftOpen} onOpenChange={setIsEndShiftOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>End Shift</DialogTitle>
                        <DialogDescription>Enter the total cash currently in the drawer.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2">
                        <Label>Ending Cash (LKR)</Label>
                        <Input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="0.00"
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEndShiftOpen(false)}>Cancel</Button>
                        <Button variant="destructive" onClick={handleEndShift}>Confirm End Shift</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
