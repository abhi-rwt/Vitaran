const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({

  name: {
    type: String,
    required: true
  },

  email: {
    type: String,
    required: true,
    unique: true   // 🔥 important (duplicate users fix)
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

  // 🔥 NAYI FIELDS ADD KAR - ye 5 line paste kar de
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
  
  photo: String

}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);