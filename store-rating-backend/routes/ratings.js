const express = require('express');
const router = express.Router();
const pool = require('../db');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/', authMiddleware, async (req, res) => {
  const { store_id, rating } = req.body;
  const user_id = req.user.id; 

  if (rating < 1 || rating > 5) {
    return res.status(400).json({ msg: 'Rating must be between 1 and 5' });
  }

  try {
    const existingRating = await pool.query(
      'SELECT * FROM ratings WHERE user_id = $1 AND store_id = $2',
      [user_id, store_id]
    );

    let newRating;
    if (existingRating.rows.length > 0) {
      newRating = await pool.query(
        'UPDATE ratings SET rating = $1, created_at = NOW() WHERE user_id = $2 AND store_id = $3 RETURNING *',
        [rating, user_id, store_id]
      );
    } else {
      newRating = await pool.query(
        'INSERT INTO ratings (user_id, store_id, rating) VALUES ($1, $2, $3) RETURNING *',
        [user_id, store_id, rating]
      );
    }

    res.json(newRating.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
