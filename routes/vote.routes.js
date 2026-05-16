const express = require("express");

const {
  voteMeal,
  getTotalVotes,
} = require("../controllers/vote.controller");

const router = express.Router();


/**
 * @swagger
 * tags:
 *   name: Votes
 *   description: Meal voting APIs
 */


/**
 * @swagger
 * /api/votes/{mealId}:
 *   post:
 *     summary: Vote for a meal
 *     tags: [Votes]
 *
 *     parameters:
 *       - in: path
 *         name: mealId
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
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
 *               - voteType
 *               - deviceId
 *
 *             properties:
 *
 *               voteType:
 *                 type: string
 *                 enum: [UP, DOWN]
 *                 example: UP
 *
 *               deviceId:
 *                 type: string
 *                 example: abc123xyz
 *
 *     responses:
 *       201:
 *         description: Vote submitted successfully
 *
 *       409:
 *         description: Already voted
 *
 *       500:
 *         description: Internal server error
 */


router.post(
  "/:mealId",
  voteMeal
);


/**
 * @swagger
 * /api/votes/{mealId}/total:
 *   get:
 *     summary: Get meal votes
 *     tags: [Votes]
 *
 *     parameters:
 *       - in: path
 *         name: mealId
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *
 *     responses:
 *       200:
 *         description: Meal votes fetched successfully
 */


router.get(
  "/:mealId/total",
  getTotalVotes
);

module.exports = router;