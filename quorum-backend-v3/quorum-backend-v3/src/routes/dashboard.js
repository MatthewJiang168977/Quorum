const express = require("express");
const router = express.Router();
const dc = require("../controllers/dashboardController");

router.get("/:role", dc.getDashboard);

module.exports = router;
