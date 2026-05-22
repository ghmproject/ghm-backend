const jwt = require("jsonwebtoken");

const authMiddleware = require("./auth.middleware");
const getTokenFromRequest = authMiddleware.getTokenFromRequest;

/** Sets `req.user` when a valid token is present; does not block guests. */
const optionalAuthMiddleware = (req, res, next) => {
  try {
    const token = getTokenFromRequest(req);

    if (!token) {
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    return next();
  } catch {
    return next();
  }
};

module.exports = optionalAuthMiddleware;
