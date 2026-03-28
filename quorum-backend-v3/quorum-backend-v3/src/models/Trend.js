const mongoose = require("mongoose");

const topicDistributionSchema = new mongoose.Schema({
  topic: String,
  count: Number,
  pct: Number,
  trend: { type: String, enum: ["rising", "stable", "falling", "spike"] },
  changePct: Number,
});

const sentimentWeekSchema = new mongoose.Schema({
  week: Date,
  positive: Number,
  neutral: Number,
  negative: Number,
});

const anomalySchema = new mongoose.Schema({
  type: { type: String, enum: ["spike", "sentiment_shift", "volume_anomaly"] },
  topic: String,
  detectedAt: Date,
  description: String,
  severity: { type: String, enum: ["low", "medium", "high", "critical"] },
  acknowledged: { type: Boolean, default: false },
  acknowledgedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Staff" },
});

const geoHotspotSchema = new mongoose.Schema({
  zip: String,
  count: Number,
  topTopic: String,
  sentimentAvg: Number,
});

const trendSchema = new mongoose.Schema(
  {
    district: { type: String, required: true },
    periodStart: { type: Date, required: true },
    periodEnd: { type: Date, required: true },
    totalMessages: Number,
    totalCasesOpened: Number,
    totalCasesResolved: Number,
    avgResponseTimeHours: Number,
    topicDistribution: [topicDistributionSchema],
    sentimentByWeek: [sentimentWeekSchema],
    anomalies: [anomalySchema],
    geographicHotspots: [geoHotspotSchema],
    dailyVolume: [
      {
        date: Date,
        count: Number,
      },
    ],
  },
  {
    timestamps: true,
  }
);

trendSchema.index({ district: 1, periodStart: -1 });

module.exports = mongoose.model("Trend", trendSchema);
