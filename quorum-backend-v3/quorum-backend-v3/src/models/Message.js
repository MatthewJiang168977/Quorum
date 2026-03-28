const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["email", "voicemail", "social_media", "form_submission"],
      required: true,
    },
    channel: {
      type: String,
      enum: ["email", "phone", "twitter", "web_form", "email_batch", "facebook", "instagram"],
      required: true,
    },
    from: {
      name: { type: String, required: true },
      email: String,
      phone: String,
      address: String,
      zip: String,
      district: String,
    },
    subject: { type: String, required: true },
    body: { type: String, required: true },
    receivedAt: { type: Date, default: Date.now },

    // AI-generated tags (populated by Gemini)
    aiTags: {
      topics: [String],
      urgency: {
        type: String,
        enum: ["low", "normal", "high", "critical"],
        default: "normal",
      },
      sentiment: {
        type: String,
        enum: ["positive", "neutral", "negative"],
        default: "neutral",
      },
      sentimentScore: { type: Number, min: -1, max: 1 },
      intent: {
        type: String,
        enum: [
          "casework_request",
          "casework_followup",
          "policy_feedback",
          "policy_opposition",
          "policy_support",
          "thank_you",
          "complaint",
          "meeting_request",
          "event_invitation",
          "information_request",
          "policy_advocacy",
          "other",
        ],
      },
      agency: String,
      caseReference: String,
      requiresResponse: { type: Boolean, default: true },
      suggestedRoute: {
        type: String,
        enum: [
          "chief_of_staff",
          "legislative_correspondent",
          "caseworker",
          "scheduler",
          "communications_director",
        ],
      },
      flags: [String],
      event: {
        date: Date,
        time: String,
        location: String,
        rsvpDeadline: Date,
        expectedAttendance: Number,
      },
    },

    // AI-generated draft response
    aiDraft: {
      body: String,
      confidence: { type: Number, min: 0, max: 1 },
      status: {
        type: String,
        enum: ["pending_approval", "approved", "rejected", "edited", "sent"],
        default: "pending_approval",
      },
      approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Staff" },
      approvedAt: Date,
      editedBody: String,
    },

    // Workflow
    workflowStatus: {
      type: String,
      enum: ["new", "in_review", "approved", "sent", "archived", "flagged"],
      default: "new",
    },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "Staff" },
    read: { type: Boolean, default: false },
    readAt: Date,
    readBy: { type: mongoose.Schema.Types.ObjectId, ref: "Staff" },

    // Linked case (if casework was opened)
    caseId: { type: mongoose.Schema.Types.ObjectId, ref: "Case" },

    // Batch grouping
    batchId: String,
    isBatchSummary: { type: Boolean, default: false },
    batchCount: Number,
  },
  {
    timestamps: true,
  }
);

// Indexes for common queries
messageSchema.index({ "aiTags.suggestedRoute": 1, workflowStatus: 1 });
messageSchema.index({ "aiTags.urgency": 1 });
messageSchema.index({ "aiTags.topics": 1 });
messageSchema.index({ "from.district": 1, "from.zip": 1 });
messageSchema.index({ receivedAt: -1 });
messageSchema.index({ assignedTo: 1, workflowStatus: 1 });
messageSchema.index({ "aiTags.sentiment": 1, receivedAt: -1 });

module.exports = mongoose.model("Message", messageSchema);
