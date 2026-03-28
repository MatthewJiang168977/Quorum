const mongoose = require("mongoose");

const satisfactionSchema = new mongoose.Schema(
  {
    caseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Case",
      required: true,
    },
    constituent: {
      name: String,
      email: String,
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: true,
    },
    feedback: String,
    responseTime: {
      type: String,
      enum: ["too_slow", "acceptable", "fast", "very_fast"],
    },
    wouldRecommend: Boolean,
    submittedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

satisfactionSchema.index({ caseId: 1 });

module.exports = mongoose.model("Satisfaction", satisfactionSchema);
