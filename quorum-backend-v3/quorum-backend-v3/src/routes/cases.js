const express = require("express");
const router = express.Router();
const cc = require("../controllers/caseController");

router.get("/stats", cc.getCaseStats);
router.get("/", cc.getCases);
router.get("/:id", cc.getCaseById);
router.post("/", cc.createCase);
router.patch("/:id/status", cc.updateCaseStatus);
router.post("/:id/notes", cc.addNote);

module.exports = router;
