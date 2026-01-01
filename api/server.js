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
// Add an extra dot to go UP one folder to find the routes
// --- API ROUTES ---
// Corrected: Use "./" because the routes folder is INSIDE the api folder
const authRoutes = require("./routes/auth");
const dashboardRoutes = require("./routes/dashboard");
app.use("/api/auth", authRoutes);
app.use("/api/dashboard", dashboardRoutes);

// --- DATABASE CONNECTION ---
// On Vercel, we connect to MongoDB without app.listen()
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("✅ MongoDB Connected Successfully"))
    .catch(err => console.error("❌ MongoDB Connection Error:", err.message));

// --- GLOBAL ERROR HANDLER ---
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(err.status || 500).json({ 
        msg: "Internal Server Error"
    });
});

// CRITICAL: Export for Vercel
module.exports = app;