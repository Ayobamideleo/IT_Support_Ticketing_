import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import { Op } from 'sequelize';
import sequelize from '../config/db.js';
import { sendAccountProvisionedEmail, sendVerificationEmail } from '../services/emailService.js';

// List all users with pagination and filters
export const listUsers = async (req, res) => {
  try {
    console.log('[DEBUG] listUsers raw query:', req.query);
    const { page = 1, limit = 20, role, status, q, department } = req.query;
    const offset = (page - 1) * limit;

    const where = {};

    // Apply filters
    if (role) where.role = role;
    if (status) {
      if (status === 'active') where.isVerified = true;
      else if (status === 'inactive') where.isVerified = false;
    }
    if (department) where.department = department;
    if (q) {
      where[Op.or] = [
        { name: { [Op.like]: `%${q}%` } },
        { email: { [Op.like]: `%${q}%` } }
      ];
    }

    // If IT staff, only show users in their department (if implemented)
    if (req.user.role === 'it_staff') {
      // Optional: filter by department
      if (req.user.department) {
        where.department = req.user.department;
      }
    }

    const { count, rows } = await User.findAndCountAll({
      where,
      attributes: { exclude: ['password', 'verificationCode'] },
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });

    console.log('[DEBUG] listUsers response meta:', { total: count, page: parseInt(page), totalPages: Math.ceil(count / limit) });
    return res.json({
      results: rows,
      total: count,
      page: parseInt(page),
      totalPages: Math.ceil(count / limit)
    });
  } catch (error) {
    console.error('List users error:', error);
    return res.status(500).json({ message: 'Failed to list users' });
  }
};

// Get user by ID
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id, {
      attributes: { exclude: ['password', 'verificationCode'] }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Failed to get user' });
  }
};

// Create new user
export const createUser = async (req, res) => {
  try {
    const { name, email, password, role, department } = req.body;

    // Check if IT staff trying to create non-employee
    if (req.user.role === 'it_staff' && role !== 'employee') {
      return res.status(403).json({ message: 'IT staff can only create employee accounts' });
    }

    // Check if user exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    const plainPassword = password;

    // Hash password
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    // Create user
    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      role: role || 'employee',
      department: department || null,
      isVerified: true,
      mustChangePassword: true,
      verificationCode: null,
      verificationExpires: null,
      createdBy: req.user.id
    });

    try {
      await sendAccountProvisionedEmail({
        to: email,
        name,
        temporaryPassword: plainPassword,
        role: role || 'employee'
      });
    } catch (err) {
      console.warn('sendAccountProvisionedEmail failed:', err?.message || err);
    }

    const userResponse = newUser.toJSON();
    delete userResponse.password;
    delete userResponse.verificationCode;

    res.status(201).json({
      message: 'User created successfully',
      user: userResponse
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ message: 'Failed to create user' });
  }
};

// Update user role
export const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    // Only managers can change roles
    if (req.user.role !== 'manager') {
      return res.status(403).json({ message: 'Only managers can change user roles' });
    }

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent self-demotion
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ message: 'You cannot change your own role' });
    }

    user.role = role;
    await user.save();

    const userResponse = user.toJSON();
    delete userResponse.password;
    delete userResponse.verificationCode;

    res.json({
      message: 'User role updated successfully',
      user: userResponse
    });
  } catch (error) {
    console.error('Update role error:', error);
    res.status(500).json({ message: 'Failed to update user role' });
  }
};

// Update user status (activate/deactivate)
export const updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isVerified } = req.body;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent self-deactivation
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ message: 'You cannot deactivate your own account' });
    }

    // IT staff cannot deactivate managers
    if (req.user.role === 'it_staff' && user.role === 'manager') {
      return res.status(403).json({ message: 'IT staff cannot deactivate manager accounts' });
    }

    user.isVerified = isVerified;
    await user.save();

    const userResponse = user.toJSON();
    delete userResponse.password;
    delete userResponse.verificationCode;

    res.json({
      message: `User ${isVerified ? 'activated' : 'deactivated'} successfully`,
      user: userResponse
    });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ message: 'Failed to update user status' });
  }
};

// Delete user
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Only managers can delete
    if (req.user.role !== 'manager') {
      return res.status(403).json({ message: 'Only managers can delete users' });
    }

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent self-deletion
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ message: 'You cannot delete your own account' });
    }

    await user.destroy();

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Failed to delete user' });
  }
};

// Resend verification email
export const resendUserVerification = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: 'User is already verified' });
    }

    // Generate new verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    user.verificationCode = verificationCode;
    user.verificationExpires = verificationExpires;
    await user.save();

    try {
      await sendVerificationEmail(user.email, verificationCode, verificationExpires);
    } catch (err) {
      console.warn('sendVerificationEmail (resend) failed:', err?.message || err);
    }

    res.json({ message: 'Verification email sent successfully' });
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({ message: 'Failed to resend verification' });
  }
};

// Update user basic fields (department)
export const updateUserDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const { department } = req.body;

    const target = await User.findByPk(id);
    if (!target) return res.status(404).json({ message: 'User not found' });

    // IT staff cannot modify manager details
    if (req.user.role === 'it_staff' && target.role === 'manager') {
      return res.status(403).json({ message: 'IT staff cannot edit manager details' });
    }

    // Prevent self-changes that could lock access? Not required for department, allow
    const trimmedDept = (typeof department === 'string') ? department.trim() : department;
    // Allow null/empty to clear department
    target.department = (trimmedDept === '' || trimmedDept == null) ? null : trimmedDept;
    console.log('[DEBUG] updateUserDepartment saving:', { userId: id, from: target._previousDataValues.department, to: target.department });
    await target.save();

    const userResponse = target.toJSON();
    delete userResponse.password;
    delete userResponse.verificationCode;

    return res.json({ message: 'Department updated successfully', user: userResponse });
  } catch (error) {
    console.error('Update department error:', error);
    // Surface validation/database error details in non-production for easier debugging
    const base = 'Failed to update department';
    const detail = process.env.NODE_ENV === 'production' ? undefined : (error.message || JSON.stringify(error));
    return res.status(500).json({ message: detail ? `${base}: ${detail}` : base });
  }
};

// Get user statistics (for manager dashboard)
export const getUserStats = async (req, res) => {
  try {
    console.log('[DEBUG] getUserStats requested by user id:', req.user?.id, 'role:', req.user?.role);
    const totalUsers = await User.count();
    const activeUsers = await User.count({ where: { isVerified: true } });
    const inactiveUsers = await User.count({ where: { isVerified: false } });
    const employeeCount = await User.count({ where: { role: 'employee' } });
    const itStaffCount = await User.count({ where: { role: 'it_staff' } });
    const managerCount = await User.count({ where: { role: 'manager' } });
    
    const roleBreakdown = await User.findAll({
      attributes: [
        'role',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['role']
    });

    const deptBreakdown = await User.findAll({
      attributes: [
        'department',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['department']
    });

    const payload = {
      total: totalUsers,
      active: activeUsers,
      inactive: inactiveUsers,
      verified: activeUsers,
      employees: employeeCount,
      itStaff: itStaffCount,
      managers: managerCount,
      roleBreakdown: roleBreakdown.map(r => ({
        role: r.role,
        count: parseInt(r.get('count'))
      })),
      usersByDepartment: deptBreakdown.map(d => ({
        department: d.get('department') || 'Unknown',
        count: parseInt(d.get('count')) || 0
      }))
    };
    console.log('[DEBUG] getUserStats payload:', payload);
    return res.json(payload);
  } catch (error) {
    console.error('Get stats error:', error);
    return res.status(500).json({ message: 'Failed to get user statistics' });
  }
};
