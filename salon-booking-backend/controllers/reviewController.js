const Review = require("../Models/Review");
const Appointment = require("../Models/Appointment");

exports.createReview = async (req, res) => {
    try {
        const {
            salon,
            appointment,
            rating,
            comment
        } = req.body;

        const existingReview =
            await Review.findOne({
                customer: req.user.id,
                appointment
            });

        if (existingReview) {
            return res.status(400).json({
                message:
                    "You have already reviewed this appointment"
            });
        }

        const booking =
            await Appointment.findOne({
                _id: appointment,
                customer: req.user.id,
                status: "completed"
            });

        if (!booking) {
            return res.status(400).json({
                message:
                    "Review is allowed only after completed appointment"
            });
        }

        const review = await Review.create({
            customer: req.user.id,
            salon,
            appointment,
            rating,
            comment
        });

        res.status(201).json({
            message: "Review submitted",
            review
        });
    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};