// server/models/User.js
import mongoose from "mongoose";


const userSchema = new mongoose.Schema({
  username: { type: String, required: true }, // Removed unique: true to avoid conflicts with Google names, or we handle it in logic
  email:    { type: String, required: true, unique: true },
  password: { type: String }, // Removed required: true
  googleId: { type: String }, // Added googleId
  isConfirmed: { type: Boolean, default: false },
  isAdmin: { type: Boolean, default: false },
  confirmationToken: { type: String },
  confirmationCode: { type: String },
  confirmationCodeExpires: { type: Date }
});

export default mongoose.model("User", userSchema);
