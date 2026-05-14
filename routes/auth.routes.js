const express = require("express");

const {
  sendMagicLink,
  verifyMagicLink,
  logout,
} = require("../controllers/auth.controller");

const authMiddleware = require(
  "../middleware/auth.middleware"
);

const adminMiddleware = require(
  "../middleware/admin.middleware"
);

const router = express.Router();


// PUBLIC
router.post(
  "/magic-link",
  sendMagicLink
);

router.get(
  "/verify",
  verifyMagicLink
);


// PROTECTED
router.post(
  "/logout",

  authMiddleware,

  logout
);


// ADMIN TEST
router.get(
  "/admin-test",

  authMiddleware,

  adminMiddleware,

  async (req, res) => {
    return res.status(200).json({
      success: true,
      user: req.user,
    });
  }
);

module.exports = router;