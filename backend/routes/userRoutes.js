import express from 'express';
import { authenticate } from '../middleware/authMiddleware.js';
import { allowRoles } from '../middleware/roleMiddleware.js';
import { validateRequest } from '../middleware/validate.js';
import {
  listUsers,
  getUserById,
  createUser,
  updateUserRole,
  updateUserStatus,
  deleteUser,
  resendUserVerification,
  getUserStats,
  updateUserDepartment
} from '../controllers/userController.js';
import {
  createUserSchema,
  updateRoleSchema,
  updateStatusSchema,
  userQuerySchema,
  updateDepartmentSchema
} from '../middleware/userValidation.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get user statistics (managers only)
router.get('/stats', allowRoles('manager'), getUserStats);

// List all users (managers and IT staff)
router.get('/', allowRoles('manager', 'it_staff'), validateRequest({ query: userQuerySchema }), listUsers);

// Get user by ID (managers and IT staff)
router.get('/:id', allowRoles('manager', 'it_staff'), getUserById);

// Create new user (managers and IT staff)
router.post('/', allowRoles('manager', 'it_staff'), validateRequest({ body: createUserSchema }), createUser);

// Update user role (managers only)
router.put('/:id/role', allowRoles('manager'), validateRequest({ body: updateRoleSchema }), updateUserRole);

// Update user status - activate/deactivate (managers and IT staff)
router.put('/:id/status', allowRoles('manager', 'it_staff'), validateRequest({ body: updateStatusSchema }), updateUserStatus);

// Update department (managers and IT staff; IT staff cannot edit managers enforced in controller)
router.put('/:id/department', allowRoles('manager', 'it_staff'), validateRequest({ body: updateDepartmentSchema }), updateUserDepartment);

// Delete user (managers only)
router.delete('/:id', allowRoles('manager'), deleteUser);

// Resend verification email (managers and IT staff)
router.post('/:id/resend', allowRoles('manager', 'it_staff'), resendUserVerification);

export default router;
