import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import User from "../models/User.js";

const router = express.Router();

// Signup
import 'dotenv/config';  // Ensure env variables are loaded
import crypto from "crypto";
import { sendConfirmationEmail, sendConfirmationCode } from "../utils/mailer.js";

// Log environment check on startup
console.log('Auth Route ENV check:', {
  EMAIL_USER: process.env.EMAIL_USER,
  EMAIL_PASS_LENGTH: process.env.EMAIL_PASS?.length || 0
});

// Helper function to generate 6-digit code
function generateConfirmationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

router.post("/signup", async (req, res) => {
  try {
    console.log('Starting signup process...');
    const { username, email, password } = req.body;
    console.log('Signup request for:', email);

    // Check if email is already registered
    const existing = await User.findOne({ email });
    if (existing) {
      console.log('Email already registered:', email);
      return res.status(409).json({ error: 'Email already in use' });
    }

    console.log('Hashing password...');
    const hashed = await bcrypt.hash(password, 10);
    
    // Generate a 6-digit confirmation code
    console.log('Generating confirmation code...');
    const confirmationCode = generateConfirmationCode();
    const confirmationCodeExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    
    console.log('Creating new user...');
    const user = new User({ 
      username, 
      email, 
      password: hashed, 
      confirmationCode,
      confirmationCodeExpires
    });
    await user.save();
    console.log('User saved successfully:', user._id);

    try {
      // Verify SMTP connection
      const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 587,
        secure: false,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
        debug: true
      });

      console.log('Verifying SMTP connection...');
      await transporter.verify();
      console.log('SMTP connection verified');

      console.log('Attempting to send confirmation code to:', email);
      const info = await sendConfirmationCode(email, confirmationCode);
      console.log('Confirmation code sent successfully:', {
        to: email,
        messageId: info.messageId || '(no id)',
        response: info.response || '(no response)'
      });

      return res.status(201).json({ 
        message: "User registered successfully. Please check your email for the confirmation code.",
        userId: user._id,
        email: user.email
      });
    } catch (mailErr) {
      console.error('Error sending confirmation code:', {
        email,
        error: mailErr.message || mailErr,
        stack: mailErr.stack
      });
      return res.status(201).json({ 
        message: "User registered but confirmation code failed to send. Please try resending the code.",
        userId: user._id,
        email: user.email
      });
    }
  } catch (err) {
    // Handle duplicate key errors
    if (err.code === 11000) {
      return res.status(409).json({ error: 'Email already in use' });
    }
    res.status(400).json({ error: err.message });
  }
});

// Login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ error: "User not found" });
  if (!user.isConfirmed) return res.status(403).json({ error: "Please confirm your email before logging in." });

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(400).json({ error: "Wrong password" });

  const token = jwt.sign({ 
    userId: user._id, 
    isAdmin: user.isAdmin 
  }, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: "1d" });
  
  res.json({ token, username: user.username, isAdmin: user.isAdmin });
});

// Verify confirmation code
router.post("/verify-code", async (req, res) => {
  try {
    const { email, code } = req.body;
    
    if (!email || !code) {
      return res.status(400).json({ error: "Email and code are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (user.isConfirmed) {
      return res.status(400).json({ error: "Email already confirmed" });
    }

    if (!user.confirmationCode || !user.confirmationCodeExpires) {
      return res.status(400).json({ error: "No confirmation code found. Please request a new one." });
    }

    // Check if code is expired
    if (new Date() > user.confirmationCodeExpires) {
      return res.status(400).json({ error: "Confirmation code has expired. Please request a new one." });
    }

    // Check if code matches
    if (user.confirmationCode !== code) {
      return res.status(400).json({ error: "Invalid confirmation code" });
    }

    // Confirm the user
    user.isConfirmed = true;
    user.confirmationCode = undefined;
    user.confirmationCodeExpires = undefined;
    await user.save();

    res.json({ message: "Email confirmed successfully! You can now log in." });
  } catch (err) {
    console.error('Error verifying code:', err);
    res.status(500).json({ error: "Server error during verification" });
  }
});

// Resend confirmation code
router.post("/resend-code", async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (user.isConfirmed) {
      return res.status(400).json({ error: "Email already confirmed" });
    }

    // Generate new code
    const confirmationCode = generateConfirmationCode();
    const confirmationCodeExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    user.confirmationCode = confirmationCode;
    user.confirmationCodeExpires = confirmationCodeExpires;
    await user.save();

    // Send the code
    try {
      await sendConfirmationCode(email, confirmationCode);
      res.json({ message: "New confirmation code sent successfully" });
    } catch (mailErr) {
      console.error('Error sending confirmation code:', mailErr);
      res.status(500).json({ error: "Failed to send confirmation code. Please try again." });
    }
  } catch (err) {
    console.error('Error resending code:', err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;

// Old email confirmation route (kept for backward compatibility)
router.get("/confirm/:token", async (req, res) => {
  const { token } = req.params;
  const user = await User.findOne({ confirmationToken: token });
  if (!user) {
    return res.status(400).send("Invalid or expired confirmation token.");
  }
  user.isConfirmed = true;
  user.confirmationToken = undefined;
  await user.save();
  res.send("Email confirmed! You can now log in.");
});
