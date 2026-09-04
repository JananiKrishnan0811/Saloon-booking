const express = require("express");

const router = express.Router();

const protect = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");

const {
    createSalon,
    getSalons,
    getSalonById,
    updateSalon
} = require("../controllers/salonController");

router.get("/", getSalons);

router.get("/:id", getSalonById);

router.post(
    "/",
    protect,
    authorize("salon_owner", "admin"),
    createSalon
);

router.put(
    "/:id",
    protect,
    authorize("salon_owner", "admin"),
    updateSalon
);

module.exports = router;