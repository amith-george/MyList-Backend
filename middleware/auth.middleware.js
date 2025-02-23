const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  // Expecting the token in the Authorization header in the format: "Bearer <token>"
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access Denied: No Token Provided' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid Token' });
    }
    // Attach the decoded token data (e.g., user ID) to the request object
    req.user = decoded;
    next();
  });
};

module.exports = authenticateToken;
