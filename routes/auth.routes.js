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

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication APIs
 */


/**
 * @swagger
 * components:
 *   schemas:
 *
 *     MagicLinkRequest:
 *       type: object
 *
 *       required:
 *         - email
 *
 *       properties:
 *         email:
 *           type: string
 *           example: awais@gmail.com
 *
 *
 *     AuthSuccessResponse:
 *       type: object
 *
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *
 *         message:
 *           type: string
 *           example: Login successful
 *
 *         role:
 *           type: string
 *           example: ADMIN
 */


/**
 * @swagger
 * /api/auth/magic-link:
 *   post:
 *     summary: Send magic login link
 *     description: Sends email login link using SendGrid
 *     tags:
 *       - Auth
 *
 *     requestBody:
 *       required: true
 *
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MagicLinkRequest'
 *
 *     responses:
 *       200:
 *         description: Magic link sent successfully
 *
 *       400:
 *         description: Email is required
 *
 *       500:
 *         description: Internal server error
 */


// PUBLIC
router.post(
  "/magic-link",

  sendMagicLink
);


/**
 * @swagger
 * /api/auth/verify:
 *   get:
 *     summary: Verify magic login link
 *     description: Verifies JWT token and logs user in
 *     tags:
 *       - Auth
 *
 *     parameters:
 *       - in: query
 *         name: token
 *         required: true
 *
 *         schema:
 *           type: string
 *
 *         example: eyJhbGciOiJIUzI1Ni...
 *
 *     responses:
 *       200:
 *         description: Login successful
 *
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthSuccessResponse'
 *
 *       400:
 *         description: Token missing
 *
 *       401:
 *         description: Invalid or expired token
 */


router.get(
  "/verify",

  verifyMagicLink
);


/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout user
 *     description: Clears authentication cookie
 *     tags:
 *       - Auth
 *
 *     responses:
 *       200:
 *         description: Logged out successfully
 *
 *       401:
 *         description: Unauthorized
 */


// PROTECTED
router.post(
  "/logout",

  authMiddleware,

  logout
);


/**
 * @swagger
 * /api/auth/admin-test:
 *   get:
 *     summary: Admin protected test route
 *     description: Accessible only by admin users
 *     tags:
 *       - Auth
 *
 *     responses:
 *       200:
 *         description: Admin access granted
 *
 *       401:
 *         description: Unauthorized
 *
 *       403:
 *         description: Admin only
 */


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