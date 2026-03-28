const Trend = require("../models/Trend");
const Message = require("../models/Message");

// GET /api/trends/latest
exports.getLatestTrends = async (req, res) => {
  try {
    const trend = await Trend.findOne().sort({ periodEnd: -1 }).lean();

    if (!trend) return res.status(404).json({ error: "No trend data available" });

    res.json(trend);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/trends/topics
// Real-time topic aggregation from messages
exports.getTopicBreakdown = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const since = new Date();
    since.setDate(since.getDate() - parseInt(days));

    const topics = await Message.aggregate([
      { $match: { receivedAt: { $gte: since } } },
      { $unwind: "$aiTags.topics" },
      {
        $group: {
          _id: "$aiTags.topics",
          count: { $sum: 1 },
          avgSentiment: { $avg: "$aiTags.sentimentScore" },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 15 },
    ]);

    const total = topics.reduce((sum, t) => sum + t.count, 0);

    res.json(
      topics.map((t) => ({
        topic: t._id,
        count: t.count,
        pct: Math.round((t.count / total) * 1000) / 10,
        avgSentiment: Math.round(t.avgSentiment * 100) / 100,
      }))
    );
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/trends/sentiment
// Sentiment over time
exports.getSentimentTimeline = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const since = new Date();
    since.setDate(since.getDate() - parseInt(days));

    const timeline = await Message.aggregate([
      { $match: { receivedAt: { $gte: since } } },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$receivedAt" } },
            sentiment: "$aiTags.sentiment",
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.date": 1 } },
    ]);

    // Reshape into { date, positive, neutral, negative }
    const grouped = {};
    timeline.forEach((t) => {
      if (!grouped[t._id.date]) {
        grouped[t._id.date] = { date: t._id.date, positive: 0, neutral: 0, negative: 0 };
      }
      grouped[t._id.date][t._id.sentiment] = t.count;
    });

    res.json(Object.values(grouped));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/trends/volume
// Daily message volume
exports.getVolumeTimeline = async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const since = new Date();
    since.setDate(since.getDate() - parseInt(days));

    const volume = await Message.aggregate([
      { $match: { receivedAt: { $gte: since } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$receivedAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json(volume.map((v) => ({ date: v._id, count: v.count })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/trends/anomalies
exports.getAnomalies = async (req, res) => {
  try {
    const trend = await Trend.findOne().sort({ periodEnd: -1 }).lean();

    if (!trend) return res.json([]);

    const unacknowledged = (trend.anomalies || []).filter((a) => !a.acknowledged);
    res.json(unacknowledged);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/trends/geo
exports.getGeoData = async (req, res) => {
  try {
    const geo = await Message.aggregate([
      { $match: { "from.zip": { $ne: null } } },
      {
        $group: {
          _id: "$from.zip",
          count: { $sum: 1 },
          avgSentiment: { $avg: "$aiTags.sentimentScore" },
          topics: { $push: { $arrayElemAt: ["$aiTags.topics", 0] } },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 20 },
    ]);

    // Find top topic per zip
    const result = geo.map((g) => {
      const topicCounts = {};
      g.topics.forEach((t) => {
        if (t) topicCounts[t] = (topicCounts[t] || 0) + 1;
      });
      const topTopic = Object.entries(topicCounts).sort((a, b) => b[1] - a[1])[0];

      return {
        zip: g._id,
        count: g.count,
        avgSentiment: Math.round(g.avgSentiment * 100) / 100,
        topTopic: topTopic ? topTopic[0] : "other",
      };
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = exports;
