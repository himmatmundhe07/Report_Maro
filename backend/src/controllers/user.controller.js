// controllers/user.controller.js
//
// Added alongside apps/web (the new frontend) because nothing in the existing
// auth/problem/project controllers lets an admin discover which users to
// assign a verified problem to, or lets a citizen browse partner
// organizations. This is additive only — no existing controller is changed.
const User = require('../models/user.model');

// 📝 GET /api/users?role=university - List users, optionally filtered by role
const getUsers = async (req, res, next) => {
  try {
    const { role } = req.query;
    const filter = {};
    if (role) filter.role = role;

    const users = await User.find(filter).select('-password_hash');

    res.json({
      success: true,
      data: users,
    });
  } catch (error) {
    next(error);
  }
};

// 📝 PATCH /api/users/:id/verify - Admin toggles user clearance
const verifyUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { is_verified } = req.body;
    const user = await User.findByIdAndUpdate(
      id,
      { is_verified: is_verified !== undefined ? is_verified : true },
      { new: true }
    ).select('-password_hash');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUsers,
  verifyUser,
};
