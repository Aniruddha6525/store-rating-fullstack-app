const express = require('express');
const router = express.Router();
const pool = require('../db');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/', authMiddleware, async (req, res) => {
    const userId = req.user.id;
    const { name, address } = req.query;

    try {
        let queryParams = [userId];
        let whereClauses = [];

        let queryText = `
            SELECT 
                s.id, 
                s.name, 
                s.address,
                COALESCE(ROUND(AVG(r.rating), 2), 0) AS average_rating,
                (SELECT rating FROM ratings WHERE user_id = $1 AND store_id = s.id) AS user_rating
            FROM 
                stores s
            LEFT JOIN 
                ratings r ON s.id = r.store_id
        `;

        if (name) {
            queryParams.push(`%${name}%`);
            whereClauses.push(`s.name ILIKE $${queryParams.length}`);
        }
        if (address) {
            queryParams.push(`%${address}%`);
            whereClauses.push(`s.address ILIKE $${queryParams.length}`);
        }

        if (whereClauses.length > 0) {
            queryText += ` WHERE ${whereClauses.join(' AND ')}`;
        }
        
        queryText += `
            GROUP BY 
                s.id, s.name, s.address
            ORDER BY 
                s.name;
        `;

        const stores = await pool.query(queryText, queryParams);
        res.json(stores.rows);
    } catch (err) {
        console.error("Error fetching stores:", err);
        res.status(500).send('Server Error');
    }
});


router.get('/owner-dashboard', authMiddleware, async (req, res) => {
    const ownerId = req.user.id;

    try {
        const storeResult = await pool.query('SELECT * FROM stores WHERE owner_id = $1', [ownerId]);

        if (storeResult.rows.length === 0) {
            return res.status(404).json({ msg: 'You do not own a store.' });
        }
        const store = storeResult.rows[0];

        const avgRatingResult = await pool.query(
            'SELECT COALESCE(ROUND(AVG(rating), 2), 0) as average FROM ratings WHERE store_id = $1',
            [store.id]
        );
        const averageRating = avgRatingResult.rows[0].average;

        const ratersResult = await pool.query(
            `SELECT u.name, u.email, r.rating 
             FROM ratings r 
             JOIN users u ON r.user_id = u.id 
             WHERE r.store_id = $1 
             ORDER BY r.created_at DESC`,
            [store.id]
        );
        
        res.json({
            storeName: store.name, 
            averageRating: averageRating,
            raters: ratersResult.rows,
        });

    } catch (err) {
        console.error("Owner Dashboard Error:", err);
        res.status(500).send('Server Error');
    }
});


module.exports = router;

