const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();

// --- MIDDLEWARE ---
// Use cors() to allow cross-origin requests from your frontend
app.use(cors()); 
app.use(express.json());

// --- HEALTH CHECK ROUTE ---
app.get("/", (req, res) => {
    res.status(200).send("🚀 Backend is Running! Port is active.");
});

// --- API ROUTES ---
const authRoutes = require("./routes/auth");
const dashboardRoutes = require("./routes/dashboard"); 

app.use("/api/auth", authRoutes);
app.use("/api/dashboard", dashboardRoutes);

// --- DATABASE CONNECTION ---
// We connect to MongoDB before starting the server listener
const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log("✅ MongoDB Connected Successfully");
        
        // Only start the server once DB is connected
        if (process.env.NODE_ENV !== 'test') {
            app.listen(PORT, () => {
                console.log(`🚀 Server is live at http://localhost:${PORT}`);
            });
        }
    })
    .catch(err => {
        console.error("❌ MongoDB Connection Error:", err.message);
        process.exit(1); // Stop the app if DB fails
    });

// --- GLOBAL ERROR HANDLER ---
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(err.status || 500).json({ 
        msg: "Internal Server Error", 
        error: process.env.NODE_ENV === 'development' ? err.message : "Something went wrong" 
    });
});

// Required for Vercel deployment
module.exports = app;