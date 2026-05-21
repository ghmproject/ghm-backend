const express = require("express");
const { updateProfileName } = require("../controllers/profile.controller");
const authMiddleware = require("../middleware/auth.middleware");

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Profile
 *   description: User profile APIs
 */

/**
 * @swagger
 * components:
 *   schemas:
 *
 *     UpdateProfileNameRequest:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         name:
 *           type: string
 *           example: Awais Jam
 *
 *     ProfileUser:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         name:
 *           type: string
 *           example: Awais Jam
 *         email:
 *           type: string
 *           example: awais@gmail.com
 *         role:
 *           type: string
 *           enum: [ADMIN, USER]
 *           example: USER
 *
 *     UpdateProfileNameResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: Profile updated successfully
 *         user:
 *           $ref: '#/components/schemas/ProfileUser'
 */

/**
 * @swagger
 * /api/profile/name:
 *   patch:
 *     summary: Update profile name
 *     description: Updates the signed-in user's display name only.
 *     tags:
 *       - Profile
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateProfileNameRequest'
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UpdateProfileNameResponse'
 *             example:
 *               success: true
 *               message: Profile updated successfully
 *               user:
 *                 id: 1
 *                 name: Awais Jam
 *                 email: awais@gmail.com
 *                 role: USER
 *       400:
 *         description: Name is required
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.patch("/name", authMiddleware, updateProfileName);

module.exports = router;
