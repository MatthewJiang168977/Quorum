const Message = require("../models/Message");
const { triageMessage, generateDraft } = require("../services/geminiService");

// GET /api/messages
// Query params: role, urgency, sentiment, topic, status, page, limit
exports.getMessages = async (req, res) => {
  try {
    const {
      role,
      urgency,
      sentiment,
      topic,
      status,
      read,
      page = 1,
      limit = 20,
    } = req.query;

    const filter = {};

    // Role-based filtering: each role only sees messages routed to them
    if (role) {
      filter["aiTags.suggestedRoute"] = role;
    }

    if (urgency) filter["aiTags.urgency"] = urgency;
    if (sentiment) filter["aiTags.sentiment"] = sentiment;
    if (topic) filter["aiTags.topics"] = topic;
    if (status) filter.workflowStatus = status;
    if (read !== undefined) filter.read = read === "true";

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [messages, total] = await Promise.all([
      Message.find(filter)
        .sort({ receivedAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate("assignedTo", "name role")
        .lean(),
      Message.countDocuments(filter),
    ]);

    res.json({
      messages,
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

// GET /api/messages/:id
exports.getMessageById = async (req, res) => {
  try {
    const message = await Message.findById(req.params.id)
      .populate("assignedTo", "name role")
      .populate("caseId");

    if (!message) return res.status(404).json({ error: "Message not found" });

    res.json(message);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/messages
// Ingest a new message, auto-triage with Gemini, generate draft
exports.createMessage = async (req, res) => {
  try {
    const { type, channel, from, subject, body } = req.body;

    // Step 1: Create the message
    const message = new Message({
      type,
      channel,
      from,
      subject,
      body,
      receivedAt: new Date(),
    });

    // Step 2: AI triage with Gemini
    const aiTags = await triageMessage({ channel, from, subject, body });
    message.aiTags = aiTags;

    // Step 3: Generate AI draft (skip for flagged/threat messages)
    if (!aiTags.flags.includes("possible_threat")) {
      const draft = await generateDraft({ channel, from, subject, body }, aiTags);
      if (draft) {
        message.aiDraft = draft;
      }
    } else {
      message.workflowStatus = "flagged";
    }

    await message.save();

    res.status(201).json(message);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// PATCH /api/messages/:id/status
// Update workflow status (approve, archive, flag, etc.)
exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const message = await Message.findByIdAndUpdate(
      req.params.id,
      { workflowStatus: status },
      { new: true }
    );

    if (!message) return res.status(404).json({ error: "Message not found" });

    res.json(message);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// PATCH /api/messages/:id/assign
// Assign message to a staff member
exports.assignMessage = async (req, res) => {
  try {
    const { staffId } = req.body;
    const message = await Message.findByIdAndUpdate(
      req.params.id,
      { assignedTo: staffId, workflowStatus: "in_review" },
      { new: true }
    ).populate("assignedTo", "name role");

    if (!message) return res.status(404).json({ error: "Message not found" });

    res.json(message);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// PATCH /api/messages/:id/read
exports.markRead = async (req, res) => {
  try {
    const { staffId } = req.body;
    const message = await Message.findByIdAndUpdate(
      req.params.id,
      { read: true, readAt: new Date(), readBy: staffId },
      { new: true }
    );

    if (!message) return res.status(404).json({ error: "Message not found" });

    res.json(message);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// PATCH /api/messages/:id/draft
// Approve, reject, or edit the AI draft
exports.updateDraft = async (req, res) => {
  try {
    const { action, editedBody, staffId } = req.body;
    const update = {};

    if (action === "approve") {
      update["aiDraft.status"] = "approved";
      update["aiDraft.approvedBy"] = staffId;
      update["aiDraft.approvedAt"] = new Date();
    } else if (action === "reject") {
      update["aiDraft.status"] = "rejected";
    } else if (action === "edit") {
      update["aiDraft.status"] = "edited";
      update["aiDraft.editedBody"] = editedBody;
    } else if (action === "send") {
      update["aiDraft.status"] = "sent";
      update.workflowStatus = "sent";
    }

    const message = await Message.findByIdAndUpdate(req.params.id, update, {
      new: true,
    });

    if (!message) return res.status(404).json({ error: "Message not found" });

    res.json(message);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/messages/:id/retriage
// Re-run Gemini triage on an existing message
exports.retriageMessage = async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);
    if (!message) return res.status(404).json({ error: "Message not found" });

    const aiTags = await triageMessage({
      channel: message.channel,
      from: message.from,
      subject: message.subject,
      body: message.body,
    });

    message.aiTags = aiTags;
    await message.save();

    res.json(message);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/messages/stats
// Aggregated stats for dashboard metric cards
exports.getStats = async (req, res) => {
  try {
    const { role } = req.query;
    const filter = {};
    if (role) filter["aiTags.suggestedRoute"] = role;

    const [total, unread, critical, byStatus, bySentiment, byTopic] =
      await Promise.all([
        Message.countDocuments(filter),
        Message.countDocuments({ ...filter, read: false }),
        Message.countDocuments({ ...filter, "aiTags.urgency": "critical" }),
        Message.aggregate([
          { $match: filter },
          { $group: { _id: "$workflowStatus", count: { $sum: 1 } } },
        ]),
        Message.aggregate([
          { $match: filter },
          { $group: { _id: "$aiTags.sentiment", count: { $sum: 1 } } },
        ]),
        Message.aggregate([
          { $match: filter },
          { $unwind: "$aiTags.topics" },
          { $group: { _id: "$aiTags.topics", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 10 },
        ]),
      ]);

    res.json({
      total,
      unread,
      critical,
      byStatus: Object.fromEntries(byStatus.map((s) => [s._id, s.count])),
      bySentiment: Object.fromEntries(
        bySentiment.map((s) => [s._id, s.count])
      ),
      topTopics: byTopic.map((t) => ({ topic: t._id, count: t.count })),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
