require('dotenv').config(); // This MUST be at the very top of the file
console.log("🔍 Checking Secret:", process.env.JWT_SECRET ? "✅ Found" : "❌ Not Found");
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");


const app = express();

// --- 1. MIDDLEWARE ---
// Explicitly allow your Vercel domain and localhost for development
app.use(cors({
    origin: [
        "https://q-by-q.vercel.app", 
        "http://localhost:3000", 
        "http://localhost:5000", // Add this if you view the site here
        "http://127.0.0.1:5500", // Match Live Server exactly
        "http://localhost:5500"  // Sometimes Live Server uses 'localhost'
    ],
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
// Simple route to test if the server is alive
app.get("/", (req, res) => {
    res.send("Server is running perfectly on port 5000!");
});
// --- 4. API ROUTES ---
// We call connectDB inside a middleware to ensure connection before every request
app.use(async (req, res, next) => {
    await connectDB();
    next();
});





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
// At the end of server.js
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`✅ Server is running on http://localhost:${PORT}`);
});

module.exports = app; // Keep this for Vercel