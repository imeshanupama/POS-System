import { Router } from 'express';
import db from '../db';

const router = Router();

// Get all customers
router.get('/', (req, res) => {
    try {
        const customers = db.prepare('SELECT * FROM customers ORDER BY name').all();
        res.json(customers);
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
});

// Search customers
router.get('/search', (req, res) => {
    const { q } = req.query;
    try {
        const customers = db.prepare(`
            SELECT * FROM customers 
            WHERE name LIKE ? OR phone LIKE ? 
            ORDER BY name LIMIT 10
        `).all(`%${q}%`, `%${q}%`);
        res.json(customers);
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
});

// Add a new customer
router.post('/', (req, res) => {
    const { name, phone, email } = req.body;

    if (!name) return res.status(400).json({ error: 'Name is required' });

    try {
        const stmt = db.prepare('INSERT INTO customers (name, phone, email) VALUES (?, ?, ?)');
        const info = stmt.run(name, phone || null, email || null);
        res.status(201).json({ id: info.lastInsertRowid, name, phone, email, credit_balance: 0 });
    } catch (error: any) {
        if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
            return res.status(400).json({ error: 'Phone number already exists' });
        }
        res.status(500).json({ error: error.message });
    }
});

// Record a credit payment (paying off debt)
router.post('/:id/payments', (req, res) => {
    const { id } = req.params;
    const { amount, payment_method, cashierId } = req.body;

    if (!amount || amount <= 0) return res.status(400).json({ error: 'Valid amount is required' });

    try {
        const insertPayment = db.prepare('INSERT INTO credit_payments (customer_id, amount, payment_method, cashier_id) VALUES (?, ?, ?, ?)');
        const updateBalance = db.prepare('UPDATE customers SET credit_balance = credit_balance - ? WHERE id = ?');

        const processPayment = db.transaction(() => {
            insertPayment.run(id, amount, payment_method || 'cash', cashierId || null);
            updateBalance.run(amount, id);
        });

        processPayment();
        res.json({ message: 'Payment recorded successfully' });
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
});

// Get customer credit history
router.get('/:id/history', (req, res) => {
    const { id } = req.params;
    try {
        const sales = db.prepare(`
            SELECT id, total_amount as amount, created_at, 'sale' as type 
            FROM sales 
            WHERE customer_id = ? AND payment_method = 'credit'
        `).all(id);

        const payments = db.prepare(`
            SELECT id, amount, created_at, 'payment' as type 
            FROM credit_payments 
            WHERE customer_id = ?
        `).all(id);

        const history = [...sales, ...payments].sort((a: any, b: any) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );

        res.json(history);
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
});

export default router;
