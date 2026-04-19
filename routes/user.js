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

// GET /api/user/stats - 🔥 REAL DATA DB SE
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('totalOrders activeOrders completedOrders totalEarnings');
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });

    const stats = {
      totalOrders: user.totalOrders || 0,
      active: user.activeOrders || 0,
      completed: user.completedOrders || 0,
      earnings: user.totalEarnings || 0
    };

    res.json({ success: true, stats });
  } catch (err) {
    console.log('Stats Error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch stats' });
  }
});

// POST /api/user/update-stats - 🔥 NAYA ROUTE STATS UPDATE KE LIYE
router.post('/update-stats', authMiddleware, async (req, res) => {
  try {
    const { action, profit } = req.body;
    const user = await User.findById(req.user.id);
    
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });
    
    if(action === 'accept'){
      user.totalOrders += 1;
      user.activeOrders = 1;
    }
    else if(action === 'complete'){
      user.activeOrders = 0;
      user.completedOrders += 1;
      user.totalEarnings += profit || 0;
    }
    
    await user.save();
    res.json({ success: true });
  } catch (err) {
    console.log('Update Stats Error:', err);
    res.status(500).json({ success: false, error: 'Update failed' });
  }
});

// POST /api/user/verify-profile - Modal submit karne par
router.post('/verify-profile', authMiddleware, async (req, res) => {
  try {
    const { idType, idNum, photo } = req.body;

    if (!idType ||!idNum ||!photo) {
      return res.status(400).json({ success: false, error: 'All fields required' });
    }

    let isValid = false;
    if (idType === 'Aadhar') {
      isValid = /^\d{12}$/.test(idNum);
      if (!isValid) {
        return res.status(400).json({ success: false, error: 'Aadhar must be 12 digits only' });
      }
    } else if (idType === 'PAN') {
      isValid = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(idNum.toUpperCase());
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
      idNumber: idNum.toUpperCase(),
      photo: photo
    });

    res.json({ success: true, message: 'Profile verified successfully' });
  } catch (err) {
    console.log('Verify Error:', err);
    res.status(500).json({ success: false, error: 'Verification failed' });
  }
});

module.exports = router;