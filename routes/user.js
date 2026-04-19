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
      isFirstLogin: user.isFirstLogin,
      idType: user.idType,
      idNumber: user.idNumber,
      photo: user.photo
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// 🔥 NAYA ROUTE: GET /api/user/stats - Dashboard stats ke liye
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    // Abhi dummy data. Baad mein Order model se real data aayega
    const stats = {
      totalOrders: 0,
      active: 0,
      completed: 0,
      earnings: 0
    };

    // Jab Order model banega to ye use karna:
    // const userId = req.user.id;
    // const totalOrders = await Order.countDocuments({ userId });
    // const active = await Order.countDocuments({ userId, status: 'active' });
    // const completed = await Order.countDocuments({ userId, status: 'completed' });
    // const earningsData = await Order.aggregate([
    // { $match: { userId: new mongoose.Types.ObjectId(userId), status: 'completed' } },
    // { $group: { _id: null, total: { $sum: '$profit' } } }
    // ]);
    // stats.earnings = earningsData[0]?.total || 0;

    res.json({ success: true, stats });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch stats' });
  }
});

// POST /api/user/verify-profile - Modal submit karne par
router.post('/verify-profile', authMiddleware, async (req, res) => {
  try {
    const { idType, idNum, photo } = req.body;

    if (!idType ||!idNum ||!photo) {
      return res.status(400).json({ success: false, error: 'All fields required' });
    }

    // 🔥 VALIDATION ADD KIYA: Aadhar/PAN check
    let isValid = false;
    if (idType === 'Aadhar') {
      isValid = /^\d{12}$/.test(idNum); // 12 digit only
      if (!isValid) {
        return res.status(400).json({ success: false, error: 'Aadhar must be 12 digits only' });
      }
    } else if (idType === 'PAN') {
      isValid = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(idNum.toUpperCase()); // ABCDE1234F
      if (!isValid) {
        return res.status(400).json({ success: false, error: 'Invalid PAN format. Use: ABCDE1234F' });
      }
    } else {
      return res.status(400).json({ success: false, error: 'Invalid ID type' });
    }

    await User.findByIdAndUpdate(req.user.id, {
      isVerified: true,
      isFirstLogin: false,
      idType: idType,
      idNumber: idNum.toUpperCase(), // PAN hamesha uppercase mein save hoga
      photo: photo
    });

    res.json({ success: true, message: 'Profile verified successfully' });
  } catch (err) {
    console.log('Verify Error:', err);
    res.status(500).json({ success: false, error: 'Verification failed' });
  }
});

module.exports = router;