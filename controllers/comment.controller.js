const {
  createComment,

  getMealComments,

  deleteComment,

  hideComment,

  toggleCommentLike,
} = require("../models/comment.model");
const { resolveAuthUserId } = require("../utils/resolveAuthUser");
const prisma = require("../config/prisma");

// =========================================
// CREATE COMMENT / REPLY
// =========================================
const createCommentController = async (req, res) => {
  try {
    const {
      mealId,

      content,

      parentCommentId,
    } = req.body;

    const userId = await resolveAuthUserId(req.user);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Sign in again to comment",
      });
    }

    if (!mealId || !content) {
      return res.status(400).json({
        success: false,

        message: "mealId and content are required",
      });
    }

    const mealIdNum = Number(mealId);
    const meal = await prisma.meal.findUnique({
      where: { id: mealIdNum },
      select: { id: true },
    });

    if (!meal) {
      return res.status(404).json({
        success: false,
        message: "Meal not found",
      });
    }

    if (parentCommentId != null) {
      const parent = await prisma.comment.findUnique({
        where: { id: Number(parentCommentId) },
        select: { id: true, mealId: true },
      });
      if (!parent || parent.mealId !== mealIdNum) {
        return res.status(400).json({
          success: false,
          message: "Invalid reply target",
        });
      }
    }

    const comment = await createComment({
      mealId: mealIdNum,

      userId,

      content,

      parentCommentId,
    });

    return res.status(201).json({
      success: true,

      message: parentCommentId
        ? "Reply added successfully"
        : "Comment added successfully",

      data: comment,
    });
  } catch (error) {
    console.log(error);

    if (error?.code === "P2003") {
      return res.status(401).json({
        success: false,
        message: "Sign in again to comment",
      });
    }

    return res.status(500).json({
      success: false,

      message: "Internal server error",
    });
  }
};

// =========================================
// GET COMMENTS
// =========================================
const getCommentsController = async (req, res) => {
  try {
    const { mealId } = req.params;

    const comments = await getMealComments(mealId);

    return res.status(200).json({
      success: true,

      count: comments.length,

      data: comments,
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,

      message: "Internal server error",
    });
  }
};

// =========================================
// DELETE COMMENT
// =========================================
const deleteCommentController = async (req, res) => {
  try {
    const { commentId } = req.params;

    await deleteComment(commentId);

    return res.status(200).json({
      success: true,

      message: "Comment deleted successfully",
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,

      message: "Internal server error",
    });
  }
};

// =========================================
// HIDE COMMENT
// =========================================
const hideCommentController = async (req, res) => {
  try {
    const { commentId } = req.params;

    await hideComment(commentId);

    return res.status(200).json({
      success: true,

      message: "Comment hidden successfully",
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,

      message: "Internal server error",
    });
  }
};

// =========================================
// TOGGLE COMMENT LIKE
// =========================================
const toggleCommentLikeController = async (req, res) => {
  try {
    const { commentId } = req.params;

    const userId = await resolveAuthUserId(req.user);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Sign in again to like comments",
      });
    }

    const result = await toggleCommentLike({
      commentId: Number(commentId),

      userId,
    });

    return res.status(200).json({
      success: true,

      message: result.liked
        ? "Comment liked successfully"
        : "Comment unliked successfully",

      liked: result.liked,

      totalLikes: result.totalLikes,
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,

      message: "Internal server error",
    });
  }
};

module.exports = {
  createCommentController,

  getCommentsController,

  deleteCommentController,

  hideCommentController,

  toggleCommentLikeController,
};