const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { verifyToken } = require('../middleware/auth');

// Helper function to generate referral code
function generateReferralCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

// Get referral stats for current user
router.get('/stats', verifyToken, async (req, res) => {
    try {
        const username = req.user.username;

        const [users] = await db.execute(
            'SELECT referral_code, total_referrals, total_commission FROM users WHERE username = ?',
            [username]
        );

        if (users.length === 0) {
            return res.json({ success: false, message: 'User not found' });
        }

        res.json({
            success: true,
            data: {
                referralCode: users[0].referral_code,
                totalReferrals: users[0].total_referrals || 0,
                totalCommission: parseFloat(users[0].total_commission) || 0
            }
        });
    } catch (error) {
        console.error('Get referral stats error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get list of referred users
router.get('/list', verifyToken, async (req, res) => {
    try {
        const username = req.user.username;

        const [referrals] = await db.execute(
            `SELECT username, email, balance, createdAt 
             FROM users 
             WHERE referred_by = ? 
             ORDER BY createdAt DESC`,
            [username]
        );

        res.json({
            success: true,
            data: referrals
        });
    } catch (error) {
        console.error('Get referral list error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get referral earnings history
router.get('/earnings', verifyToken, async (req, res) => {
    try {
        const username = req.user.username;

        const [earnings] = await db.execute(
            `SELECT * FROM referral_earnings 
             WHERE referrer_username = ? 
             ORDER BY created_at DESC 
             LIMIT 50`,
            [username]
        );

        res.json({
            success: true,
            data: earnings
        });
    } catch (error) {
        console.error('Get referral earnings error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Validate referral code (public endpoint for registration)
router.get('/validate/:code', async (req, res) => {
    try {
        const code = req.params.code;

        const [users] = await db.execute(
            'SELECT username FROM users WHERE referral_code = ?',
            [code]
        );

        if (users.length === 0) {
            return res.json({ success: false, message: 'Invalid referral code' });
        }

        res.json({
            success: true,
            data: {
                referrerUsername: users[0].username
            }
        });
    } catch (error) {
        console.error('Validate referral code error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
