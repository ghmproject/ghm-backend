const express = require("express");

const router = express.Router();

const authMiddleware = require("../middleware/auth.middleware");
const optionalAuthMiddleware = require("../middleware/optionalAuth.middleware");

const {
  createPost,
  updatePost,
  getPosts,
  getSinglePost,
  likePost,
  getPostForComment,
  createComment,
  likeComment,
  updateComment,
  removeComment,
} = require("../controllers/community.controller");
const {
  uploadOptionalSingleImage,
} = require("../middleware/upload.middleware");

/**
 * @swagger
 * tags:
 *   name: Community
 *   description: Community Feed APIs
 */

/**
 * @swagger
 * tags:
 *   name: Community
 *   description: Community Feed APIs
 */

/**
 * @swagger
 * /api/community/create:
 *   post:
 *     summary: Create a community post
 *     tags: [Community]
 *
 *     security:
 *       - bearerAuth: []
 *
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *
 *             required:
 *               - title
 *               - category
 *               - body
 *
 *             properties:
 *
 *               title:
 *                 type: string
 *                 example: Found $6 pho in the Valley!
 *
 *               category:
 *                 type: string
 *                 example: Finds
 *                 description: Finds, Tips, or Price checks (stored as FINDS, TIPS, PRICE_CHECKS)
 *
 *               body:
 *                 type: string
 *                 description: Comment text (restaurant, meal, suburb, price sab yahan likho)
 *                 example: Pho Queue, beef pho, Fortitude Valley, $8. Huge portion and tasty broth.
 *
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Optional. Leave empty to create a post without a photo.
 *
 *     responses:
 *       201:
 *         description: Post created successfully
 *
 *       401:
 *         description: Unauthorized
 *
 *       500:
 *         description: Internal server error
 */

// CREATE POST
// ==============================
// CREATE POST
// ==============================

router.post("/create", authMiddleware, uploadOptionalSingleImage, createPost);

/**
 * @swagger
 * /api/community/{id}:
 *   patch:
 *     summary: Update a community post (author only)
 *     tags: [Community]
 *
 *     security:
 *       - bearerAuth: []
 *
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               category:
 *                 type: string
 *               body:
 *                 type: string
 *               image:
 *                 type: string
 *                 format: binary
 *               clearImage:
 *                 type: string
 *                 description: Set to "true" to remove the post image
 *
 *     responses:
 *       200:
 *         description: Post updated successfully
 *       403:
 *         description: Not the post author
 *       404:
 *         description: Post not found
 */
router.patch("/:id", authMiddleware, uploadOptionalSingleImage, updatePost);

/**
 * @swagger
 * /api/community:
 *   get:
 *     summary: Get all community posts
 *     tags: [Community]
 *
 *     responses:
 *       200:
 *         description: List of all community posts (each post includes commentsCount for the feed counter)
 *
 *       500:
 *         description: Internal server error
 */

// ==============================
// GET ALL POSTS
// ==============================

router.get("/", optionalAuthMiddleware, getPosts);

/**
 * @swagger
 * /api/community/comment/{postId}:
 *   get:
 *     summary: Get post title and all comments for the comment screen
 *     tags: [Community]
 *
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         example: 4c7f5a14-b5dc-4b53-a5fd-29c31cb8d781
 *
 *     responses:
 *       200:
 *         description: Post title and comments list returned
 *
 *       404:
 *         description: Post not found
 *
 *       500:
 *         description: Internal server error
 */
router.get("/comment/:postId", optionalAuthMiddleware, getPostForComment);

/**
 * @swagger
 * /api/community/comment/{postId}:
 *   post:
 *     summary: Add a comment on a community post
 *     tags: [Community]
 *
 *     security:
 *       - bearerAuth: []
 *
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - body
 *             properties:
 *               body:
 *                 type: string
 *                 example: Great find, will try this weekend!
 *
 *     responses:
 *       201:
 *         description: Comment posted successfully
 *
 *       400:
 *         description: Validation error
 *
 *       401:
 *         description: Unauthorized
 *
 *       404:
 *         description: Post not found
 *
 *       500:
 *         description: Internal server error
 */
router.post("/comment/:postId", authMiddleware, createComment);

router.post("/comments/:commentId/like", authMiddleware, likeComment);
router.patch("/comments/:commentId", authMiddleware, updateComment);
router.delete("/comments/:commentId", authMiddleware, removeComment);

/**
 * @swagger
 * /api/community/{id}:
 *   get:
 *     summary: Get single community post
 *     tags: [Community]
 *
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: 4c7f5a14-b5dc-4b53-a5fd-29c31cb8d781
 *
 *     responses:
 *       200:
 *         description: Single post fetched successfully (includes commentsCount)
 *
 *       404:
 *         description: Post not found
 *
 *       500:
 *         description: Internal server error
 */

// ==============================
// GET SINGLE POST
// ==============================

router.get("/:id", getSinglePost);
/**
 * @swagger
 * /api/community/like/{postId}:
 *   post:
 *     summary: Like or unlike a community post
 *     tags: [Community]
 *
 *     security:
 *       - bearerAuth: []
 *
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *
 *     responses:
 *       200:
 *         description: Like toggled successfully
 */
router.post("/like/:postId", authMiddleware, likePost);
module.exports = router;
