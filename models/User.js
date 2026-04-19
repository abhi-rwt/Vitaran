const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },

  email: {
    type: String,
    required: true,
    unique: true
  },

  phone: String,

  password: {
    type: String,
    required: true
  },

  plan: {
    type: String,
    default: null
  },

  isVerified: { 
    type: Boolean, 
    default: false 
  },
  
  isFirstLogin: { 
    type: Boolean, 
    default: true 
  },
  
  idType: String,
  
  idNumber: String,
  
  photo: String,

  // 🔥 STATS FIELDS - PERMANENT STORAGE
  totalOrders: { 
    type: Number, 
    default: 0 
  },
  
  activeOrders: { 
    type: Number, 
    default: 0 
  },
  
  completedOrders: { 
    type: Number, 
    default: 0 
  },
  
  totalEarnings: { 
    type: Number, 
    default: 0 
  }

}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);