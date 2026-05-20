const {
  createComment,

  getMealComments,

  deleteComment,

  hideComment,

  toggleCommentLike,
} = require("../models/comment.model");

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

    const userId = req.user.id;

    if (!mealId || !content) {
      return res.status(400).json({
        success: false,

        message: "mealId and content are required",
      });
    }

    const comment = await createComment({
      mealId: Number(mealId),

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

    const userId = req.user.id;

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