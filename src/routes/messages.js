const express = require("express");
const router = express.Router();
const mc = require("../controllers/messageController");

router.get("/stats", mc.getStats);
router.get("/", mc.getMessages);
router.get("/:id", mc.getMessageById);
router.post("/", mc.createMessage);
router.patch("/:id/status", mc.updateStatus);
router.patch("/:id/assign", mc.assignMessage);
router.patch("/:id/read", mc.markRead);
router.patch("/:id/draft", mc.updateDraft);
router.post("/:id/retriage", mc.retriageMessage);

module.exports = router;
