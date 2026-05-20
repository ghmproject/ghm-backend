const express = require("express");

const {
  getSuburbRankings,
  getRestaurantRankings,
} = require("../controllers/rankingSystem.controller");

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Rankings
 *   description: Popularity rankings — suburbs and restaurants (Top cheap eats UI)
 */

/**
 * @swagger
 * /api/ranking/suburbs:
 *   get:
 *     summary: Rank suburbs by popularity
 *     description: |
 *       Suburb leaderboard (tabs like West End, Fortitude Valley).
 *       Uses votes, activity (14d), and engagement on all public meals in each suburb.
 *     tags: [Rankings]
 *     parameters:
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [votes, activity, engagement, popularity]
 *         description: Default popularity
 *     responses:
 *       200:
 *         description: Ranked suburbs
 */
router.get("/suburbs", getSuburbRankings);

/**
 * @swagger
 * /api/ranking/restaurants:
 *   get:
 *     summary: Top cheap eats — ranked restaurants (one row per restaurant)
 *     description: |
 *       Aggregates votes/comments/likes from all meals per restaurant.
 *       **dishName** = highest-scoring meal at that restaurant; **price** = lowest meal price.
 *
 *       - **suburb** — filter one area (e.g. West End)
 *       - **lat** + **lng** + **radiusKm** — Near me (default 2km)
 *       - **limit** — default 10
 *       - **sortBy** — votes | activity | engagement | popularity (default votes)
 *     tags: [Rankings]
 *     parameters:
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [votes, activity, engagement, popularity]
 *       - in: query
 *         name: suburb
 *         schema:
 *           type: string
 *         example: West End
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         example: 10
 *       - in: query
 *         name: lat
 *         schema:
 *           type: number
 *       - in: query
 *         name: lng
 *         schema:
 *           type: number
 *       - in: query
 *         name: radiusKm
 *         schema:
 *           type: number
 *         example: 2
 *     responses:
 *       200:
 *         description: Ranked restaurant rows for Top cheap eats screen
 */
router.get("/restaurants", getRestaurantRankings);

module.exports = router;
