const { check, validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const extractedErrors = errors.array().map(err => ({
            param: err.param, 
            msg: err.msg
        }));
        return res.status(400).json({ errors: extractedErrors });
    }
    next(); 
};

const userValidationRules = [
    check('name', 'Name must be between 20 and 60 characters.')
        .isLength({ min: 20, max: 60 })
        .trim()
        .escape(),

    check('email', 'Please include a valid email.')
        .isEmail()
        .normalizeEmail(),

    check('password', 'Password must be 8-16 characters and include one uppercase letter and one special character.')
        .isLength({ min: 8, max: 16 })
        .matches(/^(?=.*[A-Z])(?=.*[!@#$&*]).*$/, "i"),

    check('address', 'Address must not exceed 400 characters.')
        .isLength({ max: 400 })
        .trim()
        .escape()
];

module.exports = {
    userValidationRules,
    handleValidationErrors
};

