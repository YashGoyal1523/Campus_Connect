import jwt from "jsonwebtoken";

// This middleware runs BEFORE any protected route handler
// It checks if the request has a valid JWT token
// If valid → attaches user info to req.user and calls next()
// If invalid → blocks the request with 401 Unauthorized
const verifyToken = (req, res, next) => {
  // Token comes in the Authorization header as: "Bearer <token>"
  // We split by space and take the second part (the actual token)
  const token = req.headers.authorization?.split(" ")[1];

  // If no token found, reject the request immediately
  if (!token) {
    return res.status(401).json({ message: "No token, authorization denied" });
  }

  try {
    // jwt.verify checks if the token is valid AND not expired
    // If valid, it decodes the payload (id, role, name) that was stored when token was created
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach decoded user info to req so route handlers can use it
    // e.g. req.user.id, req.user.role, req.user.name
    req.user = decoded;

    // Call next() to pass control to the next middleware or route handler
    next();
  } catch (error) {
    // jwt.verify throws if token is expired or tampered with
    return res.status(401).json({ message: "Token is not valid" });
  }
};

export default verifyToken;
