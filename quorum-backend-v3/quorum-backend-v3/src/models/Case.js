const mongoose = require("mongoose");

const noteSchema = new mongoose.Schema({
  author: { type: String, required: true },
  text: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

const caseSchema = new mongoose.Schema(
  {
    messageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      required: true,
    },
    constituent: { type: String, required: true },
    subject: { type: String, required: true },
    agency: { type: String, required: true },
    agencyReference: String,
    caseNumber: { type: String, unique: true, sparse: true },
    status: {
      type: String,
      enum: [
        "open",
        "in_progress",
        "awaiting_agency",
        "awaiting_constituent",
        "resolved",
        "closed",
      ],
      default: "open",
    },
    priority: {
      type: String,
      enum: ["low", "normal", "high", "critical"],
      default: "normal",
    },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "Staff" },
    openedAt: { type: Date, default: Date.now },
    deadline: Date,
    slaDays: { type: Number, default: 14 },
    daysOpen: { type: Number, default: 0 },
    resolvedAt: Date,
    lastActivity: { type: Date, default: Date.now },
    notes: [noteSchema],
    nextSteps: String,
    flags: [String],
  },
  {
    timestamps: true,
  }
);

// Virtual: check if overdue
caseSchema.virtual("isOverdue").get(function () {
  if (this.status === "resolved" || this.status === "closed") return false;
  return this.deadline && new Date() > this.deadline;
});

caseSchema.set("toJSON", { virtuals: true });
caseSchema.set("toObject", { virtuals: true });

caseSchema.index({ status: 1, priority: 1 });
caseSchema.index({ assignedTo: 1, status: 1 });
caseSchema.index({ deadline: 1 });
caseSchema.index({ agency: 1 });

module.exports = mongoose.model("Case", caseSchema);
