const mongoose = require("mongoose");

const availabilitySchema = new mongoose.Schema(
    {
        staff: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Staff",
            required: true
        },
        date: {
            type: String,
            required: true
        },
        slots: [
            {
                startTime: String,
                endTime: String,
                available: { type: Boolean, default: true }
            }
        ]
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Availability", availabilitySchema);
