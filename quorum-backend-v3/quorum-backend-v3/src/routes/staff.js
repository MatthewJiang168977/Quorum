const express = require("express");
const router = express.Router();
const sc = require("../controllers/staffController");

router.get("/", sc.getStaff);
router.get("/:id", sc.getStaffById);
router.get("/:id/dashboard", sc.getDashboard);

module.exports = router;
