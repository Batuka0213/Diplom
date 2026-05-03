const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema({
  title: String,
  description: String,
  location: String,
  type: String,
  image: String,
  contact: String,

  status: {
    type: String,
    enum: ["pending", "returned"],
    default: "pending"
  },

  category: {
    type: String,
    default: ""
  }

},{
timestamps:true
});

module.exports = mongoose.model("Item", itemSchema);