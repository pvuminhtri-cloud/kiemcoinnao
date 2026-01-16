const express = require('express');
const router = express.Router();
const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { verifyToken } = require('../middleware/auth');

const SALT_ROUNDS = 10;

// Helper function to escape HTML for XSS prevention
function escapeHtml(text) {
    if (!text) return text;
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.toString().replace(/[&<>"']/g, m => map[m]);
}

// Get Profile Endpoint - Protected
router.get('/:username', verifyToken, async (req, res) => {
    try {
        const requestedUsername = req.params.username;

        // Only allow users to view their own profile (unless admin)
        if (req.user.username !== requestedUsername && !req.user.isAdmin) {
            return res.status(403).json({
                success: false,
                message: 'Bạn không có quyền xem thông tin người dùng khác'
            });
        }

        const [rows] = await db.execute('SELECT * FROM users WHERE username = ?', [requestedUsername]);

        if (rows.length > 0) {
            const user = rows[0];
            delete user.password; // Do not send password to client
            res.json({ success: true, user: user });
        } else {
            res.status(404).json({ success: false, message: 'Người dùng không tồn tại' });
        }
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
    }
});

// Update Profile Endpoint - Protected
router.put('/:username', verifyToken, async (req, res) => {
    try {
        const currentUsername = req.params.username;
        const updates = req.body;

        // Only allow users to update their own profile (unless admin)
        if (req.user.username !== currentUsername && !req.user.isAdmin) {
            return res.status(403).json({
                success: false,
                message: 'Bạn không có quyền cập nhật thông tin người dùng khác'
            });
        }

        // Check if user exists
        const [users] = await db.execute('SELECT id FROM users WHERE username = ?', [currentUsername]);
        if (users.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        const userId = users[0].id;

        let usernameChanged = false;
        let newUsername = currentUsername;

        // Handle Username Change (Renaming)
        if (updates.username && updates.username !== currentUsername) {
            const [existing] = await db.execute('SELECT id FROM users WHERE username = ?', [updates.username]);
            if (existing.length > 0) {
                return res.json({ success: false, message: 'Tên tài khoản mới đã tồn tại' });
            }
            usernameChanged = true;
            newUsername = updates.username;
        }

        // Dynamic Update Query construction
        // Note: email and phone are NOT allowed to be changed after registration
        const allowedFields = [
            'username',
            'bank_name', 'bank_account', 'bank_account_name',
            'profile_picture'
        ];

        const fieldsToUpdate = [];
        const values = [];

        for (const [key, value] of Object.entries(updates)) {
            if (allowedFields.includes(key)) {
                // Sanitize string inputs
                const sanitizedValue = typeof value === 'string' ? escapeHtml(value) : value;
                fieldsToUpdate.push(`${key} = ?`);
                values.push(sanitizedValue);
            }
        }

        // Handle password change separately (needs hashing)
        if (updates.password && updates.password.length >= 6) {
            const hashedPassword = await bcrypt.hash(updates.password, SALT_ROUNDS);
            fieldsToUpdate.push('password = ?');
            values.push(hashedPassword);
        }

        if (fieldsToUpdate.length === 0) {
            return res.json({ success: true, message: 'Không có thay đổi nào' });
        }

        values.push(userId); // Add ID for WHERE clause

        const sql = `UPDATE users SET ${fieldsToUpdate.join(', ')} WHERE id = ?`;

        await db.execute(sql, values);

        // If username changed, generate new JWT token
        const response = { success: true, message: 'Cập nhật thành công' };

        if (usernameChanged) {
            const token = jwt.sign(
                { username: newUsername, userId: userId },
                process.env.JWT_SECRET,
                { expiresIn: '7d' }
            );
            response.token = token;
            response.newUsername = newUsername;
        }

        res.json(response);

    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ success: false, message: 'Lỗi máy chủ: ' + error.message });
    }
});

module.exports = router;
