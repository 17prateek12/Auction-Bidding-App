const User = require('../models/User'); // Assuming you're using Mongoose for MongoDB

// Delete user account
exports.deleteAccount = async (req, res) => {
    try {
        // ..
        // Send a success message after deletion
        res.status(200).json({
            message: 'User account deleted successfully',
        });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting user account', error: error.message });
    }
};
