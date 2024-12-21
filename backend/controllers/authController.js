const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const User = require('../models/User'); 


exports.registerUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            email,
            password: hashedPassword,
        });

        await newUser.save();

        // Generate JWT token
        const token = jwt.sign({ email: newUser.email, id: newUser._id }, process.env.JWT_SECRET, {
            expiresIn: '7d', // Token expiration time
        });

        // Send the token and user details (email and id) in the response
        res.status(201).json({
            message: 'User registered and logged in successfully',
            token,
            user: {
                id: newUser._id,
                email: newUser.email,
            },
        });
    } catch (error) {
        res.status(500).json({ message: 'Error registering user', error: error.message });
    }
};

// User Login
exports.loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find the user in the database
        const user = await User.findOne({ email });

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // Generate JWT token
        const token = jwt.sign({ email: user.email, id: user._id }, process.env.JWT_SECRET, {
            expiresIn: '7d', // Token expiration time
        });

        res.status(200).json({ message: 'Login successful', token, user });
    } catch (error) {
        res.status(500).json({ message: 'Error logging in', error: error.message });
    }
};


// User Logout
exports.logoutUser = (req, res) => {

    // token to be removed from frontend just sending a sucess message
    res.status(200).json({ message: 'Logged out successfully' });
};

// Forgot Password, change
// reset password to be done