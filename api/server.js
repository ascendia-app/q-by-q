const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();

// --- 1. MIDDLEWARE ---
// Explicitly allow your Vercel domain and localhost for development
app.use(cors({
    origin: ["https://q-by-q.vercel.app", "http://localhost:3000", "http://127.0.0.1:5500"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
}));
app.use(express.json());

// --- 2. DATABASE CONNECTION ---
// In Vercel, we connect outside the routes to take advantage of connection pooling
const connectDB = async () => {
    if (mongoose.connection.readyState >= 1) return;
    
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ MongoDB Connected Successfully");
    } catch (err) {
        console.error("❌ MongoDB Connection Error:", err.message);
    }
};

// --- 3. HEALTH CHECK ROUTE ---
app.get("/api/health", async (req, res) => {
    await connectDB();
    res.status(200).json({ 
        status: "success", 
        message: "🚀 Backend is Running!",
        dbStatus: mongoose.connection.readyState === 1 ? "Connected" : "Disconnected"
    });
});

// --- 4. API ROUTES ---
// We call connectDB inside a middleware to ensure connection before every request
app.use(async (req, res, next) => {
    await connectDB();
    next();
});

const authRoutes = require("./routes/auth");
const dashboardRoutes = require("./routes/dashboard");

app.use("/api/auth", authRoutes);
app.use("/api/dashboard", dashboardRoutes);

// --- 5. GLOBAL ERROR HANDLER ---
app.use((err, req, res, next) => {
    console.error("Critical Server Error:", err.stack);
    res.status(err.status || 500).json({ 
        success: false,
        msg: "Internal Server Error",
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// --- 6. EXPORT FOR VERCEL ---
module.exports = app;