const express = require("express");

const router = express.Router();

const protect = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");

const {
    getDashboard,
    getOwnerDashboard
} = require("../controllers/adminController");

router.get(
    "/dashboard",
    protect,
    authorize("admin"),
    getDashboard
);

router.get(
    "/owner-dashboard",
    protect,
    authorize("salon_owner"),
    getOwnerDashboard
);

module.exports = router;