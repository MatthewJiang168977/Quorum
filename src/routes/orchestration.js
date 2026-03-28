const express = require("express");
const router = express.Router();
const oc = require("../controllers/orchestrationController");

// Core workflow
router.post("/process-case", oc.processCase);
router.post("/meeting-notes/:caseId", oc.addMeetingNotes);

// Notifications
router.get("/notifications/:staffId", oc.getNotifications);
router.patch("/notifications/:id/read", oc.markNotificationRead);

// Satisfaction
router.post("/satisfaction/:caseId", oc.submitSatisfaction);
router.get("/satisfaction/stats", oc.getSatisfactionStats);

module.exports = router;
