require("dotenv").config(); // Add this line at the top
const jwt = require("jsonwebtoken");

module.exports = function (req, res, next) {
  // 1. Get the token from the Authorization header
  const authHeader = req.header("Authorization");

  // 2. Check if the header exists and starts with "Bearer "
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    console.log("❌ Auth Denied: No Bearer token found");
    return res.status(401).json({ msg: "No token, authorization denied" });
  }

  try {
    // 3. Extract the actual token string (remove "Bearer ")
    const token = authHeader.split(" ")[1];

    // 4. Verify the token using your secret from .env
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 5. Add the user data (id) to the request object
    req.user = decoded;
    
    console.log("✅ Token verified for user:", req.user.id);
    next();
  } catch (err) {
    console.error("❌ Token verification failed:", err.message);
    res.status(401).json({ msg: "Token is not valid" });
  }
};

