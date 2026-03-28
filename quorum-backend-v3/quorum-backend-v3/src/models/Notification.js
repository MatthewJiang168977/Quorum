const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Staff",
      required: true,
    },
    type: {
      type: String,
      enum: [
        "case_assigned",
        "case_update",
        "approval_needed",
        "employee_suggestion",
        "meeting_notes_added",
        "satisfaction_received",
        "deadline_warning",
        "escalation",
      ],
      required: true,
    },
    caseId: { type: mongoose.Schema.Types.ObjectId, ref: "Case" },
    title: { type: String, required: true },
    body: { type: String, required: true },
    metadata: mongoose.Schema.Types.Mixed,
    read: { type: Boolean, default: false },
    readAt: Date,
  },
  {
    timestamps: true,
  }
);

notificationSchema.index({ recipient: 1, read: 1, createdAt: -1 });

module.exports = mongoose.model("Notification", notificationSchema);
