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

    if (!name ||!email ||!phone ||!password)
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

    if (!email ||!password)
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

    if (!email ||!newPassword)
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

/* ===================== SUBSCRIPTION UPGRADE - 🔥 100% WORKING MERGE ===================== */
app.post("/api/subscription/upgrade", async (req, res) => {
  try {
    const { token, plan } = req.body;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if(!user) return res.json({ success: false, error: "User not found" });

    // 🔥 Purana plan aur naya plan - duration hata ke sirf category nikalo
    const getCategory = (planStr) => {
      if (!planStr) return "";
      const p = planStr.toLowerCase();
      if (p.includes("all-in-one")) return "allinone";
      if (p.includes("food") && p.includes("e-commerce")) return "food-ecommerce";
      if (p.includes("grocery") && p.includes("e-commerce")) return "grocery-ecommerce";
      if (p.includes("both")) return "both";
      if (p.includes("food")) return "food";
      if (p.includes("grocery")) return "grocery";
      if (p.includes("e-commerce")) return "ecommerce";
      return "";
    };

    const currentCategory = getCategory(user.plan);
    const newCategory = getCategory(plan);

    // Duration nikalo
    const durationMatch = plan.match(/\d+\s*Month/i);
    const duration = durationMatch? durationMatch[0] : "1 Month";

    console.log("🔥 Current:", user.plan, "->", currentCategory);
    console.log("🔥 New:", plan, "->", newCategory);

    let finalPlan = plan;

    // 🔥 MERGE RULES
    if (currentCategory === "allinone") {
      finalPlan = `All-in-One ${duration}`;
    }
    else if (currentCategory === "food-ecommerce" || currentCategory === "grocery-ecommerce") {
      finalPlan = `All-in-One ${duration}`;
    }
    else if (currentCategory === "both") {
      finalPlan = `All-in-One ${duration}`;
    }
    // Food + Grocery = Both
    else if ((currentCategory === "food" && newCategory === "grocery") ||
             (currentCategory === "grocery" && newCategory === "food")) {
      finalPlan = `Both ${duration}`;
    }
    // Food + E-commerce = Food E-commerce
    else if ((currentCategory === "food" && newCategory === "ecommerce") ||
             (currentCategory === "ecommerce" && newCategory === "food")) {
      finalPlan = `Food E-commerce ${duration}`;
    }
    // Grocery + E-commerce = Grocery E-commerce
    else if ((currentCategory === "grocery" && newCategory === "ecommerce") ||
             (currentCategory === "ecommerce" && newCategory === "grocery")) {
      finalPlan = `Grocery E-commerce ${duration}`;
    }
    // Both + E-commerce = All-in-One
    else if ((currentCategory === "both" && newCategory === "ecommerce") ||
             (currentCategory === "ecommerce" && newCategory === "both")) {
      finalPlan = `All-in-One ${duration}`;
    }
    // Food E-commerce + Grocery = All-in-One
    else if ((currentCategory === "food-ecommerce" && newCategory === "grocery") ||
             (currentCategory === "grocery" && newCategory === "food-ecommerce")) {
      finalPlan = `All-in-One ${duration}`;
    }
    // Grocery E-commerce + Food = All-in-One
    else if ((currentCategory === "grocery-ecommerce" && newCategory === "food") ||
             (currentCategory === "food" && newCategory === "grocery-ecommerce")) {
      finalPlan = `All-in-One ${duration}`;
    }

    user.plan = finalPlan;
    user.planActivatedAt = new Date();
    await user.save();

    console.log("🔥 ✅ FINAL PLAN SAVED:", finalPlan);
    res.json({ success: true, plan: finalPlan, newPlan: finalPlan });

  } catch (err) {
    console.log("Upgrade plan error:", err);
    res.json({ success: false, error: err.message });
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