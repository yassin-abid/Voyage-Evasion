// server/models/User.js
import mongoose from "mongoose";


const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email:    { type: String, required: true, unique: true },
  password: { type: String, required: true },
  isConfirmed: { type: Boolean, default: false },
  confirmationToken: { type: String },
  confirmationCode: { type: String },
  confirmationCodeExpires: { type: Date }
});

export default mongoose.model("User", userSchema);
