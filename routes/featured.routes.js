const express =
  require("express");

const {

  toggleFeaturedController,

  getFeaturedListingsController,

} = require(
  "../controllers/featured.controller"
);

const authMiddleware =
  require("../middleware/auth.middleware");

const adminMiddleware =
  require("../middleware/admin.middleware");

const router =
  express.Router();


/**
 * @swagger
 * tags:
 *   name: Featured Listings
 *   description: Featured listings and map pin APIs
 */


/**
 * @swagger
 * /api/admin/featured:
 *   get:
 *     summary: Get all featured listings
 *     tags:
 *       - Featured Listings
 *
 *     parameters:
 *       - in: query
 *         name: search
 *         required: false
 *
 *         schema:
 *           type: string
 *
 *         example: momo
 *
 *         description: Search by restaurant name or dish name
 *
 *     responses:
 *       200:
 *         description: Featured listings fetched successfully
 *
 *         content:
 *           application/json:
 *
 *             schema:
 *               type: object
 *
 *               properties:
 *
 *                 success:
 *                   type: boolean
 *                   example: true
 *
 *                 count:
 *                   type: integer
 *                   example: 2
 *
 *                 data:
 *                   type: array
 *
 *                   items:
 *                     type: object
 *
 *                     properties:
 *
 *                       id:
 *                         type: integer
 *                         example: 1
 *
 *                       dishName:
 *                         type: string
 *                         example: Chicken Momos
 *
 *                       price:
 *                         type: number
 *                         example: 10
 *
 *                       isFeatured:
 *                         type: boolean
 *                         example: true
 *
 *                       featuredUntil:
 *                         type: string
 *                         example: 2026-05-30T23:59:00.000Z
 *
 *                       restaurant:
 *                         type: object
 *
 *                         properties:
 *
 *                           name:
 *                             type: string
 *                             example: Momo House
 *
 *                           suburb:
 *                             type: string
 *                             example: South Bank
 */
router.get(
  "/",
  authMiddleware,
  adminMiddleware,
  getFeaturedListingsController
);


/**
 * @swagger
 * /api/admin/featured/{mealId}:
 *   patch:
 *     summary: Toggle featured listing
 *     tags:
 *       - Featured Listings
 *
 *     security:
 *       - bearerAuth: []
 *
 *     parameters:
 *       - in: path
 *         name: mealId
 *         required: true
 *
 *         schema:
 *           type: integer
 *
 *         example: 1
 *
 *     requestBody:
 *       required: true
 *
 *       content:
 *         application/json:
 *
 *           schema:
 *             type: object
 *
 *             required:
 *               - isFeatured
 *
 *             properties:
 *
 *               isFeatured:
 *                 type: boolean
 *                 example: true
 *
 *               featuredUntil:
 *                 type: string
 *                 example: 2026-05-30T23:59:00.000Z
 *
 *     responses:
 *       200:
 *         description: Featured listing updated successfully
 *
 *         content:
 *           application/json:
 *
 *             schema:
 *               type: object
 *
 *               properties:
 *
 *                 success:
 *                   type: boolean
 *                   example: true
 *
 *                 message:
 *                   type: string
 *                   example: Listing featured successfully
 *
 *                 data:
 *                   type: object
 *
 *                   properties:
 *
 *                     id:
 *                       type: integer
 *                       example: 1
 *
 *                     dishName:
 *                       type: string
 *                       example: Chicken Momos
 *
 *                     isFeatured:
 *                       type: boolean
 *                       example: true
 *
 *                     featuredUntil:
 *                       type: string
 *                       example: 2026-05-30T23:59:00.000Z
 *
 *       401:
 *         description: Unauthorized
 */
router.patch(
  "/:mealId",
  authMiddleware,
  adminMiddleware,
  toggleFeaturedController
);
module.exports =router;