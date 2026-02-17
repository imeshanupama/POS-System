import { initDatabase } from '../../src/db';
import db from '../../src/db';
import bcrypt from 'bcryptjs';

// Initialize DB (this creates tables if they don't exist)
initDatabase();

try {
    const adminUser = (db.prepare('SELECT * FROM users WHERE username = ?').get('admin')) as any;

    if (!adminUser) {
        // Default password: admin123
        const hashedPassword = bcrypt.hashSync('admin123', 10);
        db.prepare('INSERT INTO users (username, password, role) VALUES (?, ?, ?)')
            .run('admin', hashedPassword, 'admin');
        console.log('Default admin user created: admin / admin123');
    } else {
        console.log('Admin user already exists');
    }
} catch (error) {
    console.error('Error creating admin:', error);
}
