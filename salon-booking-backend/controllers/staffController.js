const Staff = require("../Models/Staff");
const Salon = require("../Models/Salon");

exports.getStaffBySalon = async (req, res) => {
  try {
    const { salonId } = req.query;

    if (!salonId) {
      return res.status(400).json({ message: "salonId is required" });
    }

    const staff = await Staff.find({ salon: salonId, isActive: true });

    res.json({ count: staff.length, staff });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createStaff = async (req, res) => {
  try {
    const { salon, name, role, specialty } = req.body;

    if (!salon || !name) {
      return res.status(400).json({ message: "salon and name are required" });
    }

    const salonData = await Salon.findById(salon);

    if (!salonData) {
      return res.status(404).json({ message: "Salon not found" });
    }

    if (req.user.role === "salon_owner" && salonData.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const staff = await Staff.create({
      salon,
      name,
      role: role || "stylist",
      specialty
    });

    res.status(201).json({ message: "Staff created", staff });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateStaff = async (req, res) => {
  try {
    const staff = await Staff.findById(req.params.id);

    if (!staff) {
      return res.status(404).json({ message: "Staff not found" });
    }

    const salon = await Salon.findById(staff.salon);

    if (req.user.role === "salon_owner" && salon.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    Object.assign(staff, req.body);
    await staff.save();

    res.json({ message: "Staff updated", staff });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};