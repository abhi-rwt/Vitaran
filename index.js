require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const path = require("path");
const Razorpay = require("razorpay");

// 🔥 1. Yaha se User model import karo
const User = require("./models/User");
// 🔥 2. userRoutes import karo
const userRoutes = require("./routes/user");

const app = express();

/* ===================== MIDDLEWARE ===================== */
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static(path.join(__dirname, "public")));

/* ===================== ROOT ROUTE ===================== */
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "login.html"));
});

/* ===================== MONGODB CONNECTION ===================== */
mongoose.connect(process.env.MONGO_URI)
.then(() => console.log("🟢 MongoDB Connected (Vitaran DB)"))
.catch(err => {
  console.log("🔴 MongoDB Error:", err.message);
  process.exit(1);
});

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

/* ===================== GET CURRENT USER ===================== */
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

/* ===================== SUBSCRIPTION SAVE - NEW USER ===================== */
app.post("/api/subscription/save", async (req, res) => {
  try {
    const { token, plan } = req.body;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if(!user) return res.json({ success: false, error: "User not found" });

    // Agar already plan hai to upgrade route use karo
    if(user.plan) {
      return res.json({ success: false, error: "Use upgrade route for existing users" });
    }

    user.plan = plan;
    user.planActivatedAt = new Date();
    await user.save();

    res.json({ success: true, plan: plan });

  } catch (err) {
    console.log("Save plan error:", err);
    res.json({ success: false, error: err.message });
  }
});

/* ===================== SUBSCRIPTION UPGRADE - 🔥 FIXED MERGE LOGIC ===================== */
app.post("/api/subscription/upgrade", async (req, res) => {
  try {
    const { token, plan } = req.body;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if(!user) return res.json({ success: false, error: "User not found" });

    const currentPlan = user.plan ? user.plan.toLowerCase() : "";
    const newPlan = plan.toLowerCase();

    // Duration nikaal le: "Food 1 Month" -> "1 Month" 
    const planParts = plan.split(" ");
    const duration = planParts.slice(-2).join(" ");
    const categoryOnly = newPlan.replace(/ \d+ month.*/, '').trim(); // "food 1 month" -> "food"

    let finalPlan = plan; // default naya plan

    console.log("🔥 UPGRADE: Current:", currentPlan, "| New:", newPlan, "| Category:", categoryOnly);

    // 🔥 EXACT PLAN MERGE LOGIC
    if (currentPlan.includes("all-in-one")) {
      finalPlan = "All-in-One " + duration;
    }
    else if (currentPlan.includes("food-ecommerce") || currentPlan.includes("grocery-ecommerce")) {
      finalPlan = "All-in-One " + duration;
    }
    else if (currentPlan === 'both' || currentPlan.includes("both")) {
      finalPlan = "All-in-One " + duration;
    }
    // Food + Grocery = Both
    else if (currentPlan.includes("food") && !currentPlan.includes("ecommerce") && categoryOnly.includes("grocery")) {
      finalPlan = "Both " + duration;
    }
    else if (currentPlan.includes("grocery") && !currentPlan.includes("ecommerce") && categoryOnly.includes("food")) {
      finalPlan = "Both " + duration;
    }
    // Food + E-commerce = food-ecommerce
    else if (currentPlan.includes("food") && !currentPlan.includes("ecommerce") && categoryOnly.includes("e-commerce")) {
      finalPlan = "Food E-commerce " + duration;
    }
    else if (currentPlan.includes("e-commerce") && categoryOnly.includes("food")) {
      finalPlan = "Food E-commerce " + duration;
    }
    // Grocery + E-commerce = grocery-ecommerce
    else if (currentPlan.includes("grocery") && !currentPlan.includes("ecommerce") && categoryOnly.includes("e-commerce")) {
      finalPlan = "Grocery E-commerce " + duration;
    }
    else if (currentPlan.includes("e-commerce") && categoryOnly.includes("grocery")) {
      finalPlan = "Grocery E-commerce " + duration;
    }
    // Same plan click = no change
    else if (currentPlan.includes("food") && categoryOnly.includes("food") && !currentPlan.includes("ecommerce")) {
      finalPlan = "Food " + duration;
    }
    else if (currentPlan.includes("grocery") && categoryOnly.includes("grocery") && !currentPlan.includes("ecommerce")) {
      finalPlan = "Grocery " + duration;
    }
    else if (currentPlan.includes("e-commerce") && categoryOnly.includes("e-commerce")) {
      finalPlan = "E-commerce " + duration;
    }

    user.plan = finalPlan;
    user.planActivatedAt = new Date();
    await user.save();

    console.log("🔥 FINAL PLAN SAVED:", finalPlan);
    res.json({ success: true, plan: finalPlan, newPlan: finalPlan });

  } catch (err) {
    console.log("Upgrade plan error:", err);
    res.json({ success: false, error: err.message });
  }
});

/* ===================== RAZORPAY - 🔥 WAPAS ADD KIYA ===================== */
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

app.post("/api/payment/create-order", async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount) return res.json({ status: "error", message: "Amount required" });

    const order = await razorpay.orders.create({
      amount: amount * 100, // Paise mein
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
    res.json({ status: "error", message: err.message });
  }
});

// 🔥 3. NAYE USER ROUTES REGISTER KARO - YE LINE SABSE IMPORTANT HAI
app.use('/api/user', userRoutes);

/* =========================== RESET USERS (TEMP) ===========================
app.get("/reset-users", async (req,res)=>{
    try{
        await User.deleteMany({});
        res.send("All users deleted ✅");
    }catch(err){
        console.log("Reset Error:", err);
        res.send("Error ❌");
    }
});
============================================================================= */

/* ===================== SERVER ===================== */
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Vitaran Server running on port ${PORT}`);
});