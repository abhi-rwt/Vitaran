const mongoose = require("mongoose");

module.exports = mongoose.model("Subscription", new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  planType: String,
  status: { type: String, default: "active" }
}));
