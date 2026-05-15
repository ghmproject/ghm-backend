const express = require("express");

const {
  getPendingRequests,
  approveRequest,
  rejectRequest,
} = require("../controllers/admin.controller");

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
 *   name: Admin
 *   description: Admin moderation APIs
 */


/**
 * @swagger
 * components:
 *   schemas:
 *
 *     RestaurantSchema:
 *       type: object
 *
 *       properties:
 *
 *         id:
 *           type: integer
 *           example: 1
 *
 *         name:
 *           type: string
 *           example: Momo House
 *
 *         suburb:
 *           type: string
 *           example: West End
 *
 *         image:
 *           type: string
 *           example: https://res.cloudinary.com/demo/image/upload/sample.jpg
 *
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: 2026-05-14T11:00:00.000Z
 *
 *
 *     MealSchema:
 *       type: object
 *
 *       properties:
 *
 *         id:
 *           type: integer
 *           example: 1
 *
 *         restaurantId:
 *           type: integer
 *           example: 1
 *
 *         dishName:
 *           type: string
 *           example: Chicken Momos
 *
 *         price:
 *           type: number
 *           example: 8
 *
 *         status:
 *           type: string
 *           example: PENDING
 *
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: 2026-05-14T11:00:00.000Z
 *
 *         restaurant:
 *           $ref: '#/components/schemas/RestaurantSchema'
 *
 *
 *     ModerationResponse:
 *       type: object
 *
 *       properties:
 *
 *         success:
 *           type: boolean
 *           example: true
 *
 *         message:
 *           type: string
 *           example: Meal approved successfully
 *
 *         data:
 *           $ref: '#/components/schemas/MealSchema'
 */


/**
 * @swagger
 * /api/admin/pending:
 *   get:
 *     summary: Get all pending moderation requests
 *     description: Returns all pending meal submissions for admin moderation
 *     tags:
 *       - Admin
 *
 *     responses:
 *       200:
 *         description: Pending requests fetched successfully
 *
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *
 *               items:
 *                 $ref: '#/components/schemas/MealSchema'
 *
 *       401:
 *         description: Unauthorized
 *
 *       403:
 *         description: Admin only
 *
 *       500:
 *         description: Internal server error
 */


// ======================================
// GET ALL PENDING REQUESTS
// ======================================
router.get(
  "/pending",

  authMiddleware,

  adminMiddleware,

  getPendingRequests
);


/**
 * @swagger
 * /api/admin/approve/{id}:
 *   patch:
 *     summary: Approve meal submission
 *     description: Admin approves a pending meal request
 *     tags:
 *       - Admin
 *
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *
 *         schema:
 *           type: integer
 *
 *         example: 1
 *
 *     responses:
 *       200:
 *         description: Meal approved successfully
 *
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ModerationResponse'
 *
 *       401:
 *         description: Unauthorized
 *
 *       403:
 *         description: Admin only
 *
 *       500:
 *         description: Internal server error
 */


// ======================================
// APPROVE REQUEST
// ======================================
router.patch(
  "/approve/:id",

  authMiddleware,

  adminMiddleware,

  approveRequest
);


/**
 * @swagger
 * /api/admin/reject/{id}:
 *   patch:
 *     summary: Reject meal submission
 *     description: Admin rejects a pending meal request
 *     tags:
 *       - Admin
 *
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *
 *         schema:
 *           type: integer
 *
 *         example: 1
 *
 *     responses:
 *       200:
 *         description: Meal rejected successfully
 *
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ModerationResponse'
 *
 *       401:
 *         description: Unauthorized
 *
 *       403:
 *         description: Admin only
 *
 *       500:
 *         description: Internal server error
 */


// ======================================
// REJECT REQUEST
// ======================================
router.patch(
  "/reject/:id",

  authMiddleware,

  adminMiddleware,

  rejectRequest
);

module.exports = router;