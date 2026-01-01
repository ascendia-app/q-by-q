const express = require("express");
const router = express.Router();
// Add two dots and a slash before the word middleware
const auth = require("../middleware/authMiddleware.js");
const User = require('../models/User.js')

/**
 * @route   GET /api/dashboard/dashboard-data
 * @desc    Get logged in user data for dashboard
 * @access  Private
 */
router.get("/dashboard-data", auth, async (req, res) => {
    try {
        // req.user comes from your authmiddleware
        const user = await User.findById(req.user.id).select("-password");

        if (!user) {
            return res.status(404).json({ msg: "User not found" });
        }

        res.json({ user });
    } catch (err) {
        console.error("Dashboard Error:", err.message);
        res.status(500).send("Server Error");
    }
});

module.exports = router;