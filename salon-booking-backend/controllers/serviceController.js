const Service = require("../Models/Service");
const Salon = require("../Models/Salon");

// Create service
exports.createService = async (req, res) => {
    try {
        const {
            salon,
            name,
            category,
            description,
            price,
            duration
        } = req.body;

        if (
            !salon ||
            !name ||
            !category ||
            price === undefined ||
            !duration
        ) {
            return res.status(400).json({
                message:
                    "Salon, name, category, price and duration are required"
            });
        }

        const salonData = await Salon.findById(salon);

        if (!salonData) {
            return res.status(404).json({
                message: "Salon not found"
            });
        }

        // Salon owner can only add services to their own salon
        if (
            req.user.role === "salon_owner" &&
            salonData.owner.toString() !== req.user.id
        ) {
            return res.status(403).json({
                message:
                    "You can only manage your own salon"
            });
        }

        const service = await Service.create({
            salon,
            name,
            category,
            description,
            price,
            duration
        });

        res.status(201).json({
            message: "Service created successfully",
            service
        });

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};


// Get services by salon
exports.getServicesBySalon = async (req, res) => {
    try {
        const services = await Service.find({
            salon: req.params.salonId,
            isActive: true
        }).sort({
            category: 1,
            name: 1
        });

        res.json({
            count: services.length,
            services
        });

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};


// Update service
exports.updateService = async (req, res) => {
    try {
        const service = await Service.findById(
            req.params.id
        );

        if (!service) {
            return res.status(404).json({
                message: "Service not found"
            });
        }

        const salon = await Salon.findById(
            service.salon
        );

        if (
            req.user.role === "salon_owner" &&
            salon.owner.toString() !== req.user.id
        ) {
            return res.status(403).json({
                message: "Unauthorized"
            });
        }

        Object.assign(service, req.body);

        await service.save();

        res.json({
            message: "Service updated successfully",
            service
        });

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};


// Delete service
exports.deleteService = async (req, res) => {
    try {
        const service = await Service.findById(
            req.params.id
        );

        if (!service) {
            return res.status(404).json({
                message: "Service not found"
            });
        }

        const salon = await Salon.findById(
            service.salon
        );

        if (
            req.user.role === "salon_owner" &&
            salon.owner.toString() !== req.user.id
        ) {
            return res.status(403).json({
                message: "Unauthorized"
            });
        }

        service.isActive = false;

        await service.save();

        res.json({
            message: "Service deleted successfully"
        });

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};