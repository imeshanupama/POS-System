import { Router } from 'express';
import db from '../db';
import { Sale, SaleItem } from '../../../shared/src/types';

const router = Router();

// Process a Sale
router.post('/', (req, res) => {
    const { total_amount, payment_method, items } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: 'Sales items cannot be empty' });
    }

    try {
        const insertSale = db.prepare('INSERT INTO sales (total_amount, payment_method) VALUES (?, ?)');
        const insertItem = db.prepare('INSERT INTO sale_items (sale_id, product_id, quantity, price_at_sale) VALUES (?, ?, ?, ?)');
        const updateStock = db.prepare('UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?');

        const createTransaction = db.transaction(() => {
            const info = insertSale.run(total_amount, payment_method || 'cash');
            const saleId = info.lastInsertRowid;

            for (const item of items) {
                insertItem.run(saleId, item.product_id, item.quantity, item.price_at_sale);
                updateStock.run(item.quantity, item.product_id);
            }
            return saleId;
        });

        const saleId = createTransaction();
        res.status(201).json({ id: saleId, message: 'Sale processed successfully' });
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
});

// Get Sales History
router.get('/', (req, res) => {
    try {
        const sales = db.prepare(`
      SELECT s.*, 
      (SELECT json_group_array(json_object(
        'product_id', si.product_id, 
        'quantity', si.quantity, 
        'price_at_sale', si.price_at_sale,
        'name', p.name
      ))
       FROM sale_items si
       JOIN products p ON si.product_id = p.id
       WHERE si.sale_id = s.id) as items
      FROM sales s 
      ORDER BY created_at DESC 
      LIMIT 100
    `).all();

        // Parse JSON items if needed (better-sqlite3 returns string for JSON functions)
        const formattedSales = sales.map((sale: any) => ({
            ...sale,
            items: JSON.parse(sale.items)
        }));

        res.json(formattedSales);
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
});

// Request void (Cashier)
router.post('/:id/void', (req, res) => {
    const { id } = req.params;
    const { cashierId } = req.body;

    try {
        const stmt = db.prepare('UPDATE sales SET status = ?, cashier_id = ? WHERE id = ?');
        const info = stmt.run('pending_void', cashierId, id);

        if (info.changes === 0) return res.status(404).json({ error: 'Sale not found' });
        res.json({ message: 'Void request submitted' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to request void' });
    }
});

// Admin approves void request
router.post('/:id/void/approve', (req, res) => {
    const { id } = req.params;

    try {
        const sale = db.prepare('SELECT * FROM sales WHERE id = ?').get(id) as any;
        if (!sale) return res.status(404).json({ error: 'Sale not found' });
        if (sale.status !== 'pending_void') return res.status(400).json({ error: 'Sale is not pending void' });

        // Restore stock
        const items = db.prepare('SELECT * FROM sale_items WHERE sale_id = ?').all(id) as any[];
        const updateStock = db.prepare('UPDATE products SET stock_quantity = stock_quantity + ? WHERE id = ?');

        db.transaction(() => {
            for (const item of items) {
                updateStock.run(item.quantity, item.product_id);
            }
            db.prepare('UPDATE sales SET status = ? WHERE id = ?').run('voided', id);
        })();

        res.json({ message: 'Sale voided and stock restored' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to approve void' });
    }
});

export default router;
