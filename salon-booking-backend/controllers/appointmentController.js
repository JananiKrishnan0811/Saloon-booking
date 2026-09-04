const Appointment = require("../Models/Appointment");
const Service = require("../Models/Service");
const Salon = require("../Models/Salon");
const Staff = require("../Models/Staff");
exports.createAppointment = async (req, res) => {
    try {
        const {
            salon,
            service,
            staff,
            appointmentDate,
            startTime
        } = req.body;

        const serviceData = await Service.findById(service);

        if (!serviceData) {
            return res.status(404).json({ message: "Service not found" });
        }

        const [salonData, staffData] = await Promise.all([
            Salon.findById(salon),
            Staff.findById(staff)
        ]);

        if (!salonData || !staffData) {
            return res.status(404).json({ message: "Salon or stylist not found" });
        }

        if (serviceData.salon.toString() !== salon || staffData.salon.toString() !== salon) {
            return res.status(400).json({ message: "Salon, service and stylist must belong together" });
        }

        const timeToMinutes = (time) => {
            const [hours, minutes] = time.split(":").map(Number);
            return hours * 60 + minutes;
        };

        const minutesToTime = (minutes) => {
            const hours = Math.floor(minutes / 60);
            const mins = minutes % 60;
            return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
        };

        const startMinutes = timeToMinutes(startTime);
        const endMinutes = startMinutes + serviceData.duration;
        const endTime = minutesToTime(endMinutes);

        const overlappingAppointment = await Appointment.findOne({
            staff,
            appointmentDate,
            status: { $in: ["booked", "confirmed"] },
            $or: [
                {
                    startTime: { $lt: endTime },
                    endTime: { $gt: startTime }
                }
            ]
        });

        if (overlappingAppointment) {
            return res.status(409).json({ message: "This stylist is already booked for this time" });
        }

        const appointment = await Appointment.create({
            customer: req.user.id,
            salon,
            service,
            staff,
            appointmentDate,
            startTime,
            endTime,
            price: serviceData.price
        });

        const populatedAppointment = await Appointment.findById(appointment._id)
            .populate("customer", "name email")
            .populate("salon", "name")
            .populate("service", "name price duration")
            .populate("staff", "name");

        res.status(201).json({ message: "Appointment booked successfully", appointment: populatedAppointment });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getMyAppointments = async (req, res) => {
    try {
        const appointments = await Appointment.find({ customer: req.user.id })
            .populate("salon", "name address")
            .populate("service", "name price duration")
            .populate("staff", "name")
            .sort({ appointmentDate: -1, startTime: -1 });

        res.json({ count: appointments.length, appointments });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.cancelAppointment = async (req, res) => {
    try {
        const appointment = await Appointment.findOne({ _id: req.params.id, customer: req.user.id });

        if (!appointment) {
            return res.status(404).json({ message: "Appointment not found" });
        }

        if (appointment.status === "completed") {
            return res.status(400).json({ message: "Completed appointment cannot be cancelled" });
        }

        appointment.status = "cancelled";
        await appointment.save();

        res.json({ message: "Appointment cancelled successfully", appointment });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};