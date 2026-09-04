const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");

const {
  getStaffBySalon,
  createStaff,
  updateStaff
} = require("../controllers/staffController");

// allow public access to list staff for a salon (so users can view stylists without login)
router.get("/", getStaffBySalon);
router.post("/", protect, authorize("salon_owner", "admin"), createStaff);
router.put("/:id", protect, authorize("salon_owner", "admin"), updateStaff);

module.exports = router;