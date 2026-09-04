const express = require("express");

const router = express.Router();

const protect = require("../middleware/authMiddleware");

const {
    createAppointment,
    getMyAppointments,
    cancelAppointment
} = require("../controllers/appointmentController");

router.post(
    "/",
    protect,
    createAppointment
);

router.get(
    "/my",
    protect,
    getMyAppointments
);

router.put(
    "/:id/cancel",
    protect,
    cancelAppointment
);

module.exports = router;