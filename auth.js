const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-change-in-production';

/**
 * Middleware to verify JWT token
 * Extracts token from Authorization header: "Bearer <token>"
 */
function verifyToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Không có token xác thực. Vui lòng đăng nhập.'
        });
    }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            if (err.name === 'TokenExpiredError') {
                return res.status(401).json({
                    success: false,
                    message: 'Token đã hết hạn. Vui lòng đăng nhập lại.'
                });
            }
            return res.status(403).json({
                success: false,
                message: 'Token không hợp lệ.'
            });
        }

        // Attach user info to request
        req.user = decoded;
        next();
    });
}

/**
 * Optional auth - doesn't block if no token, but attaches user if valid token exists
 */
function optionalAuth(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        req.user = null;
        return next();
    }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            req.user = null;
        } else {
            req.user = decoded;
        }
        next();
    });
}

/**
 * Check if user is admin
 */
function requireAdmin(req, res, next) {
    if (!req.user || !req.user.isAdmin) {
        return res.status(403).json({
            success: false,
            message: 'Bạn không có quyền truy cập trang này.'
        });
    }
    next();
}

/**
 * Generate JWT token for a user
 */
function generateToken(user) {
    return jwt.sign(
        {
            id: user.id,
            username: user.username,
            isAdmin: user.is_admin === 1 || user.isAdmin === true
        },
        JWT_SECRET,
        { expiresIn: '7d' } // Token expires in 7 days
    );
}

module.exports = {
    verifyToken,
    optionalAuth,
    requireAdmin,
    generateToken,
    JWT_SECRET
};
