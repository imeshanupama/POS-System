import { Router } from 'express';
import db from '../db';
import { Product } from '../../../shared/src/types';

const router = Router();

// Get all products
router.get('/', (req, res) => {
    try {
        const products = db.prepare('SELECT * FROM products ORDER BY name').all();
        res.json(products);
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
});

// Get product by barcode
router.get('/scan/:barcode', (req, res) => {
    try {
        const product = db.prepare('SELECT * FROM products WHERE barcode = ?').get(req.params.barcode);
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }
        res.json(product);
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
});

// Add new product
router.post('/', (req, res) => {
    const { name, barcode, price, stock_quantity, category_id } = req.body;

    if (!name || !price) {
        return res.status(400).json({ error: 'Name and price are required' });
    }

    try {
        const stmt = db.prepare(
            'INSERT INTO products (name, barcode, price, stock_quantity, category_id) VALUES (?, ?, ?, ?, ?)'
        );
        const info = stmt.run(name, barcode || null, price, stock_quantity || 0, category_id || null);

        res.status(201).json({
            id: info.lastInsertRowid,
            name, barcode, price, stock_quantity, category_id
        });
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
});

// Update product
router.put('/:id', (req, res) => {
    const { name, barcode, price, stock_quantity, category_id } = req.body;
    const { id } = req.params;

    try {
        const stmt = db.prepare(`
      UPDATE products 
      SET name = ?, barcode = ?, price = ?, stock_quantity = ?, category_id = ?
      WHERE id = ?
    `);
        const info = stmt.run(name, barcode, price, stock_quantity, category_id, id);

        if (info.changes === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }

        res.json({ message: 'Product updated successfully' });
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
});

// Delete product
router.delete('/:id', (req, res) => {
    const { id } = req.params;

    try {
        const stmt = db.prepare('DELETE FROM products WHERE id = ?');
        const info = stmt.run(id);

        if (info.changes === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }

        res.json({ message: 'Product deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
});

export default router;
