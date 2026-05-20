const prisma = require("../config/prisma");

// ==============================
// CREATE POST
// ==============================

const createCommunityPost = async (data) => {
  return await prisma.communityPost.create({
    data,
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
    },
  },
};

const getAllCommunityPosts = async () => {
  return await prisma.communityPost.findMany({
    select: postListSelect,
    orderBy: {
      createdAt: "desc",
    },
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

const getPostWithComments = async (postId) => {
  return await prisma.communityPost.findUnique({
    where: { id: postId },
    select: {
      id: true,
      title: true,
      comments: {
        orderBy: {
          createdAt: "asc",
        },
        select: {
          id: true,
          body: true,
          createdAt: true,
          user: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  });
};

// ==============================
// ADD COMMENT
// ==============================

const addPostComment = async (postId, userId, body) => {
  const post = await prisma.communityPost.findUnique({
    where: { id: postId },
    select: { id: true },
  });

  if (!post) {
    return null;
  }

  const comment = await prisma.$transaction(async (tx) => {
    const created = await tx.communityPostComment.create({
      data: {
        postId,
        userId,
        body,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
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

  return comment;
};

module.exports = {
  createCommunityPost,
  getAllCommunityPosts,
  getCommunityPostById,
  toggleLike,
  getPostWithComments,
  addPostComment,
};