// This middleware runs AFTER verifyToken
// It checks if the logged-in user has the correct role
// Used to separate student-only and society-only routes
// Example usage: router.post("/", verifyToken, verifyRole("society"), createPost)
const verifyRole = (role) => {
  // Returns a middleware function (this pattern is called a "middleware factory")
  return (req, res, next) => {
    // req.user.role was set by verifyToken middleware above
    // If the role doesn't match what this route requires, block access
    if (req.user.role !== role) {
      return res.status(403).json({ message: "Access denied. Wrong role." });
    }
    // Role matches — allow the request to continue
    next();
  };
};

export default verifyRole;
