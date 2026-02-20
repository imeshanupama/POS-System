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

export function ShiftManager() {
    const user = getCurrentUser();
    const [currentShift, setCurrentShift] = useState<Shift | null>(null);
    const [loading, setLoading] = useState(true);
    const [amount, setAmount] = useState('');
    const [summary, setSummary] = useState<any>(null);
    const [isEndShiftOpen, setIsEndShiftOpen] = useState(false);

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
                    <div className="space-y-2">
                        <div className="flex justify-between"><span>Start Cash:</span> <span>LKR {summary.startCash.toFixed(2)}</span></div>
                        <div className="flex justify-between"><span>Total Sales:</span> <span>LKR {summary.totalSales.toFixed(2)}</span></div>
                        <div className="border-t my-2"></div>
                        <div className="flex justify-between font-bold"><span>Expected Cash:</span> <span>LKR {summary.expectedCash.toFixed(2)}</span></div>
                        <div className="flex justify-between text-blue-600 font-bold"><span>Actual Cash:</span> <span>LKR {summary.endCash.toFixed(2)}</span></div>

                        <div className="mt-4 pt-2 border-t flex justify-between">
                            <span>Difference:</span>
                            <span className={summary.endCash - summary.expectedCash >= 0 ? "text-green-600" : "text-red-600"}>
                                LKR {(summary.endCash - summary.expectedCash).toFixed(2)}
                            </span>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={() => setSummary(null)}>Close</Button>
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
