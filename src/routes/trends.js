const express = require("express");
const router = express.Router();
const tc = require("../controllers/trendController");

router.get("/latest", tc.getLatestTrends);
router.get("/topics", tc.getTopicBreakdown);
router.get("/sentiment", tc.getSentimentTimeline);
router.get("/volume", tc.getVolumeTimeline);
router.get("/anomalies", tc.getAnomalies);
router.get("/geo", tc.getGeoData);

module.exports = router;
