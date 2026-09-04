const jwt = require('jsonwebtoken');
const User = require('../Models/User');

const generateToken = (user) => {
    return jwt.sign({ id: user._id, role: user.role, name: user.name, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

exports.register = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ message: 'Name, email and password are required' });
        }

        const exists = await User.findOne({ email });
        if (exists) return res.status(400).json({ message: 'User already exists' });

        const allowedRegistrationRoles = ['customer', 'salon_owner'];
        const user = await User.create({
            name,
            email,
            password,
            role: allowedRegistrationRoles.includes(role) ? role : 'customer'
        });

        res.status(201).json({ token: generateToken(user), user: { _id: user._id, name: user.name, email: user.email, role: user.role } });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ message: 'Email and password required' });

        const user = await User.findOne({ email });
        if (!user) return res.status(401).json({ message: 'Invalid credentials' });

        const match = await user.matchPassword(password);
        if (!match) return res.status(401).json({ message: 'Invalid credentials' });

        res.json({ token: generateToken(user), user: { _id: user._id, name: user.name, email: user.email, role: user.role } });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};