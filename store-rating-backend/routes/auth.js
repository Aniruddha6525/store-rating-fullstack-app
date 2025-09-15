const express = require('express');
const router = express.Router();
const pool = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { userValidationRules, handleValidationErrors } = require('../middleware/validationMiddleware');

router.post('/register', userValidationRules, handleValidationErrors, async (req, res) => {
    const { name, email, password, address } = req.body;

    try {
        const userExists = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (userExists.rows.length > 0) {
            return res.status(400).json({ msg: 'User with this email already exists.' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = await pool.query(
            'INSERT INTO users (name, email, password, address) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role',
            [name, email, hashedPassword, address]
        );

        res.status(201).json({
            msg: 'User registered successfully!',
            user: newUser.rows[0],
        });

    } catch (err) {
        console.error("Full Error:", err);
        res.status(500).send('Server Error');
    }
});

router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (userResult.rows.length === 0) {
            return res.status(400).json({ msg: 'Invalid credentials.' });
        }
        const user = userResult.rows[0];

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Invalid credentials.' });
        }

        const payload = {
            user: {
                id: user.id,
                name: user.name,
                role: user.role
            },
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '5h' },
            (err, token) => {
                if (err) throw err;
                res.json({
                    msg: 'Login successful!',
                    token,
                    user: { id: user.id, name: user.name, role: user.role }
                });
            }
        );
    } catch (err) {
        console.error("Full Error:", err);
        res.status(500).send('Server Error');
    }
});

module.exports = router;

