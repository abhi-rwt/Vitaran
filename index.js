require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const path = require("path");
const Razorpay = require("razorpay");

const app = express();

/* ===================== MIDDLEWARE ===================== */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

/* ===================== ROOT ROUTE ===================== */
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "login.html"));
});

/* ===================== MONGODB ===================== */
mongoose.connect(process.env.MONGO_URI)
.then(() => console.log("🟢 MongoDB Connected (Vitaran DB)"))
.catch(err => {
  console.log("🔴 MongoDB Error:", err.message);
  process.exit(1);
});

/* ===================== USER MODEL ===================== */
const UserSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: {
    type: String,
    unique: true,
    required: true,
    lowercase: true,
    trim: true
  },
  phone: { type: String, required: true },
  password: { type: String, required: true },
  plan: { type: String, default: null }
}, { timestamps: true });

const User = mongoose.model("User", UserSchema);

/* ===================== EMAIL VALIDATION ===================== */
function validEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;
  return regex.test(email);
}

/* ===================== REGISTER ===================== */
app.post("/api/auth/register", async (req, res) => {
  try {
    let { name, email, phone, password } = req.body;

    if (!name || !email || !phone || !password)
      return res.json({ success: false, message: "All fields required" });

    email = email.toLowerCase().trim();

    if (!validEmail(email))
      return res.json({ success: false, message: "Invalid email format" });

    if (!/^\d{10}$/.test(phone))
      return res.json({ success: false, message: "Phone must be exactly 10 digits" });

    if (password.length < 6)
      return res.json({ success: false, message: "Password minimum 6 characters" });

    const exists = await User.findOne({ email });
    if (exists)
      return res.json({ success: false, message: "User already exists" });

    const hash = await bcrypt.hash(password, 10);

    await User.create({ name, email, phone, password: hash });

    res.json({ success: true });

  } catch (err) {
    console.log("Register Error:", err);
    res.status(500).json({ success: false });
  }
});

/* ===================== LOGIN ===================== */
app.post("/api/auth/login", async (req, res) => {
  try {
    let { email, password } = req.body;

    if (!email || !password)
      return res.json({ success: false, message: "Missing fields" });

    email = email.toLowerCase().trim();

    const user = await User.findOne({ email });
    if (!user)
      return res.json({ success: false, message: "User not found" });

    const match = await bcrypt.compare(password, user.password);
    if (!match)
      return res.json({ success: false, message: "Wrong password" });

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ success: true, token });

  } catch (err) {
    console.log("Login Error:", err);
    res.status(500).json({ success: false });
  }
});

/* ===================== GET CURRENT USER (FOR DASHBOARD CHECK) ===================== */
app.post("/api/auth/me", async (req, res) => {
  try {
    const { token } = req.body;

    if (!token)
      return res.json({ success: false });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user)
      return res.json({ success: false });

    res.json({
      success: true,
      user: {
        name: user.name,
        email: user.email,
        plan: user.plan
      }
    });

  } catch (err) {
    res.json({ success: false });
  }
});

/* ===================== RESET PASSWORD ===================== */
app.post("/api/auth/reset-password", async (req, res) => {
  try {
    let { email, newPassword } = req.body;

    if (!email || !newPassword)
      return res.json({ success: false, message: "All fields required" });

    email = email.toLowerCase().trim();

    const user = await User.findOne({ email });
    if (!user)
      return res.json({ success: false, message: "User not found" });

    if (newPassword.length < 6)
      return res.json({ success: false, message: "Password minimum 6 characters" });

    const hash = await bcrypt.hash(newPassword, 10);
    user.password = hash;
    await user.save();

    res.json({ success: true });

  } catch (err) {
    console.log("Reset Error:", err);
    res.status(500).json({ success: false });
  }
});

/* ===================== SUBSCRIPTION SAVE ===================== */
app.post("/api/subscription/save", async (req, res) => {
  try {
    const { token, plan } = req.body;

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    await User.findByIdAndUpdate(decoded.id, { plan });

    res.json({ success: true });

  } catch (err) {
    res.json({ success: false });
  }
});

/* ===================== RAZORPAY ===================== */
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

app.post("/api/payment/create-order", async (req, res) => {
  try {
    const { amount } = req.body;

    const order = await razorpay.orders.create({
      amount: amount * 100,
      currency: "INR",
      receipt: "vitaran_" + Date.now(),
    });

    res.json({
      status: "ok",
      key: process.env.RAZORPAY_KEY_ID,
      order,
    });

  } catch (err) {
    console.log("Payment Error:", err);
    res.json({ status: "error" });
  }
});

/* ===================== SERVER ===================== */
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Vitaran Server running on port ${PORT}`);
});