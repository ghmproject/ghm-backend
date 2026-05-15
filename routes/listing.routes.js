const express = require("express");

const {
  createSubmission,
  getListings,
  getListing,
  filterListingController,
} = require("../controllers/listing.controller");

const upload = require(
  "../middleware/upload.middleware"
);

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Listings
 *   description: Restaurant listing APIs
 */


/**
 * @swagger
 * components:
 *   schemas:
 *
 *     CreateListingRequest:
 *       type: object
 *
 *       required:
 *         - restaurantName
 *         - suburb
 *         - dishName
 *         - cuisine
 *         - price
 *         - latitude
 *         - longitude
 *
 *       properties:
 *
 *         restaurantName:
 *           type: string
 *           example: Jack's Kebabs
 *
 *         suburb:
 *           type: string
 *           example: West End
 *
 *         dishName:
 *           type: string
 *           example: Pork Banh Mi
 *
 *         cuisine:
 *           type: string
 *           description: Meal cuisine/category
 *           example: Vietnamese
 *
 *         price:
 *           type: number
 *           example: 8
 *
 *         latitude:
 *           type: number
 *           example: -27.4698
 *
 *         longitude:
 *           type: number
 *           example: 153.0251
 *
 *         image:
 *           type: string
 *           format: binary
 *
 *
 *     ListingResponse:
 *       type: object
 *
 *       properties:
 *
 *         id:
 *           type: integer
 *           example: 1
 *
 *         restaurantName:
 *           type: string
 *           example: Jack's Kebabs
 *
 *         suburb:
 *           type: string
 *           example: West End
 *
 *         dishName:
 *           type: string
 *           example: Pork Banh Mi
 *
 *         cuisine:
 *           type: string
 *           example: Vietnamese
 *
 *         price:
 *           type: number
 *           example: 8
 *
 *         image:
 *           type: string
 *           example: uploads/17472123123-banhmi.jpg
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
 *         latitude:
 *           type: number
 *           nullable: true
 *           example: -27.4698
 *
 *         longitude:
 *           type: number
 *           nullable: true
 *           example: 153.0251
 */


/**
 * @swagger
 * /api/listings:
 *   post:
 *     summary: Create restaurant submission
 *     description: Submit a cheap food listing for moderation approval
 *     tags:
 *       - Listings
 *
 *     requestBody:
 *       required: true
 *
 *       content:
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/CreateListingRequest'
 *
 *     responses:
 *       201:
 *         description: Submission created successfully
 *
 *       400:
 *         description: Validation error
 *
 *       500:
 *         description: Internal server error
 */


router.post(
  "/",
  upload.single("image"),
  createSubmission
);


/**
 * @swagger
 * /api/listings:
 *   get:
 *     summary: Get all approved listings
 *     tags:
 *       - Listings
 *
 *     responses:
 *       200:
 *         description: Listings fetched successfully
 *
 *       500:
 *         description: Internal server error
 */


router.get(
  "/",
  getListings
);

/**
 * @swagger
 * /api/listings/filter:
 *   get:
 *     summary: Filter restaurant listings
 *     description: Filter listings by cuisine and maximum price
 *     tags:
 *       - Listings
 *
 *     parameters:
 *
 *       - in: query
 *         name: cuisine
 *         required: false
 *         schema:
 *           type: string
 *         example: Korean
 *
 *       - in: query
 *         name: maxPrice
 *         required: false
 *         schema:
 *           type: number
 *         example: 12
 *
 *     responses:
 *       200:
 *         description: Filtered listings fetched successfully
 *
 *         content:
 *           application/json:
 *             example:
 *               {
 *                 "success": true,
 *                 "count": 1,
 *                 "data": [
 *                   {
 *                     "id": 1,
 *                     "name": "Momo House",
 *                     "suburb": "South Bank",
 *                     "latitude": -27.4812,
 *                     "longitude": 153.0234,
 *                     "image": "https://example.com/momo.jpg",
 *                     "meals": [
 *                       {
 *                         "id": 2,
 *                         "dishName": "Bibimbap",
 *                         "cuisine": "Korean",
 *                         "price": 10,
 *                         "status": "APPROVED"
 *                       }
 *                     ]
 *                   }
 *                 ]
 *               }
 *
 *       500:
 *         description: Internal server error
 */


// FILTER LISTINGS
router.get(
  "/filter",
  filterListingController
);
/**
 * @swagger
 * /api/listings/{id}:
 *   get:
 *     summary: Get single listing
 *     tags:
 *       - Listings
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
 *         description: Listing fetched successfully
 *
 *       404:
 *         description: Listing not found
 *
 *       500:
 *         description: Internal server error
 */


router.get(
  "/:id",
  getListing
);







module.exports = router;

