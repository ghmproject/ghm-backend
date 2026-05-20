const prisma = require("../config/prisma");

const VISIBLE_REPLY = { isHidden: false };

const COMMENT_COUNTS_SELECT = {
  likes: true,
  replies: {
    where: VISIBLE_REPLY,
  },
};

const COMMENT_USER_SELECT = {
  id: true,
  name: true,
};

/**
 * Builds a recursive Prisma include for threaded comments.
 * Each level includes user, like/reply counts, and nested visible replies.
 */
const buildCommentInclude = (depth = 0, maxDepth = 10) => {
  const include = {
    user: {
      select: COMMENT_USER_SELECT,
    },
    _count: {
      select: COMMENT_COUNTS_SELECT,
    },
  };

  if (depth < maxDepth) {
    include.replies = {
      where: VISIBLE_REPLY,
      orderBy: { createdAt: "asc" },
      include: buildCommentInclude(depth + 1, maxDepth),
    };
  }

  return include;
};

// =========================================
// CREATE COMMENT / REPLY
// =========================================
const createComment = async ({
  mealId,
  userId,
  content,
  parentCommentId,
}) => {
  return await prisma.comment.create({
    data: {
      mealId,
      userId,
      content,
      parentCommentId: parentCommentId || null,
    },
    include: {
      user: {
        select: COMMENT_USER_SELECT,
      },
    },
  });
};

// =========================================
// GET COMMENTS BY MEAL
// =========================================
const getMealComments = async (mealId) => {
  return await prisma.comment.findMany({
    where: {
      mealId: Number(mealId),
      isHidden: false,
      parentCommentId: null,
    },
    include: buildCommentInclude(),
    orderBy: {
      createdAt: "desc",
    },
  });
};

// =========================================
// DELETE COMMENT
// =========================================
const deleteComment = async (commentId) => {
  return await prisma.comment.delete({
    where: {
      id: Number(commentId),
    },
  });
};

// =========================================
// HIDE COMMENT
// =========================================
const hideComment = async (commentId) => {
  return await prisma.comment.update({
    where: {
      id: Number(commentId),
    },
    data: {
      isHidden: true,
    },
  });
};

// =========================================
// TOGGLE COMMENT LIKE
// =========================================
const toggleCommentLike = async ({ commentId, userId }) => {
  const comment = await prisma.comment.findUnique({
    where: {
      id: commentId,
    },
  });

  if (!comment) {
    throw new Error("Comment not found");
  }

  const existingLike = await prisma.commentLike.findUnique({
    where: {
      commentId_userId: {
        commentId,
        userId,
      },
    },
  });

  if (existingLike) {
    await prisma.commentLike.delete({
      where: {
        id: existingLike.id,
      },
    });

    const totalLikes = await prisma.commentLike.count({
      where: {
        commentId,
      },
    });

    return {
      liked: false,
      totalLikes,
    };
  }

  await prisma.commentLike.create({
    data: {
      commentId,
      userId,
    },
  });

  const totalLikes = await prisma.commentLike.count({
    where: {
      commentId,
    },
  });

  return {
    liked: true,
    totalLikes,
  };
};

module.exports = {
  createComment,
  getMealComments,
  deleteComment,
  hideComment,
  toggleCommentLike,
};