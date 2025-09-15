const jwt = require('jsonwebtoken');

module.exports = function(req, res, next) {
    // This middleware should run AFTER the standard authMiddleware,
    // so we can trust that req.user exists.

    try {
        // Check if the user object and role exist
        if (!req.user || !req.user.role) {
            return res.status(403).json({ msg: 'Access denied. User role not found.' });
        }

        // Check if the user's role is 'System Administrator'
        if (req.user.role !== 'System Administrator') {
            return res.status(403).json({ msg: 'Access denied. Administrator privileges required.' });
        }

        // If the user is an admin, proceed to the next function (the route handler)
        next();
    } catch (err) {
        // This will catch any unexpected errors
        console.error('Error in admin middleware:', err.message);
        res.status(500).json({ msg: 'Server Error in admin verification' });
    }
};

