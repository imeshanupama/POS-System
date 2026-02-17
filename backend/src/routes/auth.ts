import express from 'express';
import bcrypt from 'bcryptjs';
import db from '../db';
import { Database } from 'better-sqlite3';

const router = express.Router();

// Get current user (simple implementation for now)
router.get('/current', (req, res) => {
    // For now, returning a mock user. In real app, check session/token
    res.json({ id: 1, username: 'admin', role: 'admin' });
});

// Login
router.post('/login', (req, res) => {
    const { username, password } = req.body;

    try {
        const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username) as any;

        if (!user || !bcrypt.compareSync(password, user.password)) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // In a real app, generate a JWT token here
        res.json({
            id: user.id,
            username: user.username,
            role: user.role
        });
    } catch (error) {
        res.status(500).json({ error: 'Login failed' });
    }
});

// Register (One-time setup or Admin only)
router.post('/register', (req, res) => {
    const { username, password, role } = req.body;

    try {
        const hashedPassword = bcrypt.hashSync(password, 10);
        const stmt = db.prepare('INSERT INTO users (username, password, role) VALUES (?, ?, ?)');
        const result = stmt.run(username, hashedPassword, role || 'cashier');

        res.json({ id: result.lastInsertRowid, username, role });
    } catch (error) {
        res.status(400).json({ error: 'Username likely taken' });
    }
});

export default router;
