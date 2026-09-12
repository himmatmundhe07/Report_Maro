const mongoose = require('mongoose');

const ProblemSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      minlength: [5, 'Title must be at least 5 characters'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      minlength: [20, 'Description must be at least 20 characters'],
    },
    category: {
      type: String,
      enum: ['water', 'road', 'health', 'other'],
      default: null,
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    status: {
      type: String,
      enum: ['submitted', 'verified', 'assigned', 'in_progress', 'resolved'],
      default: 'submitted',
    },
    location: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
      district: { type: String, required: true },
      address: { type: String, default: '' },
    },
    image_urls: {
      type: [String],
      default: [],
    },
    submitted_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    assigned_university: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    ai_confidence: {
      type: Number,
      min: 0,
      max: 1,
      default: null,
    },
    duplicate_of: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Problem',
      default: null,
    },
    duplicate_count: {
      type: Number,
      default: 0,
    },
    cluster_id: {
      type: String,
      default: null,
    },
    citizen_feedback: {
      rating: { type: Number, min: 1, max: 5, default: null },
      comments: { type: String, default: '' },
      is_resolved: { type: Boolean, default: null },
      verified_at: { type: Date, default: null },
    },
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  }
);

// 🔍 Indexes for faster queries
ProblemSchema.index({ status: 1 });
ProblemSchema.index({ category: 1 });
ProblemSchema.index({ 'location.district': 1 });
ProblemSchema.index({ submitted_by: 1 });
ProblemSchema.index({ assigned_university: 1 });

module.exports = mongoose.model('Problem', ProblemSchema);