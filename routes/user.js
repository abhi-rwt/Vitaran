const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const User = require('../models/User');

// GET /api/user/me - Dashboard ke liye user data
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      plan: user.plan,
      isVerified: user.isVerified,
      isFirstLogin: user.isFirstLogin
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/user/verify-profile - Modal submit karne par
router.post('/verify-profile', authMiddleware, async (req, res) => {
  try {
    const { idType, idNum, photo } = req.body;

    await User.findByIdAndUpdate(req.user.id, {
      isVerified: true,
      isFirstLogin: false, // 🔥 Ab kabhi modal nahi aayega
      idType: idType,
      idNumber: idNum,
      photo: photo
    });

    res.json({ success: true, message: 'Profile verified successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Verification failed' });
  }
});

module.exports = router;