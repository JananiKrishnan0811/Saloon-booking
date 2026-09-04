const Salon = require("../Models/Salon");
const Service = require("../Models/Service");

// Create salon
exports.createSalon = async (req, res) => {
    try {
        const salon = await Salon.create({
            ...req.body,
            owner: req.user.id
        });

        res.status(201).json({
            message: "Salon created successfully",
            salon
        });
    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};

// Get all salons
exports.getSalons = async (req, res) => {
    try {
        const { city, search, type } = req.query;

        const filter = {
            isActive: true
        };

        if (city) {
            filter.city = { $regex: `^${city}$`, $options: 'i' };
        }

        let salons = await Salon.find(filter)
            .populate("owner", "name email");

        if (search) {
            const searchTokens = search
                .toLowerCase()
                .replace(/&/g, " and ")
                .split(/[^a-z0-9]+/)
                .filter((token) => token && token !== "and");
            const compactSearch = searchTokens.join("");
            const matchingServices = type === "salon"
                ? []
                : await Service.find({ isActive: true }).select("salon name");
            const salonIdsFromServices = matchingServices
                .filter((service) => {
                    const serviceName = (service.name || "").toLowerCase();
                    const compactServiceName = serviceName.replace(/[^a-z0-9]/g, "");
                    return compactServiceName.includes(compactSearch) || searchTokens.every((token) => serviceName.includes(token));
                })
                .map((service) => service.salon.toString());

            salons = salons.filter((salon) => {
                const salonName = (salon.name || "").toLowerCase();
                const compactSalonName = salonName.replace(/[^a-z0-9]/g, "");
                const matchesSalon = compactSalonName.includes(compactSearch) || searchTokens.every((token) => salonName.includes(token));
                const matchesService = salonIdsFromServices.includes(salon._id.toString());
                return type === "service" ? matchesService : type === "salon" ? matchesSalon : matchesSalon || matchesService;
            });
        }

        res.json({
            count: salons.length,
            salons
        });
    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};

// Get salon by ID
exports.getSalonById = async (req, res) => {
    try {
        const salon = await Salon.findById(req.params.id)
            .populate("owner", "name email");

        if (!salon) {
            return res.status(404).json({
                message: "Salon not found"
            });
        }

        res.json(salon);
    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};

// Update salon
exports.updateSalon = async (req, res) => {
    try {
        const salon = await Salon.findOneAndUpdate(
            {
                _id: req.params.id,
                owner: req.user.id
            },
            req.body,
            {
                new: true
            }
        );

        if (!salon) {
            return res.status(404).json({
                message: "Salon not found or unauthorized"
            });
        }

        res.json({
            message: "Salon updated",
            salon
        });
    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};