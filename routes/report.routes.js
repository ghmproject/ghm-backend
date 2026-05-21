const express = require("express");

const {
  createReportController,
  getMyReportStatusController,
  getReportsController,
} = require("../controllers/report.controller");

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
 *   name: Reports
 *   description: Listing report APIs
 */


/**
 * @swagger
 * /api/reports:
 *   post:
 *     summary: Report a listing
 *     description: |
 *       Signed-in users only. One report per account per meal.
 *       After three reports for the same meal, the listing is automatically hidden from public APIs until an admin restores it.
 *     tags:
 *       - Reports
 *
 *     security:
 *       - bearerAuth: []
 *
 *     requestBody:
 *       required: true
 *
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *
 *             required:
 *               - mealId
 *               - reason
 *
 *             properties:
 *
 *               mealId:
 *                 type: integer
 *                 example: 1
 *
 *               reason:
 *                 type: string
 *                 example: Price has gone up
 *
 *     responses:
 *       201:
 *         description: Listing reported successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                 reportCount:
 *                   type: integer
 *                   description: Total reports for this meal after this submission
 *                 mealAutoHidden:
 *                   type: boolean
 *                   description: True when this report reached the threshold and the meal was auto-hidden
 *
 *       400:
 *         description: Validation error
 *
 *       401:
 *         description: Sign in required
 *
 *       409:
 *         description: Already reported this meal
 *
 *       404:
 *         description: Meal not found
 *
 *       500:
 *         description: Internal server error
 */


// MY REPORT STATUS FOR MEAL
router.get(
  "/meal/:mealId/mine",
  authMiddleware,
  getMyReportStatusController
);

// CREATE REPORT (one per user per meal)
router.post(
  "/",
  authMiddleware,
  createReportController
);


/**
 * @swagger
 * /api/reports:
 *   get:
 *     summary: Get all reports
 *     description: Admin can view all flagged listings
 *     tags:
 *       - Reports
 *
 *     security:
 *       - bearerAuth: []
 *
 *     responses:
 *       200:
 *         description: Reports fetched successfully
 *
 *       401:
 *         description: Unauthorized
 *
 *       500:
 *         description: Internal server error
 */


// GET ALL REPORTS
router.get(
  "/",
  authMiddleware,
  adminMiddleware,
  getReportsController
);

module.exports = router;