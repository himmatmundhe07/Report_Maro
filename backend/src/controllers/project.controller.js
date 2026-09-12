// controllers/project.controller.js
const Project = require('../models/project.model');
const Problem = require('../models/problem.model');
const Notification = require('../models/notification.model');
const AuditLog = require('../models/auditlog.model');

// 📝 GET /api/projects - List projects (optionally by status or university)
// Added alongside apps/web because nothing previously let a university see
// its own assigned projects or an industry browse fundable ones — only
// POST .../proposal and PUT .../fund existed.
const getProjects = async (req, res, next) => {
  try {
    const { status, university_id } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (university_id) filter.university_id = university_id;

    const projects = await Project.find(filter)
      .populate('problem_id')
      .populate('university_id', 'full_name organization email')
      .populate('industry_partner_id', 'full_name organization email')
      .sort({ created_at: -1 });

    res.json({
      success: true,
      data: projects,
    });
  } catch (error) {
    next(error);
  }
};

// 📝 GET /api/projects/:id - Single project detail
const getProjectById = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('problem_id')
      .populate('university_id', 'full_name organization email')
      .populate('industry_partner_id', 'full_name organization email');

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    res.json({ success: true, data: project });
  } catch (error) {
    next(error);
  }
};

// 📝 POST /api/projects/:id/proposal - University submits proposal
const submitProposal = async (req, res, next) => {
  try {
    const { proposal_text, budget, milestones } = req.body;
    const projectId = req.params.id;

    if (!proposal_text || !budget) {
      return res.status(400).json({
        success: false,
        message: 'Proposal text and budget are required',
      });
    }

    // Find project
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    // Verify ownership
    if (project.university_id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to submit proposal for this project',
      });
    }

    // Verify status
    if (project.status !== 'proposed') {
      return res.status(409).json({
        success: false,
        message: `Project is already ${project.status}. Cannot submit proposal.`,
      });
    }

    // Update project
    project.proposal_text = proposal_text;
    project.budget = budget;
    project.milestones = milestones || [];
    project.status = 'under_review';
    await project.save();

    // Audit log
    await AuditLog.create({
      eventType: 'PROPOSAL_SUBMITTED',
      payload: { projectId: project._id, universityId: req.user.id, budget },
      source: 'university',
    }).catch(err => console.error('AuditLog error:', err.message));

    // Notify industry partners
    await Notification.create({
      userId: null, // Broadcast to industry
      message: `New proposal submitted for problem`,
      type: 'funding',
      link: `/projects/${project._id}`,
    });

    // Emit Socket event
    const io = req.app.get('io');
    if (io) {
      io.to('industry').emit('new_proposal', {
        projectId: project._id,
        problemId: project.problem_id,
        budget: project.budget,
      });
    }

    res.json({
      success: true,
      message: 'Proposal submitted successfully',
      data: project,
    });
  } catch (error) {
    next(error);
  }
};

// 📝 PUT /api/projects/:id/fund - Industry funds project
const fundProject = async (req, res, next) => {
  try {
    const { amount } = req.body;
    const projectId = req.params.id;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid funding amount is required',
      });
    }

    // Find project
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    // Verify status
    if (project.status !== 'under_review' && project.status !== 'proposed') {
      return res.status(409).json({
        success: false,
        message: `Project is ${project.status}. Cannot fund now.`,
      });
    }

    // Update project
    project.status = 'active';
    project.budget = amount;
    project.industry_partner_id = req.user.id;
    await project.save();

    // Update problem status
    await Problem.findByIdAndUpdate(project.problem_id, {
      status: 'in_progress',
    });

    // Audit log
    await AuditLog.create({
      eventType: 'PROJECT_FUNDED',
      payload: { projectId: project._id, industryId: req.user.id, amount },
      source: 'industry',
    }).catch(err => console.error('AuditLog error:', err.message));

    // Notify university
    await Notification.create({
      userId: project.university_id,
      message: 'Your project has been funded! Start working on the solution.',
      type: 'funding',
      link: `/projects/${project._id}`,
    });

    // Generate official CSR compliance numbers
    project.csr_reference = 'JH-CSR-' + Date.now().toString(36).toUpperCase();
    project.csr_certificate_id = 'CSR-80G-' + Math.floor(100000 + Math.random() * 900000);
    project.funding_tranches = [
      {
        tranche: 'Tranche 1 (30% Advance R&D)',
        amount: Math.round(amount * 0.3),
        percentage: 30,
        status: 'released',
        released_at: new Date(),
      },
    ];

    // Notify admin
    await Notification.create({
      userId: null,
      message: `Project funded: Amount ₹${amount}`,
      type: 'status_update',
      link: `/projects/${project._id}`,
    });

    // Emit Socket events
    const io = req.app.get('io');
    if (io) {
      io.to(`university_${project.university_id}`).emit('project_funded', {
        projectId: project._id,
        amount: amount,
      });
      io.to('admins').emit('project_active', {
        projectId: project._id,
        amount: amount,
      });
    }

    res.json({
      success: true,
      message: 'Project funded successfully!',
      data: project,
    });
  } catch (error) {
    next(error);
  }
};

// 📝 PUT /api/projects/:id/milestones/:idx - University updates milestone progress
const updateMilestone = async (req, res, next) => {
  try {
    const { id, idx } = req.params;
    const { done, proof_url, completion_notes } = req.body;

    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const mIdx = parseInt(idx, 10);
    if (isNaN(mIdx) || mIdx < 0 || mIdx >= project.milestones.length) {
      return res.status(400).json({ success: false, message: 'Invalid milestone index' });
    }

    project.milestones[mIdx].done = done !== undefined ? done : true;
    if (proof_url) project.milestones[mIdx].proof_url = proof_url;
    if (completion_notes) project.milestones[mIdx].completion_notes = completion_notes;
    if (project.milestones[mIdx].done) {
      project.milestones[mIdx].completed_at = new Date();
    }

    // If all milestones completed, mark project completed & problem resolved
    const allDone = project.milestones.every(m => m.done);
    if (allDone) {
      project.status = 'completed';
      await Problem.findByIdAndUpdate(project.problem_id, { status: 'resolved' });
    }

    await project.save();

    await AuditLog.create({
      eventType: 'PROJECT_MILESTONE_UPDATED',
      payload: { projectId: project._id, milestoneIdx: mIdx, done: project.milestones[mIdx].done },
      source: 'university',
    }).catch(err => console.error('AuditLog error:', err.message));

    res.json({
      success: true,
      message: 'Milestone updated successfully',
      data: project,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProjects,
  getProjectById,
  submitProposal,
  fundProject,
  updateMilestone,
};