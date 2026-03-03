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
  }

}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);