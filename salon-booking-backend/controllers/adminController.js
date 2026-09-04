const User = require("../Models/User");
const Salon = require("../Models/Salon");
const Staff = require("../Models/Staff");
const Service = require("../Models/Service");
const Appointment = require("../Models/Appointment");
const Review = require("../Models/Review");

exports.getDashboard = async (req, res) => {
    try {
        const cityFilter = req.query.city ? { city: { $regex: `^${req.query.city}$`, $options: "i" } } : {};
        const dashboardSalons = await Salon.find(cityFilter).select("_id");
        const dashboardSalonIds = dashboardSalons.map((salon) => salon._id);
        const [
            customers,
            salonOwners,
            salons,
            staff,
            services,
            appointments,
            reviews
        ] = await Promise.all([
            User.countDocuments({
                role: "customer"
            }),

            User.countDocuments({
                role: "salon_owner"
            }),

            Salon.countDocuments(cityFilter),

            Staff.countDocuments({ salon: { $in: dashboardSalonIds } }),

            Service.countDocuments({ salon: { $in: dashboardSalonIds } }),

            Appointment.countDocuments({ salon: { $in: dashboardSalonIds } }),

            Review.countDocuments()
        ]);

        const [customerRecords, salonRecords, serviceRecords, staffRecords, appointmentRecords] = await Promise.all([
            User.find({ role: "customer" }).select("name email phone").sort({ name: 1 }),
            Salon.find(cityFilter).populate("owner", "name email").sort({ name: 1 }),
            Service.find({ salon: { $in: dashboardSalonIds } }).populate("salon", "name city").sort({ name: 1 }),
            Staff.find({ salon: { $in: dashboardSalonIds } }).populate("salon", "name city").sort({ name: 1 }),
            Appointment.find({ salon: { $in: dashboardSalonIds } })
                .populate("customer", "name email")
                .populate("salon", "name city")
                .populate("service", "name price")
                .populate("staff", "name")
                .sort({ appointmentDate: 1, startTime: 1 })
                .limit(25)
        ]);

        res.json({
            statistics: {
                customers,
                salonOwners,
                salons,
                staff,
                services,
                appointments,
                reviews
            },
            customers: customerRecords,
            salons: salonRecords,
            services: serviceRecords,
            staff: staffRecords,
            appointments: appointmentRecords
        });

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};

exports.getOwnerDashboard = async (req, res) => {
    try {
        const salons = await Salon.find({ owner: req.user.id }).sort({ createdAt: -1 });
        const salonIds = salons.map((salon) => salon._id);
        const [staff, services, appointments] = await Promise.all([
            Staff.find({ salon: { $in: salonIds }, isActive: true }).populate("salon", "name"),
            Service.find({ salon: { $in: salonIds }, isActive: true }).populate("salon", "name"),
            Appointment.find({ salon: { $in: salonIds } })
                .populate("customer", "name email")
                .populate("salon", "name")
                .populate("service", "name price duration")
                .populate("staff", "name")
                .sort({ appointmentDate: 1, startTime: 1 })
        ]);

        res.json({
            statistics: {
                salons: salons.length,
                staff: staff.length,
                services: services.length,
                appointments: appointments.length
            },
            salons,
            staff,
            services,
            appointments
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};