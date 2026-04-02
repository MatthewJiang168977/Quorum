const Case = require("../models/Case");
const Message = require("../models/Message");

// GET /api/cases
exports.getCases = async (req, res) => {
  try {
    const { status, priority, agency, assignedTo, overdue, page = 1, limit = 20 } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (agency) filter.agency = agency;
    if (assignedTo) filter.assignedTo = assignedTo;
    if (overdue === "true") {
      filter.deadline = { $lt: new Date() };
      filter.status = { $nin: ["resolved", "closed"] };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [cases, total] = await Promise.all([
      Case.find(filter)
        .sort({ priority: -1, deadline: 1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate("assignedTo", "name role")
        .populate("messageId")
        .lean(),
      Case.countDocuments(filter),
    ]);

    // Compute daysOpen dynamically
    const now = new Date();
    const enriched = cases.map((c) => ({
      ...c,
      daysOpen: Math.floor((now - new Date(c.openedAt)) / (1000 * 60 * 60 * 24)),
      isOverdue: c.deadline && now > new Date(c.deadline) && !["resolved", "closed"].includes(c.status),
    }));

    res.json({
      cases: enriched,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/cases/:id
exports.getCaseById = async (req, res) => {
  try {
    const caseDoc = await Case.findById(req.params.id)
      .populate("assignedTo", "name role")
      .populate("messageId");

    if (!caseDoc) return res.status(404).json({ error: "Case not found" });

    res.json(caseDoc);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/cases
// Create a case from a message
exports.createCase = async (req, res) => {
  try {
    const { messageId, assignedTo, subject, agency, agencyReference, priority, slaDays } = req.body;

    const deadline = new Date();
    deadline.setDate(deadline.getDate() + (slaDays || 14));

    const caseDoc = new Case({
      messageId,
      constituent: req.body.constituent,
      subject,
      agency,
      agencyReference,
      priority: priority || "normal",
      assignedTo,
      deadline,
      slaDays: slaDays || 14,
      notes: [
        {
          author: "system",
          text: `Case auto-created from message. Agency: ${agency}. Reference: ${agencyReference || "none"}.`,
          timestamp: new Date(),
        },
      ],
      nextSteps: req.body.nextSteps || "",
    });

    await caseDoc.save();

    // Link case back to the message
    if (messageId) {
      await Message.findByIdAndUpdate(messageId, { caseId: caseDoc._id });
    }

    res.status(201).json(caseDoc);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// PATCH /api/cases/:id/status
exports.updateCaseStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const update = { status, lastActivity: new Date() };

    if (status === "resolved") {
      update.resolvedAt = new Date();
    }

    const caseDoc = await Case.findByIdAndUpdate(req.params.id, update, { new: true });

    if (!caseDoc) return res.status(404).json({ error: "Case not found" });

    res.json(caseDoc);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/cases/:id/notes
exports.addNote = async (req, res) => {
  try {
    const { author, text } = req.body;

    const caseDoc = await Case.findByIdAndUpdate(
      req.params.id,
      {
        $push: { notes: { author, text, timestamp: new Date() } },
        lastActivity: new Date(),
      },
      { new: true }
    );

    if (!caseDoc) return res.status(404).json({ error: "Case not found" });

    res.json(caseDoc);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/cases/stats
exports.getCaseStats = async (req, res) => {
  try {
    const now = new Date();

    const [total, open, overdue, byAgency, byPriority, avgResolution] = await Promise.all([
      Case.countDocuments(),
      Case.countDocuments({ status: { $nin: ["resolved", "closed"] } }),
      Case.countDocuments({
        deadline: { $lt: now },
        status: { $nin: ["resolved", "closed"] },
      }),
      Case.aggregate([
        { $match: { status: { $nin: ["resolved", "closed"] } } },
        { $group: { _id: "$agency", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      Case.aggregate([
        { $match: { status: { $nin: ["resolved", "closed"] } } },
        { $group: { _id: "$priority", count: { $sum: 1 } } },
      ]),
      Case.aggregate([
        { $match: { status: "resolved", resolvedAt: { $ne: null } } },
        {
          $project: {
            resolutionDays: {
              $divide: [{ $subtract: ["$resolvedAt", "$openedAt"] }, 1000 * 60 * 60 * 24],
            },
          },
        },
        { $group: { _id: null, avg: { $avg: "$resolutionDays" } } },
      ]),
    ]);

    res.json({
      total,
      open,
      overdue,
      avgResolutionDays: avgResolution[0]?.avg ? Math.round(avgResolution[0].avg * 10) / 10 : null,
      byAgency: Object.fromEntries(byAgency.map((a) => [a._id, a.count])),
      byPriority: Object.fromEntries(byPriority.map((p) => [p._id, p.count])),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
