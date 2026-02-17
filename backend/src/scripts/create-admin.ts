import { initDatabase } from '../db';
import db from '../db';
import bcrypt from 'bcryptjs';

initDatabase();

try {
    const adminUser = db.prepare('SELECT * FROM users WHERE username = ?').get('admin');

    if (!adminUser) {
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
