const express = require("express");
const multer = require("multer");

const {
  getPendingRequests,   
  approveRequest,
  rejectRequest,
  importCsvController,
  exportCsvController,
  getReportedListings,
  restoreListing,
  rejectReportedListing,
} = require("../controllers/admin.controller");

const {
  searchRestaurantsController,
} = require("../controllers/restaurantSearch.controller");

const authMiddleware = require(
  "../middleware/auth.middleware"
);

const adminMiddleware = require(
  "../middleware/admin.middleware"
);

const router = express.Router();

// ======================================
// CSV UPLOAD (multer)
// ======================================
const csvUpload = multer({
  storage: multer.memoryStorage(),

  limits: {
    fileSize: 5 * 1024 * 1024,
  },

  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "text/csv",
      "application/csv",
      "application/vnd.ms-excel",
      "text/plain",
    ];

    const isCsvMime = allowedTypes.includes(
      file.mimetype
    );

    const lowerName = file.originalname.toLowerCase();
    const isAllowedExtension =
      lowerName.endsWith(".csv") ||
      lowerName.endsWith(".xlsx") ||
      lowerName.endsWith(".xls");

    if (isCsvMime || isAllowedExtension) {
      cb(null, true);
    } else {
      cb(
        new Error("Only .csv or Excel (.xlsx, .xls) files are allowed"),
        false
      );
    }
  },
});

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
 *         image:
 *           type: string
 *           nullable: true
 *           example: https://res.cloudinary.com/demo/image/upload/sample.jpg
 *
 *         status:
 *           type: string
 *           example: PENDING
 *
 *         isHidden:
 *           type: boolean
 *           example: false
 *
 *         hiddenAt:
 *           type: string
 *           format: date-time
 *           nullable: true
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
 * /api/admin/reported-listings:
 *   get:
 *     summary: Get hidden or reported meals
 *     description: |
 *       Returns meals currently auto-hidden from the map (3+ reports), with report details for review.
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Reported or hidden listings fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 count:
 *                   type: integer
 *                   example: 2
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin only
 *       500:
 *         description: Internal server error
 */


router.get(
  "/reported-listings",

  authMiddleware,

  adminMiddleware,

  getReportedListings
);


/**
 * @swagger
 * /api/admin/restore-listing/{mealId}:
 *   patch:
 *     summary: Restore a hidden listing
 *     description: Clears auto-hide flags after admin review (isHidden false, hiddenAt null).
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: mealId
 *         required: true
 *         schema:
 *           type: integer
 *         example: 12
 *     responses:
 *       200:
 *         description: Listing restored successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ModerationResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin only
 *       404:
 *         description: Meal not found
 *       500:
 *         description: Internal server error
 */


router.patch(
  "/restore-listing/:mealId",

  authMiddleware,

  adminMiddleware,

  restoreListing
);


/**
 * @swagger
 * /api/admin/reject-listing/{mealId}:
 *   patch:
 *     summary: Soft-reject a reported listing
 *     description: |
 *       Sets meal status to REJECTED and clears hide flags so it no longer appears in public listings.
 *       Does not delete the meal row (reports and history remain).
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: mealId
 *         required: true
 *         schema:
 *           type: integer
 *         example: 12
 *     responses:
 *       200:
 *         description: Listing rejected successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ModerationResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin only
 *       404:
 *         description: Meal not found
 *       500:
 *         description: Internal server error
 */


router.patch(
  "/reject-listing/:mealId",

  authMiddleware,

  adminMiddleware,

  rejectReportedListing
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


/**
 * @swagger
 * components:
 *   schemas:
 *     CsvImportResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: CSV imported successfully
 *         restaurantsCreated:
 *           type: integer
 *           example: 5
 *         mealsCreated:
 *           type: integer
 *           example: 20
 *         skippedRows:
 *           type: integer
 *           example: 2
 */


/**
 * @swagger
 * /api/admin/import-csv:
 *   post:
 *     summary: Import restaurants and meals from CSV
 *     description: |
 *       Admin-only endpoint. Uploads a CSV file and imports data into
 *       existing Restaurant and Meal tables.
 *
 *       For each row:
 *       - Finds or creates a restaurant by name + suburb
 *       - Creates a meal linked to that restaurant with APPROVED status
 *       - Uploads the `image` column to Cloudinary (folder GHMProject) when it is
 *         an http(s) URL or a valid local file path; existing Cloudinary URLs are kept as-is
 *
 *       Required CSV columns:
 *       restaurantName, suburb (full address), dishName, cuisine, price, image
 *
 *       Latitude/longitude are resolved server-side from the address in `suburb`.
 *     tags:
 *       - Admin
 *
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: CSV file with restaurant and meal data
 *
 *     responses:
 *       200:
 *         description: CSV imported successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CsvImportResponse'
 *             example:
 *               success: true
 *               message: CSV imported successfully
 *               restaurantsCreated: 5
 *               mealsCreated: 20
 *               skippedRows: 2
 *
 *       400:
 *         description: Invalid or missing CSV file
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: CSV file is required (field file)
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
// RESTAURANT SEARCH (indexed FTS)
// ======================================
router.get(
  "/restaurants/search",
  authMiddleware,
  adminMiddleware,
  searchRestaurantsController
);

// ======================================
// IMPORT CSV
// ======================================
router.post(
  "/import-csv",

  authMiddleware,

  adminMiddleware,

  (req, res, next) => {
    csvUpload.single("file")(
      req,
      res,
      (err) => {
        if (err) {
          return res.status(400).json({
            success: false,
            message:
              err.message ||
              "File upload failed",
          });
        }

        next();
      }
    );
  },

  importCsvController
);

// ======================================
// EXPORT CSV
// ======================================
router.get(
  "/export-csv",
  authMiddleware,
  adminMiddleware,
  exportCsvController,
);

module.exports = router;