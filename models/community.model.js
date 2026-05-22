const prisma = require("../config/prisma");

// ==============================
// CREATE POST
// ==============================

const createCommunityPost = async (data) => {
  return await prisma.communityPost.create({
    data,
    select: postListSelect,
  });
};

// ==============================
// GET ALL POSTS
// ==============================

const postListSelect = {
  id: true,
  userId: true,
  title: true,
  category: true,
  body: true,
  imageUrl: true,
  likesCount: true,
  commentsCount: true,
  createdAt: true,
  user: {
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  },
};

const getLikedPostIdsForUser = async (userId, postIds) => {
  if (!postIds.length) {
    return new Set();
  }

  const rows = await prisma.communityPostLike.findMany({
    where: {
      userId,
      postId: { in: postIds },
    },
    select: { postId: true },
  });

  return new Set(rows.map((row) => row.postId));
};

const getAllCommunityPosts = async () => {
  return await prisma.communityPost.findMany({
    select: postListSelect,
    orderBy: {
      createdAt: "desc",
    },
  });
};

/** Min distinct posts commented on before boosting that author's posts in feed. */
const ENGAGEMENT_MIN_DISTINCT_POSTS = 3;

const getAuthorEngagementForViewer = async (viewerId) => {
  if (!viewerId) {
    return new Map();
  }

  const comments = await prisma.communityPostComment.findMany({
    where: { userId: viewerId },
    select: {
      postId: true,
      post: { select: { userId: true } },
    },
  });

  const distinctPostsByAuthor = new Map();

  for (const row of comments) {
    const authorId = row.post.userId;
    if (!distinctPostsByAuthor.has(authorId)) {
      distinctPostsByAuthor.set(authorId, new Set());
    }
    distinctPostsByAuthor.get(authorId).add(row.postId);
  }

  const scores = new Map();
  for (const [authorId, postIds] of distinctPostsByAuthor) {
    const count = postIds.size;
    if (count >= ENGAGEMENT_MIN_DISTINCT_POSTS) {
      scores.set(authorId, count);
    }
  }

  return scores;
};

const sortPostsByEngagement = (posts, engagementScores) => {
  return [...posts].sort((a, b) => {
    const scoreA = engagementScores.get(a.userId) || 0;
    const scoreB = engagementScores.get(b.userId) || 0;
    const boostedA = scoreA > 0 ? 1 : 0;
    const boostedB = scoreB > 0 ? 1 : 0;

    if (boostedA !== boostedB) {
      return boostedB - boostedA;
    }

    if (scoreA !== scoreB) {
      return scoreB - scoreA;
    }

    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
};

// ==============================
// GET SINGLE POST
// ==============================

const getCommunityPostById = async (id) => {
  return await prisma.communityPost.findUnique({
    where: { id },
    select: postListSelect,
  });
};

// ==============================
// UPDATE POST (author only)
// ==============================

const updateCommunityPost = async (id, userId, data) => {
  const existing = await prisma.communityPost.findUnique({
    where: { id },
    select: { id: true, userId: true },
  });

  if (!existing) {
    return null;
  }

  if (existing.userId !== userId) {
    return "forbidden";
  }

  return await prisma.communityPost.update({
    where: { id },
    data,
    select: postListSelect,
  });
};

const toggleLike = async (postId, userId) => {

  const existingLike =
    await prisma.communityPostLike.findUnique({
      where: {
        postId_userId: {
          postId,
          userId,
        },
      },
    });

  // ==============================
  // UNLIKE
  // ==============================

  if (existingLike) {

    await prisma.communityPostLike.delete({
      where: {
        postId_userId: {
          postId,
          userId,
        },
      },
    });

    await prisma.communityPost.update({
      where: { id: postId },

      data: {
        likesCount: {
          decrement: 1,
        },
      },
    });

    return {
      liked: false,
    };
  }

  // ==============================
  // LIKE
  // ==============================

  await prisma.communityPostLike.create({
    data: {
      postId,
      userId,
    },
  });

  await prisma.communityPost.update({
    where: { id: postId },

    data: {
      likesCount: {
        increment: 1,
      },
    },
  });

  return {
    liked: true,
  };
};

// ==============================
// GET POST + COMMENTS (comment screen)
// ==============================

const commentSelect = {
  id: true,
  userId: true,
  postId: true,
  parentCommentId: true,
  body: true,
  likesCount: true,
  createdAt: true,
  user: {
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  },
};

const getLikedCommentIdsForUser = async (userId, commentIds) => {
  if (!userId || !commentIds.length) {
    return new Set();
  }

  const rows = await prisma.communityPostCommentLike.findMany({
    where: {
      userId,
      commentId: { in: commentIds },
    },
    select: { commentId: true },
  });

  return new Set(rows.map((row) => row.commentId));
};

const buildCommentTree = (rows, likedIds) => {
  const withMeta = rows.map((row) => ({
    ...row,
    likedByMe: likedIds.has(row.id),
    replies: [],
  }));

  const byId = new Map(withMeta.map((row) => [row.id, row]));
  const topLevel = [];

  for (const row of withMeta) {
    if (row.parentCommentId && byId.has(row.parentCommentId)) {
      byId.get(row.parentCommentId).replies.push(row);
    } else if (!row.parentCommentId) {
      topLevel.push(row);
    }
  }

  return topLevel;
};

const getPostWithComments = async (postId, viewerId) => {
  const post = await prisma.communityPost.findUnique({
    where: { id: postId },
    select: {
      id: true,
      title: true,
    },
  });

  if (!post) {
    return null;
  }

  const rows = await prisma.communityPostComment.findMany({
    where: { postId },
    orderBy: { createdAt: "asc" },
    select: commentSelect,
  });

  const likedIds = await getLikedCommentIdsForUser(
    viewerId,
    rows.map((row) => row.id),
  );

  return {
    ...post,
    comments: buildCommentTree(rows, likedIds),
  };
};

// ==============================
// ADD COMMENT
// ==============================

const addPostComment = async (postId, userId, body, parentCommentId = null) => {
  const post = await prisma.communityPost.findUnique({
    where: { id: postId },
    select: { id: true },
  });

  if (!post) {
    return null;
  }

  if (parentCommentId) {
    const parent = await prisma.communityPostComment.findUnique({
      where: { id: parentCommentId },
      select: { id: true, postId: true, parentCommentId: true },
    });

    if (!parent || parent.postId !== postId) {
      return "invalid_parent";
    }

    if (parent.parentCommentId) {
      return "invalid_parent";
    }
  }

  const comment = await prisma.$transaction(async (tx) => {
    const created = await tx.communityPostComment.create({
      data: {
        postId,
        userId,
        body,
        parentCommentId: parentCommentId || null,
      },
      select: commentSelect,
    });

    await tx.communityPost.update({
      where: { id: postId },
      data: {
        commentsCount: {
          increment: 1,
        },
      },
    });

    return created;
  });

  return { ...comment, likedByMe: false, replies: [] };
};

const toggleCommentLike = async (commentId, userId) => {
  const comment = await prisma.communityPostComment.findUnique({
    where: { id: commentId },
    select: { id: true },
  });

  if (!comment) {
    return null;
  }

  const existingLike = await prisma.communityPostCommentLike.findUnique({
    where: {
      commentId_userId: {
        commentId,
        userId,
      },
    },
  });

  if (existingLike) {
    await prisma.$transaction(async (tx) => {
      await tx.communityPostCommentLike.delete({
        where: {
          commentId_userId: {
            commentId,
            userId,
          },
        },
      });

      await tx.communityPostComment.update({
        where: { id: commentId },
        data: {
          likesCount: { decrement: 1 },
        },
      });
    });

    const updated = await prisma.communityPostComment.findUnique({
      where: { id: commentId },
      select: { likesCount: true },
    });

    return {
      liked: false,
      likesCount: updated?.likesCount ?? 0,
    };
  }

  await prisma.$transaction(async (tx) => {
    await tx.communityPostCommentLike.create({
      data: {
        commentId,
        userId,
      },
    });

    await tx.communityPostComment.update({
      where: { id: commentId },
      data: {
        likesCount: { increment: 1 },
      },
    });
  });

  const updated = await prisma.communityPostComment.findUnique({
    where: { id: commentId },
    select: { likesCount: true },
  });

  return {
    liked: true,
    likesCount: updated?.likesCount ?? 0,
  };
};

const updatePostComment = async (commentId, userId, body) => {
  const existing = await prisma.communityPostComment.findUnique({
    where: { id: commentId },
    select: { id: true, userId: true },
  });

  if (!existing) {
    return null;
  }

  if (existing.userId !== userId) {
    return "forbidden";
  }

  const updated = await prisma.communityPostComment.update({
    where: { id: commentId },
    data: { body },
    select: commentSelect,
  });

  return { ...updated, likedByMe: false, replies: [] };
};

const deletePostComment = async (commentId, userId) => {
  const existing = await prisma.communityPostComment.findUnique({
    where: { id: commentId },
    select: {
      id: true,
      userId: true,
      postId: true,
      _count: { select: { replies: true } },
    },
  });

  if (!existing) {
    return null;
  }

  if (existing.userId !== userId) {
    return "forbidden";
  }

  const removeCount = 1 + existing._count.replies;

  await prisma.$transaction(async (tx) => {
    await tx.communityPostComment.delete({
      where: { id: commentId },
    });

    await tx.communityPost.update({
      where: { id: existing.postId },
      data: {
        commentsCount: {
          decrement: removeCount,
        },
      },
    });
  });

  return { postId: existing.postId };
};

module.exports = {
  createCommunityPost,
  getAllCommunityPosts,
  getCommunityPostById,
  getLikedPostIdsForUser,
  getAuthorEngagementForViewer,
  sortPostsByEngagement,
  updateCommunityPost,
  toggleLike,
  getPostWithComments,
  addPostComment,
  toggleCommentLike,
  updatePostComment,
  deletePostComment,
};