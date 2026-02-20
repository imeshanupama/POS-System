import { Router } from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import db from '../db';

const router = Router();
const upload = multer({ dest: 'uploads/' });

// Backup Database
router.get('/backup', async (req, res) => {
    try {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupFileName = `pos-backup-${timestamp}.sqlite`;
        const backupPath = path.join(path.dirname(db.name), backupFileName);

        // better-sqlite3 built-in backup function ensures thread-safe exact copy
        await db.backup(backupPath);

        res.download(backupPath, backupFileName, (err) => {
            // Cleanup local file immediately after sending to client
            if (!err || err) {
                if (fs.existsSync(backupPath)) {
                    fs.unlinkSync(backupPath);
                }
            }
        });
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
});

// Restore Database
router.post('/restore', upload.single('database'), (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No database file provided.' });

        const uploadedFilePath = req.file.path;
        const currentDbPath = db.name;

        // Verify it's not empty and seems to be a file
        const stats = fs.statSync(uploadedFilePath);
        if (stats.size === 0) {
            fs.unlinkSync(uploadedFilePath);
            return res.status(400).json({ error: 'Uploaded file is empty.' });
        }

        // Close our active live connect to unlock the actual pos.db file
        db.close();

        // Overwrite standard db file safely
        fs.copyFileSync(uploadedFilePath, currentDbPath);

        // Remove the multer temp file
        fs.unlinkSync(uploadedFilePath);

        res.json({ message: 'Database Restored! System must restart to take effect.' });

        // Force backend to exit successfully, PM2 or standard auto-restart script will boot it back up immediately
        setTimeout(() => {
            console.warn("Restarting node process explicitly to reload fresh SQLite database restore...");
            process.exit(0);
        }, 1500);

    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
});

export default router;
