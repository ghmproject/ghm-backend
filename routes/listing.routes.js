const express = require("express");

const {
  createSubmission,
  getListings,
  getListing,
  filterListingController,
  getHotDealsController,
} = require(
  "../controllers/listing.controller"
);

const {
  uploadSingleImage,
  compressImage,
} = require(
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
 *         isHotDeal:
 *           type: boolean
 *           example: true
 *
 *         hotDealStartDateTime:
 *           type: string
 *           format: date-time
 *           example: 2026-05-25T11:00:00
 *
 *         hotDealEndDateTime:
 *           type: string
 *           format: date-time
 *           example: 2026-05-25T14:00:00
 *
 *         hotDealDescription:
 *           type: string
 *           example: Lunch special today only
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
 *           example: https://example.com/momo.webp
 *
 *         status:
 *           type: string
 *           example: PENDING
 *
 *         isHotDeal:
 *           type: boolean
 *           example: true
 *
 *         hotDealStartDateTime:
 *           type: string
 *           format: date-time
 *           example: 2026-05-25T11:00:00.000Z
 *
 *         hotDealEndDateTime:
 *           type: string
 *           format: date-time
 *           example: 2026-05-25T14:00:00.000Z
 *
 *         hotDealDescription:
 *           type: string
 *           example: Dinner deal
 *
 *         remainingMs:
 *           type: number
 *           example: 7200000
 *
 *         countdown:
 *           type: string
 *           example: 2h 0m left
 *
 *         createdAt:
 *           type: string
 *           format: date-time
 *
 *         latitude:
 *           type: number
 *           nullable: true
 *
 *         longitude:
 *           type: number
 *           nullable: true
 */


/**
 * @swagger
 * /api/listings:
 *   post:
 *     summary: Create restaurant submission
 *     description: Submit restaurant meals or hot deals
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


// CREATE LISTING
router.post(
  "/",

  uploadSingleImage,

  compressImage,

  createSubmission
);


/**
 * @swagger
 * /api/listings:
 *   get:
 *     summary: Get all approved, visible listings
 *     description: Returns approved meals that are not auto-hidden (report moderation).
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


// GET LISTINGS
router.get(
  "/",
  getListings
);


/**
 * @swagger
 * /api/listings/filter:
 *   get:
 *     summary: Filter restaurant listings
 *     description: Filter listings by cuisine and maximum price. Only approved, non-hidden meals are returned.
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
 * /api/listings/hot-deals:
 *   get:
 *     summary: Get active hot deals
 *     description: Returns only currently active hot deals for approved, non-hidden meals.
 *     tags:
 *       - Listings
 *
 *     responses:
 *       200:
 *         description: Active hot deals fetched successfully
 *
 *       500:
 *         description: Internal server error
 */


// GET HOT DEALS
router.get(
  "/hot-deals",
  getHotDealsController
);


/**
 * @swagger
 * /api/listings/{id}:
 *   get:
 *     summary: Get single listing
 *     description: Restaurant with meals; only approved, non-hidden meals are included.
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


// GET SINGLE LISTING
router.get(
  "/:id",
  getListing
);

module.exports = router;