const express = require("express");

const {
  createCommentController,
  getCommentsController,
  deleteCommentController,
  hideCommentController,
  toggleCommentLikeController,
} = require("../controllers/comment.controller");

const authMiddleware = require("../middleware/auth.middleware");

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Comments
 *   description: Community discussion and comment APIs
 */

/**
 * @swagger
 * components:
 *   schemas:
 *
 *     CommentUser:
 *       type: object
 *       description: Comment author
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         name:
 *           type: string
 *           example: Faisal
 *
 *     CommentCounts:
 *       type: object
 *       description: Aggregated engagement counts for a comment or reply
 *       properties:
 *         likes:
 *           type: integer
 *           description: Total likes on this comment (main or reply)
 *           example: 18
 *         replies:
 *           type: integer
 *           description: Total visible direct replies to this comment
 *           example: 5
 *
 *     CommentReply:
 *       type: object
 *       description: Reply comment with engagement counts, author, and optional nested replies
 *       properties:
 *         id:
 *           type: integer
 *           example: 2
 *         content:
 *           type: string
 *           example: I agree
 *         mealId:
 *           type: integer
 *           example: 1
 *         userId:
 *           type: integer
 *           example: 2
 *         parentCommentId:
 *           type: integer
 *           example: 1
 *         isHidden:
 *           type: boolean
 *           example: false
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: 2026-05-19T10:30:00.000Z
 *         _count:
 *           $ref: '#/components/schemas/CommentCounts'
 *         user:
 *           $ref: '#/components/schemas/CommentUser'
 *         replies:
 *           type: array
 *           description: Nested replies (threaded conversation)
 *           items:
 *             $ref: '#/components/schemas/CommentReply'
 *
 *     MealComment:
 *       type: object
 *       description: Top-level meal comment with engagement counts, author, and threaded replies
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         content:
 *           type: string
 *           example: Amazing burger
 *         mealId:
 *           type: integer
 *           example: 1
 *         userId:
 *           type: integer
 *           example: 1
 *         parentCommentId:
 *           type: integer
 *           nullable: true
 *           example: null
 *         isHidden:
 *           type: boolean
 *           example: false
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: 2026-05-19T10:00:00.000Z
 *         _count:
 *           $ref: '#/components/schemas/CommentCounts'
 *         user:
 *           $ref: '#/components/schemas/CommentUser'
 *         replies:
 *           type: array
 *           description: Direct and nested replies to this comment
 *           items:
 *             $ref: '#/components/schemas/CommentReply'
 *
 *     GetMealCommentsResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         count:
 *           type: integer
 *           description: Number of top-level comments returned
 *           example: 1
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/MealComment'
 *
 *     CreateCommentRequest:
 *       type: object
 *       required:
 *         - mealId
 *         - content
 *       properties:
 *         mealId:
 *           type: integer
 *           example: 1
 *         content:
 *           type: string
 *           example: Amazing value for money
 *         parentCommentId:
 *           type: integer
 *           nullable: true
 *           description: Omit or null for a main comment; set to comment id to reply
 *           example: 3
 *
 *     CreateCommentResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: Comment added successfully
 *         data:
 *           $ref: '#/components/schemas/MealComment'
 *
 *     ToggleCommentLikeResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: Comment liked successfully
 *         liked:
 *           type: boolean
 *           description: Whether the comment is liked after this request
 *           example: true
 *         totalLikes:
 *           type: integer
 *           description: Updated total like count for the comment or reply
 *           example: 19
 */

/**
 * @swagger
 * /api/comments:
 *   post:
 *     summary: Create a main comment or reply
 *     description: |
 *       Creates a top-level comment when `parentCommentId` is omitted or null.
 *       Creates a threaded reply when `parentCommentId` references an existing comment.
 *       Likes apply to both main comments and replies via the same toggle-like endpoint.
 *     tags:
 *       - Comments
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateCommentRequest'
 *     responses:
 *       201:
 *         description: Comment or reply created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CreateCommentResponse'
 *       400:
 *         description: Missing required fields
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post("/", authMiddleware, createCommentController);

/**
 * @swagger
 * /api/comments/{mealId}:
 *   get:
 *     summary: Get meal comments with threaded replies and engagement counts
 *     description: |
 *       Returns top-level comments for a meal, each including:
 *       - `_count.likes` and `_count.replies`
 *       - author (`user.id`, `user.name`)
 *       - nested `replies` with the same shape (recursive threading)
 *
 *       Reply and main-comment likes both use `CommentLike` and the toggle-like endpoint.
 *     tags:
 *       - Comments
 *     parameters:
 *       - in: path
 *         name: mealId
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: Comments fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GetMealCommentsResponse'
 *             example:
 *               success: true
 *               count: 1
 *               data:
 *                 - id: 1
 *                   content: Amazing burger
 *                   mealId: 1
 *                   userId: 1
 *                   parentCommentId: null
 *                   isHidden: false
 *                   createdAt: "2026-05-19T10:00:00.000Z"
 *                   _count:
 *                     likes: 18
 *                     replies: 5
 *                   user:
 *                     id: 1
 *                     name: Faisal
 *                   replies:
 *                     - id: 2
 *                       content: I agree
 *                       mealId: 1
 *                       userId: 2
 *                       parentCommentId: 1
 *                       isHidden: false
 *                       createdAt: "2026-05-19T10:15:00.000Z"
 *                       _count:
 *                         likes: 3
 *                         replies: 0
 *                       user:
 *                         id: 2
 *                         name: Ali
 *                       replies: []
 *       500:
 *         description: Internal server error
 */
router.get("/:mealId", getCommentsController);

/**
 * @swagger
 * /api/comments/{commentId}:
 *   delete:
 *     summary: Delete a comment or reply
 *     description: Permanently removes a comment. Works for both main comments and threaded replies.
 *     tags:
 *       - Comments
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: integer
 *         example: 2
 *     responses:
 *       200:
 *         description: Comment deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Comment deleted successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.delete("/:commentId", authMiddleware, deleteCommentController);

/**
 * @swagger
 * /api/comments/hide/{commentId}:
 *   patch:
 *     summary: Hide a comment or reply
 *     description: Soft-hides a comment so it no longer appears in public meal comment threads.
 *     tags:
 *       - Comments
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: integer
 *         example: 2
 *     responses:
 *       200:
 *         description: Comment hidden successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Comment hidden successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.patch("/hide/:commentId", authMiddleware, hideCommentController);

/**
 * @swagger
 * /api/comments/like/{commentId}:
 *   post:
 *     summary: Toggle like on a comment or reply
 *     description: |
 *       Likes or unlikes any comment in the thread (main comment or nested reply).
 *       Returns the updated like state and total like count.
 *     tags:
 *       - Comments
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: Comment like toggled successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ToggleCommentLikeResponse'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post("/like/:commentId", authMiddleware, toggleCommentLikeController);

module.exports = router;