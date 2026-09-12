// controllers/internal.controller.js
const Problem = require('../models/problem.model');
const Notification = require('../models/notification.model');
const AuditLog = require('../models/auditlog.model');

// 📝 PATCH /api/internal/problems/:id - AI updates problem
const updateProblemAI = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { category, priority, confidence, status, duplicate_of } = req.body;

    console.log(`🔑 [Internal] Updating problem ${id}`);

    // Find problem
    const problem = await Problem.findById(id);
    if (!problem) {
      return res.status(404).json({
        success: false,
        message: 'Problem not found',
      });
    }

    // Update AI fields
    if (category) problem.category = category;
    if (priority) problem.priority = priority;
    if (confidence) problem.ai_confidence = confidence;

    // Link duplicate if found
    if (duplicate_of) {
      problem.duplicate_of = duplicate_of;
      await Problem.findByIdAndUpdate(duplicate_of, {
        $inc: { duplicate_count: 1 },
        priority: 'high', // Elevate parent priority on repeated community reports
      });
      await AuditLog.create({
        eventType: 'DUPLICATE_PROBLEM_LINKED',
        payload: { problemId: problem._id, duplicateOf: duplicate_of },
        source: 'ai_worker',
      }).catch(err => console.error('AuditLog error:', err.message));
    }

    // If status is 'verified', update and notify admin
    if (status === 'verified' && problem.status === 'submitted') {
      problem.status = 'verified';

      // Audit log
      await AuditLog.create({
        eventType: 'PROBLEM_AI_VERIFIED',
        payload: { problemId: problem._id, category, priority, confidence },
        source: 'ai_worker',
      }).catch(err => console.error('AuditLog error:', err.message));

      // Create notification
      await Notification.create({
        userId: null, // Broadcast to admins
        message: `🔍 Problem "${problem.title}" verified by AI`,
        type: 'status_update',
        link: `/problems/${problem._id}`,
      });

      // Emit Socket event
      const io = req.app.get('io');
      if (io) {
        io.to('admins').emit('problem_verified', {
          problemId: problem._id,
          title: problem.title,
          category: problem.category,
          priority: problem.priority,
        });
      }

      console.log(`📢 [Internal] Problem ${id} verified, admin notified`);
    }

    await problem.save();

    res.json({
      success: true,
      message: 'Problem updated successfully',
      data: {
        category: problem.category,
        priority: problem.priority,
        confidence: problem.ai_confidence,
        status: problem.status,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  updateProblemAI,
};