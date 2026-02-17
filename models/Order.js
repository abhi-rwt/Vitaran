const mongoose = require("mongoose");

const OrderSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  platform: String,
  orderId: String,
  distance: Number,
  profit: Number,
  status: String
});

module.exports = mongoose.model("Order", OrderSchema);
