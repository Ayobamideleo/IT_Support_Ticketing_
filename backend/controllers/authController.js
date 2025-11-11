import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import dotenv from "dotenv";
import crypto from 'crypto';
import { sendVerificationEmail } from '../services/emailService.js';

dotenv.config();

// Simple in-memory rate limiter for resend verification to prevent abuse per email
// Cooldown: 60s between sends; Max 5 sends per rolling hour
const resendTracker = new Map(); // email -> { lastSentAt: number, windowStart: number, count: number }

export const registerUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email and password are required" });
    }

    // check if user exists
    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res.status(400).json({ message: "User with that email already exists" });
    }

    // hash password
    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);

    const user = await User.create({ name, email, password: hashed, role });

    // create verification code and expiration
    const code = String(crypto.randomInt(100000, 999999));
    const expires = new Date(Date.now() + (15 * 60 * 1000)); // 15 minutes
    user.verificationCode = code;
    user.verificationExpires = expires;
    await user.save();

    // send email (dev: console log via service mock; prod: replace with real provider in emailService)
    try {
      await sendVerificationEmail(email, code, expires);
    } catch (e) {
      console.warn('sendVerificationEmail failed:', e?.message || e);
    }

    // sign a JWT for convenience but mark as unverified
    const payload = { id: user.id, email: user.email, role: user.role, name: user.name };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1h" });

    // Return token but indicate verification required. Include code in response only in non-production for testing.
    const response = { message: "User registered. Verification code sent.", user: payload, token };
    if (process.env.NODE_ENV !== 'production') response.verificationCode = code;
    res.status(201).json(response);
  } catch (error) {
    console.error("Register error:", error);
    if (process.env.NODE_ENV === 'production') {
      return res.status(500).json({ message: "Unexpected server error, please try again later" });
    }
    return res.status(500).json({ message: "Unexpected server error, please try again later", error: error.message });
  }
};

export const verifyUser = async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) return res.status(400).json({ message: 'Email and code are required' });

    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.isVerified) return res.status(200).json({ message: 'User already verified' });

    if (!user.verificationCode || !user.verificationExpires) return res.status(400).json({ message: 'No verification code found. Request a new one.' });

    if (new Date() > new Date(user.verificationExpires)) return res.status(400).json({ message: 'Verification code expired' });

    if (String(code) !== String(user.verificationCode)) return res.status(400).json({ message: 'Invalid verification code' });

    user.isVerified = true;
    user.verificationCode = null;
    user.verificationExpires = null;
    await user.save();

    res.status(200).json({ message: 'Account verified' });
  } catch (err) {
    console.error('Verify user error:', err);
    return res.status(500).json({ message: 'Unexpected server error', error: err.message });
  }
};

export const resendVerification = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.isVerified) return res.status(400).json({ message: 'Account already verified' });

    const now = Date.now();
    const entry = resendTracker.get(email) || { lastSentAt: 0, windowStart: now, count: 0 };
    // 60s cooldown
    const cooldownMs = 60 * 1000;
    if (now - entry.lastSentAt < cooldownMs) {
      const retryAfter = Math.ceil((cooldownMs - (now - entry.lastSentAt)) / 1000);
      return res.status(429).json({ message: `Please wait ${retryAfter}s before requesting another code` });
    }
    // 1 hour window with max 5 sends
    const windowMs = 60 * 60 * 1000;
    if (now - entry.windowStart > windowMs) {
      entry.windowStart = now;
      entry.count = 0;
    }
    if (entry.count >= 5) {
      return res.status(429).json({ message: 'Too many requests. Try again later.' });
    }

    // Generate a new code and extend expiry
    const code = String(crypto.randomInt(100000, 999999));
    const expires = new Date(now + (15 * 60 * 1000));
    user.verificationCode = code;
    user.verificationExpires = expires;
    await user.save();

    // Update tracker
    entry.lastSentAt = now;
    entry.count += 1;
    resendTracker.set(email, entry);

    // Log and send email via emailService
    try {
      if (req?.log?.info) {
        req.log.info({ email, expires: expires.toISOString() }, 'Resent verification code');
      }
      await sendVerificationEmail(email, code, expires);
    } catch {}

    const response = { message: 'Verification code resent' };
    if (process.env.NODE_ENV !== 'production') response.verificationCode = code;
    return res.status(200).json(response);
  } catch (err) {
    console.error('Resend verification error:', err);
    return res.status(500).json({ message: 'Unexpected server error', error: err.message });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

    // require email verification
    if (!user.isVerified) {
      return res.status(403).json({ message: 'Account not verified. Please verify your email.' });
    }

    // Update last login timestamp
    user.lastLoginAt = new Date();
    await user.save();

    const payload = { id: user.id, email: user.email, role: user.role, name: user.name };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1h" });

    res.status(200).json({ message: "Login successful", user: payload, token });
  } catch (error) {
    console.error("Login error:", error);
    if (process.env.NODE_ENV === 'production') {
      return res.status(500).json({ message: "Unexpected server error, please try again later" });
    }
    return res.status(500).json({ message: "Unexpected server error, please try again later", error: error.message });
  }
};

// ✅ Get currently authenticated user (requires a valid JWT)
export const getCurrentUser = (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: "Not authenticated" });
  }

  // Return the decoded token payload (user info)
  res.status(200).json({ user: req.user });
};

// Forgot Password - Generate reset code
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const user = await User.findOne({ where: { email } });
    
    // For security, always return success message even if user doesn't exist
    if (!user) {
      return res.status(200).json({ 
        message: 'If an account exists with this email, you will receive password reset instructions.' 
      });
    }

    // Generate 6-digit reset code
    const resetCode = String(crypto.randomInt(100000, 999999));
    const resetExpires = new Date(Date.now() + (15 * 60 * 1000)); // 15 minutes

    user.verificationCode = resetCode;
    user.verificationExpires = resetExpires;
    await user.save();

    // Send reset code via email
    try {
      console.log(`🔑 Password Reset Code for ${email}: ${resetCode}`);
      console.log(`   Expires at: ${resetExpires.toLocaleString()}`);
      // TODO: Replace with actual email service
      // await sendPasswordResetEmail(email, resetCode, resetExpires);
    } catch (e) {
      console.warn('sendPasswordResetEmail failed:', e?.message || e);
    }

    const response = { 
      message: 'If an account exists with this email, you will receive password reset instructions.' 
    };
    
    // Include code in dev mode for testing
    if (process.env.NODE_ENV !== 'production') {
      response.resetCode = resetCode;
    }

    res.status(200).json(response);
  } catch (err) {
    console.error('Forgot password error:', err);
    return res.status(500).json({ message: 'Unexpected server error', error: err.message });
  }
};

// Reset Password - Verify code and update password
export const resetPassword = async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;
    
    if (!email || !code || !newPassword) {
      return res.status(400).json({ message: 'Email, code, and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (!user.verificationCode || !user.verificationExpires) {
      return res.status(400).json({ message: 'No reset code found. Please request a new one.' });
    }

    if (new Date() > new Date(user.verificationExpires)) {
      return res.status(400).json({ message: 'Reset code expired. Please request a new one.' });
    }

    if (String(code) !== String(user.verificationCode)) {
      return res.status(400).json({ message: 'Invalid reset code' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(newPassword, salt);

    // Update password and clear reset code
    user.password = hashed;
    user.verificationCode = null;
    user.verificationExpires = null;
    await user.save();

    console.log(`✅ Password reset successful for ${email}`);

    res.status(200).json({ message: 'Password reset successful. You can now login with your new password.' });
  } catch (err) {
    console.error('Reset password error:', err);
    return res.status(500).json({ message: 'Unexpected server error', error: err.message });
  }
};
