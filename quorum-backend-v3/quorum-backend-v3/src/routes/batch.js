const express = require("express");
const router = express.Router();
const bc = require("../controllers/batchController");

router.get("/search", bc.search);
router.post("/approve", bc.batchApprove);
router.post("/send", bc.batchSend);
router.post("/assign", bc.batchAssign);
router.post("/archive", bc.batchArchive);
router.post("/auto-case", bc.batchAutoCase);

module.exports = router;
