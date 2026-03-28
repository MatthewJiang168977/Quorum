const Case = require("../models/Case");
const Message = require("../models/Message");
const EmployeeProfile = require("../models/EmployeeProfile");
const Notification = require("../models/Notification");
const Satisfaction = require("../models/Satisfaction");
const {
  orchestrateCaseProcessing,
  processMeetingNotes,
  notifyTeam,
} = require("../services/orchestrationService");

// POST /api/orchestrate/process-case
// The main endpoint: takes a message, creates a case, runs all 3 AI agents,
// assigns employee, notifies team
exports.processCase = async (req, res) => {
  try {
    const { messageId, meetingNotes } = req.body;

    // 1. Get the message
    const message = await Message.findById(messageId);
    if (!message) return res.status(404).json({ error: "Message not found" });

    // 2. Create or get existing case
    let caseDoc;
    if (message.caseId) {
      caseDoc = await Case.findById(message.caseId);
    }

    if (!caseDoc) {
      const deadline = new Date();
      deadline.setDate(deadline.getDate() + 14);

      // Generate unique case number: QRM-YYYY-NNNNN
      const year = new Date().getFullYear();
      const count = await Case.countDocuments();
      const caseNumber = `QRM-${year}-${String(count + 1).padStart(5, "0")}`;

      caseDoc = new Case({
        messageId: message._id,
        constituent: message.from.name,
        subject: message.subject,
        agency: message.aiTags.agency || "Unknown",
        agencyReference: message.aiTags.caseReference,
        priority: message.aiTags.urgency || "normal",
        deadline,
        slaDays: 14,
        caseNumber,
        notes: [
          {
            author: "system",
            text: `Case ${caseNumber} created. Starting AI orchestration pipeline.`,
            timestamp: new Date(),
          },
        ],
      });
      await caseDoc.save();
      await Message.findByIdAndUpdate(messageId, { caseId: caseDoc._id });
    }

    // 3. Run the orchestration pipeline (parallel AI agents)
    const orchestrationResult = await orchestrateCaseProcessing(
      caseDoc,
      message,
      meetingNotes || null
    );

    // 4. Update the case with orchestration results
    const updates = {
      priority:
        orchestrationResult.severity.overallPriority >= 8
          ? "critical"
          : orchestrationResult.severity.overallPriority >= 6
          ? "high"
          : orchestrationResult.severity.overallPriority >= 4
          ? "normal"
          : "low",
      lastActivity: new Date(),
    };

    // Set recommended SLA from severity agent
    if (orchestrationResult.severity.recommendedSLA) {
      const newDeadline = new Date();
      newDeadline.setDate(
        newDeadline.getDate() + orchestrationResult.severity.recommendedSLA
      );
      updates.deadline = newDeadline;
      updates.slaDays = orchestrationResult.severity.recommendedSLA;
    }

    // Auto-assign if employee suggestion exists
    if (orchestrationResult.employeeSuggestion.recommended?.employeeId) {
      updates.assignedTo =
        orchestrationResult.employeeSuggestion.recommended.employeeId;
      updates.status = "in_progress";
    }

    // Add orchestration notes
    const notesToAdd = [
      {
        author: "ai-severity-agent",
        text: `Severity: ${orchestrationResult.severity.overallPriority}/10. ${orchestrationResult.severity.reasoning}`,
        timestamp: new Date(),
      },
      {
        author: "ai-employee-agent",
        text: `Recommended: ${orchestrationResult.employeeSuggestion.recommended?.name || "Manual assignment needed"}. ${orchestrationResult.employeeSuggestion.reasoning}`,
        timestamp: new Date(),
      },
    ];

    if (orchestrationResult.meetingAnalysis) {
      notesToAdd.push({
        author: "ai-meeting-agent",
        text: `Meeting summary: ${orchestrationResult.meetingAnalysis.summary}. Key decisions: ${orchestrationResult.meetingAnalysis.keyDecisions.join("; ") || "None recorded"}.`,
        timestamp: new Date(),
      });
    }

    updates.$push = { notes: { $each: notesToAdd } };

    await Case.findByIdAndUpdate(caseDoc._id, updates);

    // 5. Update employee caseload
    if (orchestrationResult.employeeSuggestion.recommended?.employeeId) {
      await EmployeeProfile.findOneAndUpdate(
        {
          staffId:
            orchestrationResult.employeeSuggestion.recommended.employeeId,
        },
        { $inc: { "availability.currentCaseload": 1 } }
      );
    }

    // 6. Notify team
    const notificationCount = await notifyTeam(caseDoc, orchestrationResult);

    // 7. Return full result
    const updatedCase = await Case.findById(caseDoc._id)
      .populate("assignedTo", "name role")
      .populate("messageId");

    res.status(201).json({
      case: updatedCase,
      orchestration: orchestrationResult,
      notificationsSent: notificationCount,
    });
  } catch (err) {
    console.error("Orchestration error:", err);
    res.status(500).json({ error: err.message });
  }
};

// POST /api/orchestrate/meeting-notes/:caseId
// Add meeting notes to an existing case and re-run analysis
exports.addMeetingNotes = async (req, res) => {
  try {
    const caseDoc = await Case.findById(req.params.caseId);
    if (!caseDoc) return res.status(404).json({ error: "Case not found" });

    const { text, audioTranscript, attendees } = req.body;

    // Process meeting notes with Agent 2
    const meetingResult = await processMeetingNotes({
      text,
      audioTranscript,
      caseSubject: caseDoc.subject,
      attendees,
    });

    // Append to case
    await Case.findByIdAndUpdate(caseDoc._id, {
      $push: {
        notes: {
          author: "ai-meeting-agent",
          text: `Meeting analysis: ${meetingResult.summary}\n\nKey points: ${meetingResult.keyPoints.join("; ")}\n\nAction items: ${meetingResult.actionItems.map((a) => `${a.task} (${a.priority})`).join("; ")}`,
          timestamp: new Date(),
        },
      },
      lastActivity: new Date(),
    });

    res.json({
      caseId: caseDoc._id,
      meetingAnalysis: meetingResult,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/orchestrate/notifications/:staffId
exports.getNotifications = async (req, res) => {
  try {
    const { unreadOnly } = req.query;
    const filter = { recipient: req.params.staffId };
    if (unreadOnly === "true") filter.read = false;

    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .limit(50)
      .populate("caseId", "subject agency priority")
      .lean();

    const unreadCount = await Notification.countDocuments({
      recipient: req.params.staffId,
      read: false,
    });

    res.json({ notifications, unreadCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// PATCH /api/orchestrate/notifications/:id/read
exports.markNotificationRead = async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { read: true, readAt: new Date() },
      { new: true }
    );

    if (!notification)
      return res.status(404).json({ error: "Notification not found" });

    res.json(notification);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/orchestrate/satisfaction/:caseId
// Submit client satisfaction after case resolution
exports.submitSatisfaction = async (req, res) => {
  try {
    const caseDoc = await Case.findById(req.params.caseId).populate(
      "messageId"
    );
    if (!caseDoc) return res.status(404).json({ error: "Case not found" });

    const { rating, feedback, responseTime, wouldRecommend } = req.body;

    const satisfaction = new Satisfaction({
      caseId: caseDoc._id,
      constituent: {
        name: caseDoc.constituent,
        email: caseDoc.messageId?.from?.email,
      },
      rating,
      feedback,
      responseTime,
      wouldRecommend,
    });

    await satisfaction.save();

    // Update employee profile metrics if case was assigned
    if (caseDoc.assignedTo) {
      const profile = await EmployeeProfile.findOne({
        staffId: caseDoc.assignedTo,
      });
      if (profile) {
        const totalRatings = profile.metrics.totalCasesResolved || 0;
        const currentAvg = profile.metrics.avgSatisfactionScore || 0;
        const newAvg =
          (currentAvg * totalRatings + rating) / (totalRatings + 1);

        await EmployeeProfile.findOneAndUpdate(
          { staffId: caseDoc.assignedTo },
          {
            "metrics.avgSatisfactionScore": Math.round(newAvg * 10) / 10,
          }
        );
      }
    }

    // Notify team lead of feedback
    const teamLead = await Staff.findOne({ role: "chief_of_staff" });
    if (teamLead) {
      await Notification.create({
        recipient: teamLead._id,
        type: "satisfaction_received",
        caseId: caseDoc._id,
        title: `Feedback received: ${rating}/5 stars`,
        body: `${caseDoc.constituent} rated case "${caseDoc.subject}" ${rating}/5. ${feedback || "No written feedback."}`,
      });
    }

    res.status(201).json(satisfaction);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/orchestrate/satisfaction/stats
exports.getSatisfactionStats = async (req, res) => {
  try {
    const stats = await Satisfaction.aggregate([
      {
        $group: {
          _id: null,
          avgRating: { $avg: "$rating" },
          totalResponses: { $sum: 1 },
          wouldRecommend: {
            $sum: { $cond: ["$wouldRecommend", 1, 0] },
          },
          responseTimeDist: { $push: "$responseTime" },
        },
      },
    ]);

    const ratingDist = await Satisfaction.aggregate([
      { $group: { _id: "$rating", count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    res.json({
      avgRating: stats[0]
        ? Math.round(stats[0].avgRating * 10) / 10
        : null,
      totalResponses: stats[0]?.totalResponses || 0,
      recommendRate: stats[0]
        ? Math.round(
            (stats[0].wouldRecommend / stats[0].totalResponses) * 100
          )
        : null,
      ratingDistribution: Object.fromEntries(
        ratingDist.map((r) => [r._id, r.count])
      ),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = exports;
