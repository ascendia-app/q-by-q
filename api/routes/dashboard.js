router.get("/dashboard-data", auth, async (req, res) => {
    try {
        // Log to Vercel console so we can see if the request hits this route
        console.log("Dashboard request received for user ID:", req.user.id);

        const user = await User.findById(req.user.id);

        if (!user) {
            console.error("User ID not found in database:", req.user.id);
            return res.status(404).json({ msg: "User not found" });
        }

        // Send back a clean object
        res.json({ 
            user: {
                email: user.email,
                id: user._id
            } 
        });
    } catch (err) {
        console.error("Dashboard Route Error:", err.message);
        res.status(500).json({ msg: "Server Error", error: err.message });
    }
});