import express from "express";
import { registerUser, loginUser, getCurrentUser, verifyUser, resendVerification, forgotPassword, resetPassword } from "../controllers/authController.js";
import { validate } from '../middleware/validate.js';
import { z } from 'zod';
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

// Schemas
const registerSchema = z.object({
	name: z.string().min(2),
	email: z.string().email(),
	password: z.string().min(6),
	role: z.enum(['employee','it_staff','manager']).optional(),
	department: z.string().optional()
});
const loginSchema = z.object({ email: z.string().email(), password: z.string().min(6) });
const verifySchema = z.object({ email: z.string().email(), code: z.string().length(6) });
const resendSchema = z.object({ email: z.string().email() });
const forgotPasswordSchema = z.object({ email: z.string().email() });
const resetPasswordSchema = z.object({ 
	email: z.string().email(), 
	code: z.string().length(6), 
	newPassword: z.string().min(6) 
});

router.post("/register", validate(registerSchema), registerUser);
router.post("/verify", validate(verifySchema), verifyUser);
router.post("/resend", validate(resendSchema), resendVerification); // resend verification code
router.post("/login", validate(loginSchema), loginUser);
router.post("/forgot-password", validate(forgotPasswordSchema), forgotPassword);
router.post("/reset-password", validate(resetPasswordSchema), resetPassword);

// Protected: return info about the current user
router.get("/me", verifyToken, getCurrentUser);

export default router;
