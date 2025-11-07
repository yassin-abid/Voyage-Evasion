import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import User from "../models/User.js";

const router = express.Router();

// Signup
import 'dotenv/config';  // Ensure env variables are loaded
import crypto from "crypto";
import { sendConfirmationEmail } from "../utils/mailer.js";

// Log environment check on startup
console.log('Auth Route ENV check:', {
  EMAIL_USER: process.env.EMAIL_USER,
  EMAIL_PASS_LENGTH: process.env.EMAIL_PASS?.length || 0
});

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
    
    // Generate a confirmation token
    console.log('Generating confirmation token...');
    const confirmationToken = crypto.randomBytes(32).toString("hex");
    
    console.log('Creating new user...');
    const user = new User({ username, email, password: hashed, confirmationToken });
    await user.save();
    console.log('User saved successfully:', user._id);

    // Verify mailer configuration before sending
    console.log('Verifying mailer configuration...');

    try {
      // Use the same transporter verification as test-mail.js
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

      console.log('Attempting to send confirmation email to:', email);
      const info = await sendConfirmationEmail(email, confirmationToken);
      console.log('Confirmation email sent successfully:', {
        to: email,
        messageId: info.messageId || '(no id)',
        response: info.response || '(no response)'
      });

      return res.status(201).json({ 
        message: "User registered successfully. Please check your email to confirm your account.",
        userId: user._id
      });
    } catch (mailErr) {
      // Email failed to send but user exists. Inform the client to contact admin or retry.
      console.error('Error sending confirmation email:', {
        email,
        error: mailErr.message || mailErr,
        stack: mailErr.stack
      });
      return res.status(201).json({ 
        message: "User registered but confirmation email failed to send. Please contact support or try resending the confirmation later.",
        userId: user._id
      });
    }
  } catch (err) {
    // Handle duplicate key errors (race or unique index)
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

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1d" });
  res.json({ token, username: user.username });
});

export default router;

// Email confirmation route
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
