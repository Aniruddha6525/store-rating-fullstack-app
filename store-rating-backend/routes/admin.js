const express = require('express');
const router = express.Router();
const pool = require('../db');
const bcrypt = require('bcryptjs');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');
const { userValidationRules, handleValidationErrors } = require('../middleware/validationMiddleware');

router.use(authMiddleware, adminMiddleware);

router.get('/stats', async (req, res) => {
    try {
        const userCount = await pool.query('SELECT COUNT(*) FROM users');
        const storeCount = await pool.query('SELECT COUNT(*) FROM stores');
        const ratingCount = await pool.query('SELECT COUNT(*) FROM ratings');
        res.json({
            users: parseInt(userCount.rows[0].count, 10),
            stores: parseInt(storeCount.rows[0].count, 10),
            ratings: parseInt(ratingCount.rows[0].count, 10),
        });
    } catch (err) {
        console.error("Full Error:", err);
        res.status(500).send('Server Error');
    }
});


router.get('/users', async (req, res) => {
    const { name, email, role } = req.query;
    try {
        let queryParams = [];
        let whereClauses = [];
        let queryText = `
            SELECT 
                u.id, u.name, u.email, u.address, u.role,
                s.name as store_name,
                COALESCE(ROUND(AVG(r.rating), 2), 0) AS store_rating
            FROM users u
            LEFT JOIN stores s ON u.id = s.owner_id
            LEFT JOIN ratings r ON s.id = r.store_id
        `;
        if (name) {
            queryParams.push(`%${name}%`);
            whereClauses.push(`u.name ILIKE $${queryParams.length}`);
        }
        if (email) {
            queryParams.push(`%${email}%`);
            whereClauses.push(`u.email ILIKE $${queryParams.length}`);
        }
        if (role) {
            queryParams.push(role);
            whereClauses.push(`u.role = $${queryParams.length}`);
        }
        if (whereClauses.length > 0) {
            queryText += ` WHERE ${whereClauses.join(' AND ')}`;
        }
        queryText += ' GROUP BY u.id, u.name, u.email, u.address, u.role, s.name ORDER BY u.name';
        const users = await pool.query(queryText, queryParams);
        res.json(users.rows);
    } catch (err) {
        console.error("Full Error:", err);
        res.status(500).send('Server Error');
    }
});


router.get('/stores', async (req, res) => {
    const { name, email, address } = req.query;
    try {
        let queryParams = [];
        let whereClauses = [];
        let queryText = `
            SELECT 
                s.id, s.name, s.email, s.address, s.owner_id,
                u.name as owner_name,
                COALESCE(ROUND(AVG(r.rating), 2), 0) AS average_rating
            FROM stores s
            LEFT JOIN ratings r ON s.id = r.store_id
            LEFT JOIN users u ON s.owner_id = u.id
        `;
        if (name) {
            queryParams.push(`%${name}%`);
            whereClauses.push(`s.name ILIKE $${queryParams.length}`);
        }
        if (email) {
            queryParams.push(`%${email}%`);
            whereClauses.push(`s.email ILIKE $${queryParams.length}`);
        }
        if (address) {
            queryParams.push(`%${address}%`);
            whereClauses.push(`s.address ILIKE $${queryParams.length}`);
        }
        if (whereClauses.length > 0) {
            queryText += ` WHERE ${whereClauses.join(' AND ')}`;
        }
        queryText += ` GROUP BY s.id, s.name, s.email, s.address, s.owner_id, u.name ORDER BY s.name`;
        const stores = await pool.query(queryText, queryParams);
        res.json(stores.rows);
    } catch (err) {
        console.error("Full Error:", err);
        res.status(500).send('Server Error');
    }
});


router.post('/users', userValidationRules, handleValidationErrors, async (req, res) => {
    const { name, email, password, address, role, store_id } = req.body;
    try {
        const userExists = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (userExists.rows.length > 0) {
            return res.status(400).json({ msg: 'User with this email already exists.' });
        }
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const newUserResult = await pool.query(
            'INSERT INTO users (name, email, password, address, role) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, role',
            [name, email, hashedPassword, address, role]
        );
        const newUser = newUserResult.rows[0];
        if (role === 'Store Owner' && store_id) {
            await pool.query('UPDATE stores SET owner_id = $1 WHERE id = $2', [newUser.id, store_id]);
        }
        res.status(201).json(newUser);
    } catch (err) {
        console.error("Full Error:", err);
        res.status(500).send('Server Error');
    }
});


router.post('/stores', async (req, res) => {
    const { name, email, address, owner_id } = req.body;
    try {
        const storeExists = await pool.query('SELECT * FROM stores WHERE email = $1', [email]);
        if (storeExists.rows.length > 0) {
            return res.status(400).json({ msg: 'Store with this email already exists.' });
        }
        const newStore = await pool.query(
            'INSERT INTO stores (name, email, address, owner_id) VALUES ($1, $2, $3, $4) RETURNING *',
            [name, email, address, owner_id]
        );
        if(owner_id) {
            await pool.query("UPDATE users SET role = 'Store Owner' WHERE id = $1", [owner_id]);
        }
        res.status(201).json(newStore.rows[0]);
    } catch (err) {
        console.error("Full Error:", err);
        res.status(500).send('Server Error');
    }
});

module.exports = router;

