import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

export const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token provided" });
  }

  const token = authHeader.split(" ")[1];
  // defensive: ensure token exists after the "Bearer " prefix
  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    console.error("❌ Token verification failed:", error.message);
    // Include error detail only in non-production environments to help debugging
    if (process.env.NODE_ENV && process.env.NODE_ENV !== "production") {
      return res.status(403).json({ message: "Invalid token", error: error.message });
    }
    return res.status(403).json({ message: "Invalid token" });
  }
};

// Export alias for consistency with other middleware
export const authenticate = verifyToken;
