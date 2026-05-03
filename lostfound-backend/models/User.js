const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({

name:String,
email:String,
password:String,

role:{
type:String,
default:"user"
},

points:{
type:Number,
default:0
},

googleId: {
  type: String,
  default: null
},

picture: {
  type: String,
  default: null
},

authProvider: {
  type: String,
  enum: ["local", "google"],
  default: "local"
}

});

module.exports = mongoose.model("User", userSchema);