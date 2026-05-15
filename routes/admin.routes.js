const express = require("express");
const multer = require("multer");

const {
  getPendingRequests,
  approveRequest,
  rejectRequest,
  importCsvController,
} = require("../controllers/admin.controller");

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

    const isCsvExtension = file.originalname
      .toLowerCase()
      .endsWith(".csv");

    if (isCsvMime || isCsvExtension) {
      cb(null, true);
    } else {
      cb(
        new Error("Only CSV files are allowed"),
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
 *
 *       Required CSV columns:
 *       restaurantName, suburb, dishName, cuisine, price, latitude, longitude, image
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

module.exports = router;