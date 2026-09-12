const mongoose = require('mongoose');

const ProjectSchema = new mongoose.Schema(
  {
    problem_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Problem',
      required: true,
      unique: true, // ✅ One project per problem
    },
    university_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    industry_partner_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    proposal_text: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: ['proposed', 'under_review', 'active', 'completed'],
      default: 'proposed',
    },
    budget: {
      type: Number,
      min: 0,
      default: null,
    },
    milestones: {
      type: [
        {
          title: { type: String, required: true },
          dueDate: { type: Date, required: true },
          done: { type: Boolean, default: false },
          proof_url: { type: String, default: '' },
          completion_notes: { type: String, default: '' },
          completed_at: { type: Date, default: null },
        },
      ],
      default: [],
    },
    csr_reference: { type: String, default: '' },
    csr_certificate_id: { type: String, default: '' },
    funding_tranches: {
      type: [
        {
          tranche: String,
          amount: Number,
          percentage: Number,
          status: { type: String, default: 'released' },
          released_at: { type: Date, default: Date.now },
        },
      ],
      default: [],
    },
    // ✅ Social Impact Metrics
    people_impacted: { type: Number, default: null },
    villages_reached: { type: Number, default: null },
    patents_filed: { type: Number, default: 0 },
    startup_created: { type: Boolean, default: false },
    deployed_to_field: { type: Boolean, default: false },
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  }
);

// Indexes
ProjectSchema.index({ university_id: 1 });
ProjectSchema.index({ status: 1 });

module.exports = mongoose.model('Project', ProjectSchema);