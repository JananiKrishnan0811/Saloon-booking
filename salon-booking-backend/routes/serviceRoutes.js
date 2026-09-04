const express = require("express");

const router = express.Router();

const protect = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");

const {
    createService,
    getServicesBySalon,
    updateService,
    deleteService
} = require("../controllers/serviceController");

// Get services for a salon
router.get("/salon/:salonId", getServicesBySalon);

// Create service
router.post(
    "/",
    protect,
    authorize("salon_owner", "admin"),
    createService
);

// Update service
router.put(
    "/:id",
    protect,
    authorize("salon_owner", "admin"),
    updateService
);

// Delete service
router.delete(
    "/:id",
    protect,
    authorize("salon_owner", "admin"),
    deleteService
);

module.exports = router;