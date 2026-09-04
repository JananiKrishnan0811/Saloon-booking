const mongoose = require("mongoose");

const staffSchema = new mongoose.Schema(
    {
        salon: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Salon",
            required: true
        },
        name: {
            type: String,
            required: true
        },
        role: {
            type: String,
            default: "stylist"
        },
        specialty: {
            type: String
        },
        isActive: {
            type: Boolean,
            default: true
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Staff", staffSchema);
