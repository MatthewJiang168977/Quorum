const Message = require("../models/Message");
const Case = require("../models/Case");
const Trend = require("../models/Trend");
const Staff = require("../models/Staff");

// GET /api/dashboard/:role
// Returns everything a role-based view needs in a single API call
exports.getDashboard = async (req, res) => {
  try {
    const { role } = req.params;

    const validRoles = [
      "chief_of_staff",
      "legislative_correspondent",
      "caseworker",
      "scheduler",
      "communications_director",
    ];

    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: `Invalid role. Must be one of: ${validRoles.join(", ")}` });
    }

    // Common data: messages for this role
    const roleFilter = { "aiTags.suggestedRoute": role };

    const [messages, unread, critical, bySentiment] = await Promise.all([
      Message.find(roleFilter)
        .sort({ receivedAt: -1 })
        .limit(25)
        .populate("assignedTo", "name role")
        .lean(),
      Message.countDocuments({ ...roleFilter, read: false }),
      Message.countDocuments({ ...roleFilter, "aiTags.urgency": "critical" }),
      Message.aggregate([
        { $match: roleFilter },
        { $group: { _id: "$aiTags.sentiment", count: { $sum: 1 } } },
      ]),
    ]);

    const total = await Message.countDocuments(roleFilter);

    // Base response
    const dashboard = {
      role,
      metrics: {
        total,
        unread,
        critical,
        sentiment: Object.fromEntries(bySentiment.map((s) => [s._id, s.count])),
      },
      messages,
    };

    // Role-specific data
    if (role === "chief_of_staff") {
      const [trends, pendingApprovals, caseStats, anomalies, flagged] = await Promise.all([
        Trend.findOne().sort({ periodEnd: -1 }).lean(),
        Message.countDocuments({ "aiDraft.status": "pending_approval" }),
        Case.aggregate([
          { $match: { status: { $nin: ["resolved", "closed"] } } },
          {
            $group: {
              _id: "$priority",
              count: { $sum: 1 },
            },
          },
        ]),
        Trend.findOne().sort({ periodEnd: -1 }).select("anomalies").lean(),
        Message.find({ workflowStatus: "flagged" })
          .sort({ receivedAt: -1 })
          .limit(10)
          .lean(),
      ]);

      dashboard.pendingApprovals = pendingApprovals;
      dashboard.caseStats = Object.fromEntries(caseStats.map((c) => [c._id, c.count]));
      dashboard.anomalies = anomalies?.anomalies?.filter((a) => !a.acknowledged) || [];
      dashboard.flaggedMessages = flagged;
      dashboard.trends = trends
        ? {
            topicDistribution: trends.topicDistribution,
            sentimentByWeek: trends.sentimentByWeek,
            dailyVolume: trends.dailyVolume,
          }
        : null;
    }

    if (role === "legislative_correspondent") {
      const [pendingDrafts, topTopics, batches] = await Promise.all([
        Message.countDocuments({
          ...roleFilter,
          "aiDraft.status": "pending_approval",
        }),
        Message.aggregate([
          { $match: roleFilter },
          { $unwind: "$aiTags.topics" },
          { $group: { _id: "$aiTags.topics", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 5 },
        ]),
        Message.find({ ...roleFilter, isBatchSummary: true })
          .sort({ receivedAt: -1 })
          .limit(10)
          .lean(),
      ]);

      dashboard.pendingDrafts = pendingDrafts;
      dashboard.topTopics = topTopics.map((t) => ({ topic: t._id, count: t.count }));
      dashboard.batches = batches;
    }

    if (role === "caseworker") {
      const now = new Date();
      const [openCases, overdueCases, resolvedThisWeek, casesByAgency, recentCases] =
        await Promise.all([
          Case.countDocuments({ status: { $nin: ["resolved", "closed"] } }),
          Case.countDocuments({
            deadline: { $lt: now },
            status: { $nin: ["resolved", "closed"] },
          }),
          Case.countDocuments({
            status: "resolved",
            resolvedAt: {
              $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
            },
          }),
          Case.aggregate([
            { $match: { status: { $nin: ["resolved", "closed"] } } },
            { $group: { _id: "$agency", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
          ]),
          Case.find({ status: { $nin: ["resolved", "closed"] } })
            .sort({ priority: -1, deadline: 1 })
            .limit(20)
            .populate("assignedTo", "name role")
            .populate("messageId", "subject from")
            .lean(),
        ]);

      dashboard.caseMetrics = {
        open: openCases,
        overdue: overdueCases,
        resolvedThisWeek,
        byAgency: Object.fromEntries(casesByAgency.map((a) => [a._id, a.count])),
      };
      dashboard.cases = recentCases.map((c) => ({
        ...c,
        daysOpen: Math.floor((now - new Date(c.openedAt)) / (1000 * 60 * 60 * 24)),
        isOverdue: c.deadline && now > new Date(c.deadline),
      }));
    }

    if (role === "scheduler") {
      const events = await Message.find({
        ...roleFilter,
        "aiTags.event.date": { $ne: null },
      })
        .sort({ "aiTags.event.date": 1 })
        .limit(20)
        .lean();

      const meetingRequests = await Message.find({
        ...roleFilter,
        "aiTags.intent": "meeting_request",
      })
        .sort({ receivedAt: -1 })
        .limit(10)
        .lean();

      dashboard.events = events;
      dashboard.meetingRequests = meetingRequests;
    }

    if (role === "communications_director") {
      const [socialMessages, sentimentTrend] = await Promise.all([
        Message.find({ channel: { $in: ["twitter", "facebook", "instagram"] } })
          .sort({ receivedAt: -1 })
          .limit(20)
          .lean(),
        Trend.findOne().sort({ periodEnd: -1 }).select("sentimentByWeek").lean(),
      ]);

      dashboard.socialMessages = socialMessages;
      dashboard.sentimentTrend = sentimentTrend?.sentimentByWeek || [];
    }

    res.json(dashboard);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = exports;
