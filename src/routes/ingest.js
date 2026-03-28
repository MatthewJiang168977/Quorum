const express = require("express");
const router = express.Router();
const ic = require("../controllers/ingestController");

// Multimodal ingest
router.post("/audio", ic.ingestAudio);
router.post("/image", ic.ingestImage);
router.post("/document", ic.ingestDocument);

// News pipeline
router.post("/news", ic.ingestNews);

module.exports = router;
