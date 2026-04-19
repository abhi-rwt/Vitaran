const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  try {
    // 'SECRET' ko apne.env file ke JWT_SECRET se replace kar dena
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'SECRET');
    req.user = decoded; // isme { id: userId } aayega
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};