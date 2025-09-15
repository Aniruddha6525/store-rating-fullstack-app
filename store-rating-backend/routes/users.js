const express = require('express');
const router = express.Router();
const pool = require('../db');
const bcrypt = require('bcryptjs');
const authMiddleware = require('../middleware/authMiddleware');


router.put('/password', authMiddleware, async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    try {
        const userResult = await pool.query('SELECT password FROM users WHERE id = $1', [userId]);
        
        if (userResult.rows.length === 0) {
            return res.status(404).json({ msg: 'User not found.' });
        }
        const user = userResult.rows[0];

        if (!user.password) {
            console.error(`User with ID ${userId} has no password field in the database.`);
            return res.status(500).json({ msg: 'Server configuration error.' });
        }

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Incorrect current password.' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedNewPassword = await bcrypt.hash(newPassword, salt);

        await pool.query('UPDATE users SET password = $1 WHERE id = $2', [hashedNewPassword, userId]);
        res.json({ msg: 'Password updated successfully.' });

    } catch (err) {
        console.error("---------- ERROR UPDATING PASSWORD ----------");
        console.error("Full Error:", err);
        res.status(500).send('Server Error');
    }
});

module.exports = router;

