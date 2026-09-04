const Availability = require("../Models/Availability");
const Staff = require("../Models/Staff");
const Salon = require("../Models/Salon");

exports.getAvailabilityByStaff = async (req, res) => {
  try {
    const { staffId, date } = req.query;

    if (!staffId || !date) {
      return res.status(400).json({ message: "staffId and date are required" });
    }

    const availability = await Availability.findOne({ staff: staffId, date });

    if (!availability) {
      return res.json({ slots: [] });
    }

    res.json({ slots: availability.slots });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createAvailability = async (req, res) => {
  try {
    const { staff, date, slots } = req.body;

    if (!staff || !date || !Array.isArray(slots)) {
      return res.status(400).json({ message: "staff, date and slots are required" });
    }

    const staffData = await Staff.findById(staff);
    if (!staffData) {
      return res.status(404).json({ message: "Staff not found" });
    }

    const salon = await Salon.findById(staffData.salon);

    if (req.user.role === "salon_owner" && salon.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    let record = await Availability.findOne({ staff, date });

    if (!record) {
      record = await Availability.create({ staff, date, slots });
      return res.status(201).json({ message: "Availability created", record });
    }

    record.slots = slots;
    await record.save();

    res.json({ message: "Availability updated", record });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};