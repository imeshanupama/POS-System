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
        const insertSale = db.prepare('INSERT INTO sales (total_amount, discount, payment_method, customer_id) VALUES (?, ?, ?, ?)');
        const insertItem = db.prepare('INSERT INTO sale_items (sale_id, product_id, quantity, price_at_sale, cost_price_at_sale, discount) VALUES (?, ?, ?, ?, ?, ?)');
        const updateStock = db.prepare('UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?');
        const getCostPrice = db.prepare('SELECT cost_price FROM products WHERE id = ?');

        const createTransaction = db.transaction(() => {
            const info = insertSale.run(total_amount, req.body.discount || 0, payment_method || 'cash', req.body.customer_id || null);
            const saleId = info.lastInsertRowid;

            if (payment_method === 'credit' && req.body.customer_id) {
                db.prepare('UPDATE customers SET credit_balance = credit_balance + ? WHERE id = ?').run(total_amount, req.body.customer_id);
            }

            for (const item of items) {
                const product = getCostPrice.get(item.product_id) as any;
                const costPrice = product && product.cost_price ? product.cost_price : 0;

                insertItem.run(saleId, item.product_id, item.quantity, item.price_at_sale, costPrice, item.discount || 0);
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
        'cost_price_at_sale', si.cost_price_at_sale,
        'discount', si.discount,
        'name', p.name
      ))
       FROM sale_items si
       JOIN products p ON si.product_id = p.id
       WHERE si.sale_id = s.id) as items,
       c.name as customer_name
      FROM sales s 
      LEFT JOIN customers c ON s.customer_id = c.id
      ORDER BY s.created_at DESC 
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

// Analytics: Daily Sales (Last 7 Days)
router.get('/analytics/daily', (req, res) => {
    try {
        const data = db.prepare(`
            SELECT strftime('%Y-%m-%d', created_at) as date, 
                   SUM(total_amount) as total,
                   SUM((SELECT SUM((price_at_sale - cost_price_at_sale) * quantity) FROM sale_items WHERE sale_id = sales.id)) as profit
            FROM sales
            WHERE status = 'completed' AND created_at >= date('now', '-7 days')
            GROUP BY date
            ORDER BY date
        `).all();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch daily sales' });
    }
});

// Analytics: Top Selling Products
router.get('/analytics/top-products', (req, res) => {
    try {
        const data = db.prepare(`
            SELECT p.name, SUM(si.quantity) as total_sold
            FROM sale_items si
            JOIN sales s ON si.sale_id = s.id
            JOIN products p ON si.product_id = p.id
            WHERE s.status = 'completed'
            GROUP BY p.id
            ORDER BY total_sold DESC
            LIMIT 5
        `).all();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch top products' });
    }
});

// Analytics: Low Stock Alerts
router.get('/analytics/low-stock', (req, res) => {
    try {
        const data = db.prepare(`
            SELECT * FROM products WHERE stock_quantity < 10
        `).all();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch low stock items' });
    }
});

// Analytics: Sales by Category
router.get('/analytics/category-sales', (req, res) => {
    try {
        const data = db.prepare(`
            SELECT c.name, SUM(si.quantity * si.price_at_sale) as value
            FROM sale_items si
            JOIN sales s ON si.sale_id = s.id
            JOIN products p ON si.product_id = p.id
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE s.status = 'completed'
            GROUP BY p.category_id
            ORDER BY value DESC
        `).all();

        const formattedData = data.map((item: any) => ({
            name: item.name || 'Uncategorized',
            value: item.value || 0
        }));

        res.json(formattedData);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch category sales' });
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

// Hold Sale (Park)
router.post('/hold', (req, res) => {
    const { total_amount, items } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: 'Items cannot be empty' });
    }

    try {
        const insertSale = db.prepare('INSERT INTO sales (total_amount, discount, payment_method, status) VALUES (?, ?, ?, ?)');
        const insertItem = db.prepare('INSERT INTO sale_items (sale_id, product_id, quantity, price_at_sale, cost_price_at_sale, discount) VALUES (?, ?, ?, ?, ?, ?)');
        const updateStock = db.prepare('UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?');
        const getCostPrice = db.prepare('SELECT cost_price FROM products WHERE id = ?');

        const createTransaction = db.transaction(() => {
            const info = insertSale.run(total_amount, req.body.discount || 0, 'hold', 'held');
            const saleId = info.lastInsertRowid;

            for (const item of items) {
                const product = getCostPrice.get(item.product_id) as any;
                const costPrice = product && product.cost_price ? product.cost_price : 0;

                insertItem.run(saleId, item.product_id, item.quantity, item.price_at_sale, costPrice, item.discount || 0);
                updateStock.run(item.quantity, item.product_id);
            }
            return saleId;
        });

        const saleId = createTransaction();
        res.status(201).json({ id: saleId, message: 'Sale held successfully' });
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
});

// Get Held Sales
router.get('/held', (req, res) => {
    try {
        const sales = db.prepare(`
            SELECT s.*, 
            (SELECT json_group_array(json_object(
                'product_id', si.product_id, 
                'quantity', si.quantity, 
                'price_at_sale', si.price_at_sale,
                'cost_price_at_sale', si.cost_price_at_sale,
                'discount', si.discount,
                'name', p.name,
                'price', p.price,
                'cost_price', p.cost_price
            ))
            FROM sale_items si
            JOIN products p ON si.product_id = p.id
            WHERE si.sale_id = s.id) as items
            FROM sales s 
            WHERE status = 'held'
            ORDER BY created_at DESC
        `).all();

        const formattedSales = sales.map((sale: any) => ({
            ...sale,
            items: JSON.parse(sale.items)
        }));

        res.json(formattedSales);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch held sales' });
    }
});

// Retrieve (Delete) Held Sale
router.delete('/held/:id', (req, res) => {
    const { id } = req.params;

    try {
        // Get items with product details to restore to cart
        const getItems = db.prepare(`
            SELECT si.*, p.name, p.barcode, p.price, p.stock_quantity, p.category_id
            FROM sale_items si
            JOIN products p ON si.product_id = p.id
            WHERE si.sale_id = ?
        `);
        const updateStock = db.prepare('UPDATE products SET stock_quantity = stock_quantity + ? WHERE id = ?');
        const deleteItems = db.prepare('DELETE FROM sale_items WHERE sale_id = ?');
        const deleteSale = db.prepare('DELETE FROM sales WHERE id = ?');

        const retrieveTransaction = db.transaction(() => {
            const items = getItems.all(id) as any[];
            if (items.length === 0) throw new Error('Sale not found or empty');

            // Restore Stock
            for (const item of items) {
                updateStock.run(item.quantity, item.product_id);
            }

            // Clean up DB
            deleteItems.run(id);
            deleteSale.run(id);

            return items;
        });

        const items = retrieveTransaction();
        res.json({ message: 'Sale retrieved', items });
    } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve sale' });
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
