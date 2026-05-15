const express = require("express");

const {
  createSubmission,
  getListings,
  getListing,
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
 *         price:
 *           type: number
 *           example: 8
 *
 *         latitude:
 *           type: number
 *           description: User device latitude (WGS84), stored on the restaurant for map display
 *           example: -27.4698
 *
 *         longitude:
 *           type: number
 *           description: User device longitude (WGS84), stored on the restaurant for map display
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
 *           description: Map pin latitude (from submission)
 *           example: -27.4698
 *
 *         longitude:
 *           type: number
 *           nullable: true
 *           description: Map pin longitude (from submission)
 *           example: 153.0251
 */


/**
 * @swagger
 * /api/listings:
 *   post:
 *     summary: Create restaurant submission
 *     description: Submit a new cheap food listing for moderation approval. Sends the submitter latitude/longitude; they are saved on the restaurant record for map display.
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


// CREATE SUBMISSION
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
 *     description: Returns all approved restaurant listings
 *     tags:
 *       - Listings
 *
 *     responses:
 *       200:
 *         description: Listings fetched successfully
 *
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *
 *               items:
 *                 $ref: '#/components/schemas/ListingResponse'
 *
 *       500:
 *         description: Internal server error
 */


// GET ALL APPROVED LISTINGS
router.get(
  "/",
  getListings
);


/**
 * @swagger
 * /api/listings/{id}:
 *   get:
 *     summary: Get single listing
 *     description: Fetch single restaurant listing by ID
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
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ListingResponse'
 *
 *       404:
 *         description: Listing not found
 *
 *       500:
 *         description: Internal server error
 */


// GET SINGLE LISTING
router.get(
  "/:id",

  getListing
);

module.exports = router;