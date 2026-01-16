const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../config/db');
const { generateToken } = require('../middleware/auth');

const SALT_ROUNDS = 10;

// Register Endpoint
router.post('/register', async (req, res) => {
    try {
        const { username, email, phone, password, ip, referralCode } = req.body;

        // Input validation
        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: 'Tên tài khoản và mật khẩu là bắt buộc'
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Mật khẩu phải có ít nhất 6 ký tự'
            });
        }

        // Check if user already exists (username, email, or phone)
        const [existing] = await db.execute(
            'SELECT id FROM users WHERE username = ? OR email = ? OR (phone != "" AND phone = ?)',
            [username, email || '', phone || '']
        );

        if (existing.length > 0) {
            return res.json({
                success: false,
                message: 'Tài khoản, email hoặc số điện thoại đã tồn tại'
            });
        }

        // Validate referral code if provided
        let referrerUsername = null;
        if (referralCode) {
            const [referrer] = await db.execute(
                'SELECT username FROM users WHERE referral_code = ?',
                [referralCode]
            );

            if (referrer.length > 0) {
                referrerUsername = referrer[0].username;

                // Prevent self-referral
                if (referrerUsername === username) {
                    return res.json({
                        success: false,
                        message: 'Không thể tự giới thiệu chính mình'
                    });
                }
            }
        }

        // Generate unique referral code for new user
        let newReferralCode;
        let codeExists = true;
        while (codeExists) {
            newReferralCode = generateReferralCode();
            const [check] = await db.execute(
                'SELECT id FROM users WHERE referral_code = ?',
                [newReferralCode]
            );
            codeExists = check.length > 0;
        }

        // Hash password with bcrypt
        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

        // Insert new user with hashed password and referral info
        await db.execute(
            `INSERT INTO users 
             (username, email, phone, password, last_ip, referral_code, referred_by, created_at) 
             VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
            [username, email || '', phone || '', hashedPassword, ip || 'N/A', newReferralCode, referrerUsername]
        );

        // Update referrer's total_referrals count
        if (referrerUsername) {
            await db.execute(
                'UPDATE users SET total_referrals = total_referrals + 1 WHERE username = ?',
                [referrerUsername]
            );
        }

        res.json({ success: true, message: 'Đăng ký thành công' });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ success: false, message: 'Lỗi máy chủ: ' + error.message });
    }
});

// Helper function to generate referral code
function generateReferralCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

// Login Endpoint
router.post('/login', async (req, res) => {
    try {
        const { identifier, password, ip } = req.body;

        // Input validation
        if (!identifier || !password) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng nhập tài khoản và mật khẩu'
            });
        }

        // Find user by username, email, or phone (without password in query)
        const [rows] = await db.execute(
            'SELECT * FROM users WHERE username = ? OR email = ? OR (phone != "" AND phone = ?)',
            [identifier, identifier, identifier]
        );

        if (rows.length === 0) {
            return res.json({
                success: false,
                message: 'Tài khoản hoặc mật khẩu không chính xác'
            });
        }

        const user = rows[0];

        // Compare password with bcrypt
        const isValidPassword = await bcrypt.compare(password, user.password);

        if (!isValidPassword) {
            return res.json({
                success: false,
                message: 'Tài khoản hoặc mật khẩu không chính xác'
            });
        }

        // Update IP
        await db.execute('UPDATE users SET last_ip = ? WHERE id = ?', [ip || 'N/A', user.id]);

        // Generate JWT token
        const token = generateToken(user);

        // Remove password from response
        delete user.password;

        res.json({
            success: true,
            user: user,
            token: token,
            isAdmin: user.is_admin === 1
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
    }
});

// Verify Token Endpoint (for frontend to check if token is still valid)
router.get('/verify', (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.json({ success: false, message: 'Không có token' });
    }

    const jwt = require('jsonwebtoken');
    const { JWT_SECRET } = require('../middleware/auth');

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.json({ success: false, message: 'Token không hợp lệ hoặc đã hết hạn' });
        }
        res.json({ success: true, user: decoded });
    });
});

module.exports = router;
