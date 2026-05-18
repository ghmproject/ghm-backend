const express = require("express");

const { getNearbyListings } = require("../controllers/nearbyListing.controller");

const router = express.Router();

/**
 * @swagger
 * /api/listingNearby/nearby:
 *   get:
 *     summary: Get nearby restaurant listings
 *     description: Returns approved, non-hidden meal offers whose restaurants have coordinates, within 5km of the given user location (nearest first).
 *     tags: [NearbyListings]
 *
 *     parameters:
 *       - in: query
 *         name: lat
 *         required: true
 *         description: User latitude
 *         schema:
 *           type: number
 *         example: -27.4698
 *
 *       - in: query
 *         name: lng
 *         required: true
 *         description: User longitude
 *         schema:
 *           type: number
 *         example: 153.0251
 *
 *     responses:
 *       200:
 *         description: Nearby listings fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         description: Meal id
 *                       restaurantName:
 *                         type: string
 *                       dishName:
 *                         type: string
 *                       address:
 *                         type: string
 *                         description: Suburb / area label from the listing
 *                       latitude:
 *                         type: number
 *                       longitude:
 *                         type: number
 *                       price:
 *                         type: number
 *             example:
 *               success: true
 *               data:
 *                 - id: 1
 *                   restaurantName: "Momo House"
 *                   dishName: "8pc Steamed Momos"
 *                   address: "South Bank"
 *                   latitude: -27.4812
 *                   longitude: 153.0234
 *                   price: 7
 *                 - id: 2
 *                   restaurantName: "Burger Spot"
 *                   dishName: "Cheese Burger"
 *                   address: "West End"
 *                   latitude: -27.4820
 *                   longitude: 153.0189
 *                   price: 10
 *
 *       400:
 *         description: Invalid or missing coordinates
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: "Query parameter `lat` is required."
 *
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: "Internal Server Error"
 */

router.get("/nearby", getNearbyListings);

module.exports = router;