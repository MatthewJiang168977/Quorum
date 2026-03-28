const Message = require("../models/Message");
const Case = require("../models/Case");

// GET /api/search?q=keyword&role=caseworker
// Full-text search across messages
exports.search = async (req, res) => {
  try {
    const { q, role, page = 1, limit = 20 } = req.query;

    if (!q || q.trim().length === 0) {
      return res.status(400).json({ error: "Search query 'q' is required" });
    }

    const filter = {
      $or: [
        { subject: { $regex: q, $options: "i" } },
        { body: { $regex: q, $options: "i" } },
        { "from.name": { $regex: q, $options: "i" } },
        { "aiTags.topics": { $regex: q, $options: "i" } },
        { "aiTags.agency": { $regex: q, $options: "i" } },
        { "aiTags.caseReference": { $regex: q, $options: "i" } },
      ],
    };

    if (role) filter["aiTags.suggestedRoute"] = role;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [results, total] = await Promise.all([
      Message.find(filter)
        .sort({ receivedAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate("assignedTo", "name role")
        .lean(),
      Message.countDocuments(filter),
    ]);

    res.json({
      query: q,
      results,
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

// POST /api/batch/approve
// Bulk approve AI drafts
exports.batchApprove = async (req, res) => {
  try {
    const { messageIds, staffId } = req.body;

    if (!messageIds || !Array.isArray(messageIds) || messageIds.length === 0) {
      return res.status(400).json({ error: "messageIds array is required" });
    }

    const result = await Message.updateMany(
      { _id: { $in: messageIds } },
      {
        "aiDraft.status": "approved",
        "aiDraft.approvedBy": staffId,
        "aiDraft.approvedAt": new Date(),
        workflowStatus: "approved",
      }
    );

    res.json({
      modified: result.modifiedCount,
      total: messageIds.length,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/batch/send
// Bulk send approved drafts
exports.batchSend = async (req, res) => {
  try {
    const { messageIds } = req.body;

    if (!messageIds || !Array.isArray(messageIds) || messageIds.length === 0) {
      return res.status(400).json({ error: "messageIds array is required" });
    }

    const result = await Message.updateMany(
      {
        _id: { $in: messageIds },
        "aiDraft.status": "approved",
      },
      {
        "aiDraft.status": "sent",
        workflowStatus: "sent",
      }
    );

    res.json({
      sent: result.modifiedCount,
      total: messageIds.length,
      skipped: messageIds.length - result.modifiedCount,
      note: result.modifiedCount < messageIds.length
        ? "Some messages were skipped because their drafts were not approved"
        : undefined,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/batch/assign
// Bulk assign messages to a staff member
exports.batchAssign = async (req, res) => {
  try {
    const { messageIds, staffId } = req.body;

    if (!messageIds || !Array.isArray(messageIds) || messageIds.length === 0) {
      return res.status(400).json({ error: "messageIds array is required" });
    }

    const result = await Message.updateMany(
      { _id: { $in: messageIds } },
      {
        assignedTo: staffId,
        workflowStatus: "in_review",
      }
    );

    res.json({
      assigned: result.modifiedCount,
      total: messageIds.length,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/batch/archive
// Bulk archive messages
exports.batchArchive = async (req, res) => {
  try {
    const { messageIds } = req.body;

    if (!messageIds || !Array.isArray(messageIds) || messageIds.length === 0) {
      return res.status(400).json({ error: "messageIds array is required" });
    }

    const result = await Message.updateMany(
      { _id: { $in: messageIds } },
      { workflowStatus: "archived" }
    );

    res.json({
      archived: result.modifiedCount,
      total: messageIds.length,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/batch/auto-case
// Auto-create cases from messages tagged as casework
exports.batchAutoCase = async (req, res) => {
  try {
    const { messageIds, assignedTo } = req.body;

    const messages = await Message.find({
      _id: { $in: messageIds },
      "aiTags.intent": { $in: ["casework_request", "casework_followup"] },
      caseId: null,
    });

    const created = [];

    for (const msg of messages) {
      const deadline = new Date();
      deadline.setDate(deadline.getDate() + 14);

      const caseDoc = new Case({
        messageId: msg._id,
        constituent: msg.from.name,
        subject: msg.subject,
        agency: msg.aiTags.agency || "Unknown",
        agencyReference: msg.aiTags.caseReference,
        priority: msg.aiTags.urgency === "critical" ? "critical" : msg.aiTags.urgency === "high" ? "high" : "normal",
        assignedTo,
        deadline,
        slaDays: 14,
        notes: [
          {
            author: "system",
            text: `Case auto-created from ${msg.channel} message. Agency: ${msg.aiTags.agency || "TBD"}. Reference: ${msg.aiTags.caseReference || "none"}.`,
            timestamp: new Date(),
          },
        ],
        nextSteps: `Submit congressional inquiry to ${msg.aiTags.agency || "relevant agency"}.`,
      });

      await caseDoc.save();
      await Message.findByIdAndUpdate(msg._id, { caseId: caseDoc._id });
      created.push(caseDoc);
    }

    res.status(201).json({
      created: created.length,
      total: messageIds.length,
      skipped: messageIds.length - created.length,
      cases: created,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = exports;
