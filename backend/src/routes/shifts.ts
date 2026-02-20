import { Router } from 'express';
import db from '../db';

const router = Router();

// Start Shift
router.post('/start', (req, res) => {
    const { cashierId, startCash } = req.body;

    // Check if cashier already has an active shift
    const existingShift = db.prepare('SELECT * FROM shifts WHERE cashier_id = ? AND end_time IS NULL').get(cashierId);
    if (existingShift) {
        return res.status(400).json({ error: 'Cashier already has an active shift' });
    }

    try {
        const stmt = db.prepare('INSERT INTO shifts (cashier_id, start_cash) VALUES (?, ?)');
        const info = stmt.run(cashierId, startCash || 0);
        res.json({ id: info.lastInsertRowid, message: 'Shift started' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to start shift' });
    }
});

// Get Current Active Shift
router.get('/current/:cashierId', (req, res) => {
    const { cashierId } = req.params;
    try {
        const shift = db.prepare('SELECT * FROM shifts WHERE cashier_id = ? AND end_time IS NULL').get(cashierId);
        if (!shift) {
            return res.json(null);
        }
        res.json(shift);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch shift' });
    }
});

// End Shift
router.post('/end', (req, res) => {
    const { shiftId, endCash } = req.body;

    try {
        const shift = db.prepare('SELECT * FROM shifts WHERE id = ?').get(shiftId) as any;
        if (!shift) return res.status(404).json({ error: 'Shift not found' });
        if (shift.end_time) return res.status(400).json({ error: 'Shift already ended' });

        // Calculate total sales for this cashier during this shift
        // This query sums up sales that happened after shift start time
        // Ideally we should link sales directly to shift_id but using time range is simpler for now if we didn't add shift_id to sales
        // Wait, did we add shift_id to sales? No. We have cashier_id and time.
        // Let's summing sales for this cashier since shift start.

        const salesResult = db.prepare(`
            SELECT SUM(total_amount) as total 
            FROM sales 
            WHERE cashier_id = ? AND created_at >= ? AND status = 'completed'
        `).get(shift.cashier_id, shift.start_time) as { total: number } | undefined;

        const totalSales = salesResult?.total || 0;

        const update = db.prepare('UPDATE shifts SET end_time = CURRENT_TIMESTAMP, end_cash = ?, total_sales = ? WHERE id = ?');
        update.run(endCash, totalSales, shiftId);

        res.json({
            message: 'Shift ended',
            summary: {
                startCash: shift.start_cash,
                endCash,
                totalSales,
                expectedCash: shift.start_cash + totalSales
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to end shift' });
    }
});

export default router;
